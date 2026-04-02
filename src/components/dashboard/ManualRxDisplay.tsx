import type { ManualRx } from '@/types';
import { EyePowerDisplay } from './EyePowerDisplay';

interface ManualRxDisplayProps {
  manualRx: ManualRx | null;
}

export function ManualRxDisplay({ manualRx }: ManualRxDisplayProps) {
  if (!manualRx || (manualRx.right_sph == null && manualRx.left_sph == null)) {
    return <span className="text-sm text-muted-foreground">Not entered</span>;
  }

  const right = {
    sph: manualRx.right_sph,
    cyl: manualRx.right_cyl,
    axis: manualRx.right_axis,
    add: manualRx.right_add,
  };

  const left = {
    sph: manualRx.left_sph,
    cyl: manualRx.left_cyl,
    axis: manualRx.left_axis,
    add: manualRx.left_add,
  };

  return (
    <div className="space-y-1.5">
      <EyePowerDisplay eye={right} label="Right" />
      <EyePowerDisplay eye={left} label="Left" />
    </div>
  );
}
