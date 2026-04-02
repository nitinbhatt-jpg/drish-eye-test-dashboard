import type { EyePower } from '@/types';

interface EyePowerDisplayProps {
  eye: EyePower | undefined | null;
  label: string;
}

function fmtVal(val: number | null | undefined): string {
  if (val == null) return '—';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

export function EyePowerDisplay({ eye, label }: EyePowerDisplayProps) {
  if (!eye) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
        <span><span className="text-muted-foreground">Sph:</span> {fmtVal(eye.sph)}</span>
        <span><span className="text-muted-foreground">Cyl:</span> {fmtVal(eye.cyl)}</span>
        <span><span className="text-muted-foreground">Axis:</span> {eye.axis}</span>
        <span><span className="text-muted-foreground">Add:</span> {fmtVal(eye.add)}</span>
      </div>
    </div>
  );
}
