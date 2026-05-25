export const PRODUCT_LINES = ['Classic', 'Sparkling', 'No Regrets'] as const;
export type ProductLine = typeof PRODUCT_LINES[number];

export function getCompletenessColor(val: number): string {
  if (val < 40) return '#a04040';
  if (val < 70) return '#c09040';
  if (val < 85) return '#b8975a';
  return '#4a8c5c';
}

export function getLineBadge(line: string): string {
  const styles: Record<string, string> = {
    Classic: 'bg-[#b8975a]/15 text-[#b8975a] border-[#b8975a]/20',
    Sparkling: 'bg-[#4a7cc0]/15 text-[#6a9ce0] border-[#4a7cc0]/20',
    'No Regrets': 'bg-[#4a8c5c]/15 text-[#5aac6c] border-[#4a8c5c]/20',
  };
  return styles[line] || styles.Classic;
}
