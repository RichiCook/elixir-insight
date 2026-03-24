

# Fix: PDF Text Extraction Losing Table Structure

## Problem

The `extractTextFromPdf` function in `AdminAiUpload.tsx` (line 446) joins all PDF text items with spaces:
```javascript
text += content.items.map((item: any) => item.str).join(' ') + '\n';
```

This destroys all table structure. The Negroni lab report has data spread across 6 pages with three nutritional tables (per-100g, per-100ml, per-serving) plus mineral analysis — when flattened, the AI cannot tell which value belongs to which table/column, causing missing or incorrectly sourced fields.

## Solution

Replace the naive text extraction with **coordinate-based table reconstruction** using PDF.js's `transform` matrix (X/Y positions per text item). Group items by Y-coordinate into rows, sort by X within each row, and output tab-separated values for tabular rows.

## Changes

### 1. `src/pages/AdminAiUpload.tsx` — Replace `extractTextFromPdf` (lines 437-449)

Replace the current 12-line function with coordinate-aware extraction:

- For each page, get all text items with their `transform[4]` (X) and `transform[5]` (Y) positions
- Group items by Y-coordinate with ~3px tolerance to form rows
- Sort rows top-to-bottom (descending Y — PDF coordinate system is bottom-up)
- Within each row, sort items left-to-right by X
- If a row has 3+ items → format as **tab-separated** (preserves column alignment)
- If a row has 1-2 items → join with spaces (normal prose)
- Add `--- PAGE BREAK ---` between pages

This produces output like:
```
Grassi / Fat	g/100 ml	0,00
Carboidrati / Carbohydrate	g/100 ml	10,89
```
instead of:
```
Grassi / Fat g/100 ml 0,00 Carboidrati / Carbohydrate g/100 ml 10,89
```

### 2. `supabase/functions/analyze-tech-sheet/index.ts` — Add format note to system prompt

Add a short preamble at the very beginning of the system prompt (before "STEP 1"):

```
INPUT FORMAT: The document text preserves table structure using tab-separated columns.
Table rows appear as: Parameter\tMethod\tUnit\tResult\tLOQ\tUncertainty
Use the tab structure to correctly match each value to its column (Parameter, Unit, Result, etc.).
```

This tells the AI model to interpret tabs as column delimiters, making extraction far more reliable.

### 3. No database or migration changes needed

This is purely a client-side PDF parsing fix + edge function prompt update.

## Technical Detail

```typescript
const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const Y_TOLERANCE = 3;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const rowMap = new Map<number, Array<{str: string, x: number}>>();

    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
      if (!rowMap.has(y)) rowMap.set(y, []);
      rowMap.get(y)!.push({ str: item.str, x: item.transform[4] });
    }

    const sortedRows = Array.from(rowMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([_, items]) => items.sort((a, b) => a.x - b.x));

    for (const row of sortedRows) {
      if (row.length >= 3) {
        fullText += row.map(i => i.str.trim()).join('\t') + '\n';
      } else {
        fullText += row.map(i => i.str.trim()).join(' ') + '\n';
      }
    }
    fullText += '\n--- PAGE BREAK ---\n';
  }
  return fullText;
};
```

