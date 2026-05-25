export async function extractTextFromPdf(pdfFile: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const Y_TOLERANCE = 3;
  const CELL_GAP_THRESHOLD = 9;
  const COLUMN_ASSIGN_TOLERANCE = 36;
  const TABLE_HEADER_KEYWORDS = ['parameter', 'method', 'u.m', 'result', 'uncertainty', 'loq', 'limiti', 'ref.limit'];

  type PositionedItem = { str: string; x: number; y: number; width: number };

  const normalizeCellText = (value: string) =>
    value.replace(/\s+/g, ' ').replace(/\s+([,.;:)\]])/g, '$1').replace(/([([])\s+/g, '$1').trim();

  const mergeRowIntoCells = (items: PositionedItem[]) => {
    const sorted = [...items].sort((a, b) => a.x - b.x);
    const cells: Array<{ text: string; x: number; center: number }> = [];
    let current: { tokens: string[]; x: number; endX: number } | null = null;

    for (const item of sorted) {
      const token = item.str.trim();
      if (!token) continue;
      if (!current) {
        current = { tokens: [token], x: item.x, endX: item.x + item.width };
        continue;
      }
      const gap = item.x - current.endX;
      if (gap > CELL_GAP_THRESHOLD) {
        const text = normalizeCellText(current.tokens.join(' '));
        if (text) cells.push({ text, x: current.x, center: current.x + (current.endX - current.x) / 2 });
        current = { tokens: [token], x: item.x, endX: item.x + item.width };
      } else {
        current.tokens.push(token);
        current.endX = Math.max(current.endX, item.x + item.width);
      }
    }
    if (current) {
      const text = normalizeCellText(current.tokens.join(' '));
      if (text) cells.push({ text, x: current.x, center: current.x + (current.endX - current.x) / 2 });
    }
    return cells;
  };

  const isTableHeader = (cells: Array<{ text: string }>) => {
    const rowText = cells.map((c) => c.text.toLowerCase()).join(' ');
    return TABLE_HEADER_KEYWORDS.filter((keyword) => rowText.includes(keyword)).length >= 2;
  };

  const alignCellsToAnchors = (cells: Array<{ text: string; center: number }>, anchors: number[]) => {
    const buckets: string[][] = Array.from({ length: anchors.length }, () => []);
    for (const cell of cells) {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < anchors.length; i++) {
        const distance = Math.abs(cell.center - anchors[i]);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = i; }
      }
      if (bestDistance <= COLUMN_ASSIGN_TOLERANCE || anchors.length <= 3) {
        buckets[bestIndex].push(cell.text);
      }
    }
    return buckets.map((bucket) => normalizeCellText(bucket.join(' '))).filter(Boolean);
  };

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const positionedItems: PositionedItem[] = [];

    for (const item of content.items as any[]) {
      const token = item.str?.trim();
      if (!token) continue;
      const x = Number(item.transform?.[4] ?? 0);
      const y = Number(item.transform?.[5] ?? 0);
      const width = Number(item.width ?? token.length * 4.8);
      positionedItems.push({ str: token, x, y, width });
    }

    const rows: Array<{ y: number; items: PositionedItem[] }> = [];
    for (const item of positionedItems) {
      const existing = rows.find((row) => Math.abs(row.y - item.y) <= Y_TOLERANCE);
      if (existing) existing.items.push(item);
      else rows.push({ y: item.y, items: [item] });
    }

    const sortedRows = rows.sort((a, b) => b.y - a.y).map((row) => ({ ...row, items: row.items.sort((a, b) => a.x - b.x) }));

    let tableAnchors: number[] | null = null;
    let sparseTableRows = 0;

    for (const row of sortedRows) {
      const cells = mergeRowIntoCells(row.items);
      if (cells.length === 0) continue;

      if (isTableHeader(cells)) {
        tableAnchors = cells.map((cell) => cell.center);
        sparseTableRows = 0;
        fullText += cells.map((cell) => cell.text).join('\t') + '\n';
        continue;
      }

      if (tableAnchors && cells.length >= 2) {
        const aligned = alignCellsToAnchors(cells, tableAnchors);
        if (aligned.length >= 2) {
          fullText += aligned.join('\t') + '\n';
          sparseTableRows = 0;
          continue;
        }
      }

      if (cells.length >= 3) {
        fullText += cells.map((cell) => cell.text).join('\t') + '\n';
        sparseTableRows = 0;
      } else {
        fullText += cells.map((cell) => cell.text).join(' ') + '\n';
        if (tableAnchors) {
          sparseTableRows += 1;
          if (sparseTableRows >= 4) tableAnchors = null;
        }
      }
    }
    fullText += '\n--- PAGE BREAK ---\n';
  }
  return fullText;
}
