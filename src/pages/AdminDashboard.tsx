import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { MetricsSummary } from '@/components/dashboard/MetricsSummary';
import { DataTable } from '@/components/dashboard/DataTable';
import { EyePowerDisplay } from '@/components/dashboard/EyePowerDisplay';
import { ManualRxEditor } from '@/components/dashboard/ManualRxEditor';
import { DeviationDisplay } from '@/components/dashboard/DeviationDisplay';
import { AccuracyDisplay } from '@/components/dashboard/AccuracyDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { DashboardRow } from '@/types';

type RxFilter = 'all' | 'filled' | 'empty';

export default function AdminDashboard() {
  const { rows, loading, error, reload, updateManualRx } = useSessionData();
  const [rxFilter, setRxFilter] = useState<RxFilter>('all');

  const filteredRows = useMemo(() => {
    if (rxFilter === 'all') return rows;
    if (rxFilter === 'filled') return rows.filter((r) => r.manual_rx != null);
    return rows.filter((r) => r.manual_rx == null);
  }, [rows, rxFilter]);

  const columns: ColumnDef<DashboardRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'session_id',
        header: 'Session ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer Name',
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'customer_phone',
        header: 'Phone',
        cell: ({ getValue }) => {
          const phone = getValue<string>();
          return phone
            ? <span className="font-mono text-xs">{phone}</span>
            : <span className="text-sm text-muted-foreground">—</span>;
        },
      },
      {
        id: 'ai_prescription',
        header: 'Self ET Power (AI)',
        cell: ({ row }) => {
          const rx = row.original.final_prescription;
          return (
            <div className="space-y-1.5">
              <EyePowerDisplay eye={rx?.right} label="Right" />
              <EyePowerDisplay eye={rx?.left} label="Left" />
            </div>
          );
        },
      },
      {
        id: 'accuracy',
        header: 'Accuracy',
        cell: ({ row }) => (
          <AccuracyDisplay
            ai={row.original.final_prescription}
            manual={row.original.manual_rx}
          />
        ),
      },
      {
        id: 'manual_rx',
        header: 'Manual Rx Check',
        cell: ({ row }) => (
          <ManualRxEditor
            sessionId={row.original.session_id}
            manualRx={row.original.manual_rx}
            onSaved={(rx) => updateManualRx(row.original.session_id, rx)}
          />
        ),
      },
      {
        id: 'deviation',
        header: 'Deviation (|M - AI|)',
        cell: ({ row }) => {
          const ai = row.original.final_prescription;
          const m = row.original.manual_rx;
          if (!ai || !m) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          const manualRight = { sph: m.right_sph, cyl: m.right_cyl, axis: m.right_axis, add: m.right_add };
          const manualLeft = { sph: m.left_sph, cyl: m.left_cyl, axis: m.left_axis, add: m.left_add };
          return (
            <div className="space-y-1.5">
              <DeviationDisplay ai={ai.right} manual={manualRight} label="Right" />
              <DeviationDisplay ai={ai.left} manual={manualLeft} label="Left" />
            </div>
          );
        },
      },
      {
        accessorKey: 'total_test_duration_display',
        header: 'Duration',
      },
      {
        accessorKey: 'total_steps',
        header: 'Steps',
      },
    ],
    [updateManualRx],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={reload} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Manual Rx:</span>
        {(['all', 'filled', 'empty'] as RxFilter[]).map((f) => (
          <Button
            key={f}
            variant={rxFilter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRxFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'filled' ? 'Filled' : 'Empty'}
          </Button>
        ))}
      </div>
      <MetricsSummary rows={filteredRows} />
      <DataTable columns={columns} data={filteredRows} />
    </div>
  );
}
