import type { EyePower } from '@/types';

interface DeviationDisplayProps {
  ai: EyePower | null | undefined;
  manual: EyePower | null | undefined;
  label: string;
}

function absDiff(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null) return null;
  return Math.abs(b - a);
}

function fmtDev(val: number | null): string {
  if (val == null) return '—';
  return val.toFixed(2);
}

function deviationClass(val: number | null, threshold: number): string {
  if (val == null) return 'text-muted-foreground';
  if (val <= threshold) return 'text-green-600 dark:text-green-400';
  if (val <= threshold * 2) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function DeviationDisplay({ ai, manual, label }: DeviationDisplayProps) {
  if (!ai || !manual) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const dSph = absDiff(ai.sph, manual.sph);
  const dCyl = absDiff(ai.cyl, manual.cyl);
  const dAxis = absDiff(ai.axis, manual.axis);
  const dAdd = absDiff(ai.add, manual.add);

  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-medium">
        <span>
          <span className="text-muted-foreground font-normal">Sph:</span>{' '}
          <span className={deviationClass(dSph, 0.25)}>{fmtDev(dSph)}</span>
        </span>
        <span>
          <span className="text-muted-foreground font-normal">Cyl:</span>{' '}
          <span className={deviationClass(dCyl, 0.25)}>{fmtDev(dCyl)}</span>
        </span>
        <span>
          <span className="text-muted-foreground font-normal">Axis:</span>{' '}
          <span className={deviationClass(dAxis, 5)}>{fmtDev(dAxis)}</span>
        </span>
        <span>
          <span className="text-muted-foreground font-normal">Add:</span>{' '}
          <span className={deviationClass(dAdd, 0.25)}>{fmtDev(dAdd)}</span>
        </span>
      </div>
    </div>
  );
}
