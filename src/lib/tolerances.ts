/**
 * Axis tolerance based on the Manual Rx CYL power:
 *   |CYL| ≤ 0.25  → 15°  (low cylinder, axis matters less)
 *   |CYL| ≤ 1.00  → 10°
 *   |CYL| > 1.00  → 5°   (high cylinder, axis must be precise)
 *   CYL unknown   → 5°   (strictest fallback)
 */
export function axisToleranceFromCyl(manualCyl: number | null | undefined): number {
  if (manualCyl == null) return 5;
  const abs = Math.abs(manualCyl);
  if (abs <= 0.25) return 15;
  if (abs <= 1.0) return 10;
  return 5;
}

/**
 * Circular axis difference wrapped at 180°.
 * Axis values range 0–180 where 0° and 180° are the same meridian.
 * e.g. axisDiff(180, 20) = 20, not 160.
 */
export function axisDiff(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null) return null;
  const diff = Math.abs(a - b);
  return Math.min(diff, 180 - diff);
}
