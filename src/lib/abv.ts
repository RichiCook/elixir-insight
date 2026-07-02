// Single source of truth for how alcohol strength is shown across the UX.
// The stored `abv` field is inconsistent ("21.5", "14.6 VOL", "21.50 ml/100ml",
// numbers), so we extract the number and render the canonical unit.

/** Extract the numeric part of a messy ABV value. "14.6 VOL" → "14.6". */
export function parseAbvNumber(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const m = String(raw).match(/\d+(?:[.,]\d+)?/);
  return m ? m[0].replace(',', '.') : null;
}

/** Canonical unit suffix. Rendered verbatim — do not apply text-transform. */
export const ABV_UNIT = '% alc./vol.';

/** Canonical full format, e.g. "21.5% alc./vol." Returns '' when there's no value. */
export function formatAbv(raw: unknown): string {
  const n = parseAbvNumber(raw);
  return n ? `${n}${ABV_UNIT}` : '';
}
