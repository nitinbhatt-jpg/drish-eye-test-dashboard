import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState, useCallback } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { AdminMetricsSummary } from '@/components/dashboard/AdminMetricsSummary';
import { DataTable } from '@/components/dashboard/DataTable';
import { EyePowerDisplay } from '@/components/dashboard/EyePowerDisplay';
import { ManualRxEditor } from '@/components/dashboard/ManualRxEditor';
import { DeviationDisplay } from '@/components/dashboard/DeviationDisplay';
import { AccuracyDisplay } from '@/components/dashboard/AccuracyDisplay';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SessionDetailPanel } from '@/components/dashboard/SessionDetailPanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronRight } from 'lucide-react';
import type { DashboardRow } from '@/types';

type RxFilter = 'all' | 'filled' | 'empty';

export default function AdminDashboard() {
  const { rows, loading, error, reload, updateManualRx } = useSessionData();
  const [rxFilter, setRxFilter] = useState<RxFilter>('all');
  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);

  const handleDateChange = useCallback((start: Date | null, end: Date | null) => {
    setDateStart(start);
    setDateEnd(end);
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Rx filter
    if (rxFilter === 'filled') result = result.filter((r) => r.manual_rx != null);
    else if (rxFilter === 'empty') result = result.filter((r) => r.manual_rx == null);

    // Date filter
    if (dateStart || dateEnd) {
      result = result.filter((r) => {
        const d = new Date(r.session_start_time);
        if (dateStart && d < dateStart) return false;
        if (dateEnd && d > dateEnd) return false;
        return true;
      });
    }

    return result;
  }, [rows, rxFilter, dateStart, dateEnd]);

  const columns: ColumnDef<DashboardRow, unknown>[] = useMemo(
    () => [
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
        id: 'manual_rx',
        header: 'Manual Rx',
        enableSorting: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ManualRxEditor
              sessionId={row.original.session_id}
              manualRx={row.original.manual_rx}
              onSaved={(rx) => updateManualRx(row.original.session_id, rx)}
            />
          </div>
        ),
      },
      {
        id: 'ai_prescription',
        header: 'Self ET Power (AI)',
        enableSorting: false,
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
        enableSorting: false,
        cell: ({ row }) => (
          <AccuracyDisplay
            ai={row.original.final_prescription}
            manual={row.original.manual_rx}
          />
        ),
      },
      {
        id: 'deviation',
        header: 'Deviation (|M - AI|)',
        enableSorting: false,
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
        id: 'detail',
        header: '',
        enableSorting: false,
        cell: () => (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ),
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

      <AdminMetricsSummary rows={filteredRows} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <DateFilter onFilterChange={handleDateChange} />
        <div className="flex items-center gap-2 ml-auto">
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
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(row) => setSelectedRow(row)}
      />

      <SessionDetailPanel
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}
