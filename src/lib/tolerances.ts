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
