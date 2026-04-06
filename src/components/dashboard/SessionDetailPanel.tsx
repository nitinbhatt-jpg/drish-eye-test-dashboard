import { useEffect } from 'react';
import { X } from 'lucide-react';
import { EyePowerDisplay } from './EyePowerDisplay';
import { DeviationDisplay } from './DeviationDisplay';
import type { DashboardRow } from '@/types';

interface SessionDetailPanelProps {
  row: DashboardRow | null;
  onClose: () => void;
}

function fmtVal(val: number | null | undefined): string {
  if (val == null) return '—';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

function AccuracyCalc({ row }: { row: DashboardRow }) {
  const ai = row.final_prescription;
  const m = row.manual_rx;
  if (!ai || !m) return <span className="text-muted-foreground text-sm">—</span>;

  const checks: boolean[] = [];
  function check(aiVal: number | null | undefined, mVal: number | null, threshold: number) {
    if (aiVal != null) {
      checks.push(mVal != null ? Math.abs(aiVal - mVal) <= threshold : false);
    }
  }
  check(ai.right?.sph, m.right_sph, 0.25);
  check(ai.right?.cyl, m.right_cyl, 0.25);
  check(ai.right?.axis, m.right_axis, 10);
  check(ai.right?.add, m.right_add, 0.25);
  check(ai.left?.sph, m.left_sph, 0.25);
  check(ai.left?.cyl, m.left_cyl, 0.25);
  check(ai.left?.axis, m.left_axis, 10);
  check(ai.left?.add, m.left_add, 0.25);

  if (checks.length === 0) return <span className="text-muted-foreground">—</span>;
  const passed = checks.filter(Boolean).length;
  const pct = Math.round((passed / checks.length) * 100);
  const color = pct >= 99 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{pct}%</p>
      <p className="text-xs text-muted-foreground">{passed}/{checks.length} params</p>
    </div>
  );
}

export function SessionDetailPanel({ row, onClose }: SessionDetailPanelProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!row) return null;

  const m = row.manual_rx;
  const ai = row.final_prescription;
  const manualRight = m ? { sph: m.right_sph, cyl: m.right_cyl, axis: m.right_axis, add: m.right_add } : null;
  const manualLeft = m ? { sph: m.left_sph, cyl: m.left_cyl, axis: m.left_axis, add: m.left_add } : null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{row.customer_name}</h3>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Session info */}
          <div className="text-sm text-muted-foreground space-x-2">
            <span className="font-mono text-xs">{row.session_id.slice(0, 12)}...</span>
            <span>&bull;</span>
            <span>{new Date(row.session_start_time).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span>{row.total_test_duration_display}</span>
            <span>&bull;</span>
            <span>{row.total_steps} steps</span>
          </div>

          {/* AI Power */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Self ET Power (AI)</p>
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <EyePowerDisplay eye={ai?.right} label="Right" />
              <EyePowerDisplay eye={ai?.left} label="Left" />
            </div>
          </div>

          {/* Manual Rx */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Manual Rx</p>
            {m ? (
              <div className="rounded-lg border bg-card p-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">R:</span>{' '}
                  {fmtVal(m.right_sph)} / {fmtVal(m.right_cyl)} x {m.right_axis ?? '—'}{' '}
                  {m.right_add != null && <span>add {fmtVal(m.right_add)}</span>}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">L:</span>{' '}
                  {fmtVal(m.left_sph)} / {fmtVal(m.left_cyl)} x {m.left_axis ?? '—'}{' '}
                  {m.left_add != null && <span>add {fmtVal(m.left_add)}</span>}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground italic">
                Not entered yet
              </div>
            )}
          </div>

          {/* Deviation */}
          {ai && m && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Deviation |M - AI|</p>
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <DeviationDisplay ai={ai.right} manual={manualRight} label="Right" />
                <DeviationDisplay ai={ai.left} manual={manualLeft} label="Left" />
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Accuracy</p>
              <AccuracyCalc row={row} />
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Duration</p>
              <p className="text-2xl font-bold">{row.total_test_duration_display}</p>
              <p className="text-xs text-muted-foreground">{row.total_steps} steps</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
