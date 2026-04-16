/**
 * Axis tolerance is dynamic based on the CYL deviation between AI and Manual:
 *   CYL deviation ≤ 0.25  → 15°
 *   CYL deviation ≤ 1.00  → 10°
 *   CYL deviation > 1.00  → 5°
 *   CYL deviation unknown  → 5° (strictest fallback)
 */
export function axisToleranceFromCylDev(cylDev: number | null | undefined): number {
  if (cylDev == null) return 5;
  if (cylDev <= 0.25) return 15;
  if (cylDev <= 1.0) return 10;
  return 5;
}
