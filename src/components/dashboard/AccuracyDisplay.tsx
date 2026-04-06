import type { EyePower, FinalPrescription, ManualRx } from '@/types';

interface AccuracyDisplayProps {
  ai: FinalPrescription | null | undefined;
  manual: ManualRx | null | undefined;
}

function collectScores(
  ai: EyePower | null | undefined,
  mSph: number | null,
  mCyl: number | null,
  mAxis: number | null,
  mAdd: number | null,
): number[] {
  if (!ai) return [];
  const scores: number[] = [];
  if (ai.sph != null && mSph != null) scores.push(Math.abs(ai.sph - mSph) <= 0.25 ? 1 : 0);
  if (ai.cyl != null && mCyl != null) scores.push(Math.abs(ai.cyl - mCyl) <= 0.25 ? 1 : 0);
  if (ai.axis != null && mAxis != null) scores.push(Math.abs(ai.axis - mAxis) <= 10 ? 1 : 0);
  if (ai.add != null && mAdd != null) scores.push(Math.abs(ai.add - mAdd) <= 0.25 ? 1 : 0);
  return scores;
}

function pctColor(pct: number): string {
  if (pct >= 0.99) return 'text-green-600 dark:text-green-400';
  if (pct >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function AccuracyDisplay({ ai, manual }: AccuracyDisplayProps) {
  if (!ai || !manual) {
    return <span className="text-sm text-muted-foreground italic">Enter Manual Rx</span>;
  }

  const rightScores = collectScores(ai.right, manual.right_sph, manual.right_cyl, manual.right_axis, manual.right_add);
  const leftScores = collectScores(ai.left, manual.left_sph, manual.left_cyl, manual.left_axis, manual.left_add);
  const allScores = [...rightScores, ...leftScores];

  if (allScores.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const accuracy = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const pct = `${Math.round(accuracy * 100)}%`;
  const passed = allScores.filter((s) => s === 1).length;

  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${pctColor(accuracy)}`}>{pct}</p>
      <p className="text-[11px] text-muted-foreground">{passed}/{allScores.length} params</p>
    </div>
  );
}
