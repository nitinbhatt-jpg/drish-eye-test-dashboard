import { useState } from 'react';
import { PenLine, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertManualRx } from '@/api/manualRx';
import type { ManualRx } from '@/types';
import { toast } from 'sonner';

interface ManualRxEditorProps {
  sessionId: string;
  manualRx: ManualRx | null;
  onSaved: (rx: ManualRx) => void;
}

interface EyeFields {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

function toNum(val: string): number | null {
  if (val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function initEye(sph: number | null, cyl: number | null, axis: number | null, add: number | null): EyeFields {
  return {
    sph: sph != null ? String(sph) : '',
    cyl: cyl != null ? String(cyl) : '',
    axis: axis != null ? String(axis) : '',
    add: add != null ? String(add) : '',
  };
}

export function ManualRxEditor({ sessionId, manualRx, onSaved }: ManualRxEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [right, setRight] = useState<EyeFields>(() =>
    initEye(manualRx?.right_sph ?? null, manualRx?.right_cyl ?? null, manualRx?.right_axis ?? null, manualRx?.right_add ?? null),
  );
  const [left, setLeft] = useState<EyeFields>(() =>
    initEye(manualRx?.left_sph ?? null, manualRx?.left_cyl ?? null, manualRx?.left_axis ?? null, manualRx?.left_add ?? null),
  );

  function handleOpen() {
    setRight(initEye(manualRx?.right_sph ?? null, manualRx?.right_cyl ?? null, manualRx?.right_axis ?? null, manualRx?.right_add ?? null));
    setLeft(initEye(manualRx?.left_sph ?? null, manualRx?.left_cyl ?? null, manualRx?.left_axis ?? null, manualRx?.left_add ?? null));
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await upsertManualRx({
        session_id: sessionId,
        right_sph: toNum(right.sph),
        right_cyl: toNum(right.cyl),
        right_axis: toNum(right.axis),
        right_add: toNum(right.add),
        left_sph: toNum(left.sph),
        left_cyl: toNum(left.cyl),
        left_axis: toNum(left.axis),
        left_add: toNum(left.add),
      });
      onSaved(saved);
      setOpen(false);
      toast.success('Manual Rx saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const hasData = manualRx && (manualRx.right_sph != null || manualRx.left_sph != null);

  if (!open) {
    if (!hasData) {
      return (
        <Button variant="outline" size="sm" onClick={handleOpen} className="gap-1.5">
          <PenLine className="h-3.5 w-3.5" /> Enter Rx
        </Button>
      );
    }

    return (
      <div className="space-y-1">
        <div className="text-sm">
          <p><span className="font-medium text-muted-foreground">R:</span> {manualRx!.right_sph ?? '—'} / {manualRx!.right_cyl ?? '—'} x {manualRx!.right_axis ?? '—'} {manualRx!.right_add != null ? `add ${manualRx!.right_add}` : ''}</p>
          <p><span className="font-medium text-muted-foreground">L:</span> {manualRx!.left_sph ?? '—'} / {manualRx!.left_cyl ?? '—'} x {manualRx!.left_axis ?? '—'} {manualRx!.left_add != null ? `add ${manualRx!.left_add}` : ''}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleOpen} className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
          <PenLine className="h-3 w-3" /> Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-popover p-3 shadow-md min-w-[280px]">
      <EyeRow label="Right Eye" values={right} onChange={setRight} />
      <EyeRow label="Left Eye" values={left} onChange={setLeft} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>
          <X className="mr-1 h-3.5 w-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function EyeRow({
  label,
  values,
  onChange,
}: {
  label: string;
  values: EyeFields;
  onChange: (v: EyeFields) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {(['sph', 'cyl', 'axis', 'add'] as const).map((field) => (
          <div key={field}>
            <label className="text-[10px] uppercase text-muted-foreground">{field}</label>
            <Input
              type="number"
              step="0.25"
              value={values[field]}
              onChange={(e) => onChange({ ...values, [field]: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
