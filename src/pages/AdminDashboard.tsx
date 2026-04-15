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
import { RefreshCw, ChevronRight, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { getPhoroptrName } from '@/lib/utils';
import type { DashboardRow } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = 'Eye_Test_logs';

function storageUrl(fileName: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

function exportToCsv(rows: DashboardRow[]) {
  const headers = [
    'Customer Name',
    'Phone',
    'Phoropter ID',
    'Session Date',
    'Duration',
    'AI Right Sph', 'AI Right Cyl', 'AI Right Axis', 'AI Right Add',
    'AI Left Sph', 'AI Left Cyl', 'AI Left Axis', 'AI Left Add',
    'Manual Right Sph', 'Manual Right Cyl', 'Manual Right Axis', 'Manual Right Add',
    'Manual Left Sph', 'Manual Left Cyl', 'Manual Left Axis', 'Manual Left Add',
    'Filled By',
  ];

  const csvRows = rows.map((r) => {
    const ai = r.final_prescription;
    const m = r.manual_rx;
    return [
      r.customer_name,
      r.customer_phone,
      getPhoroptrName(r.phoropter_id) || r.phoropter_id,
      r.session_start_time ? new Date(r.session_start_time).toLocaleString() : '',
      r.test_duration_display,
      fmtNum(ai?.right?.sph), fmtNum(ai?.right?.cyl), ai?.right?.axis ?? '', fmtNum(ai?.right?.add),
      fmtNum(ai?.left?.sph), fmtNum(ai?.left?.cyl), ai?.left?.axis ?? '', fmtNum(ai?.left?.add),
      fmtNum(m?.right_sph), fmtNum(m?.right_cyl), m?.right_axis ?? '', fmtNum(m?.right_add),
      fmtNum(m?.left_sph), fmtNum(m?.left_cyl), m?.left_axis ?? '', fmtNum(m?.left_add),
      m?.updated_by_email ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `drish-eye-tests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type RxFilter = 'all' | 'filled' | 'empty';

export default function AdminDashboard() {
  const { rows, loading, error, reload, updateManualRx } = useSessionData();
  const [rxFilter, setRxFilter] = useState<RxFilter>('all');
  const [phoroptrFilter, setPhoroptrFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);

  const uniquePhoroptrs = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      const name = getPhoroptrName(r.phoropter_id);
      if (name) seen.add(name);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const handleDateChange = useCallback((start: Date | null, end: Date | null) => {
    setDateStart(start);
    setDateEnd(end);
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (phoroptrFilter !== 'all') {
      result = result.filter((r) => getPhoroptrName(r.phoropter_id) === phoroptrFilter);
    }

    if (rxFilter === 'filled') result = result.filter((r) => r.manual_rx != null);
    else if (rxFilter === 'empty') result = result.filter((r) => r.manual_rx == null);

    if (dateStart || dateEnd) {
      result = result.filter((r) => {
        const d = new Date(r.session_start_time);
        if (dateStart && d < dateStart) return false;
        if (dateEnd && d > dateEnd) return false;
        return true;
      });
    }

    return result;
  }, [rows, phoroptrFilter, rxFilter, dateStart, dateEnd]);

  const columns: ColumnDef<DashboardRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'customer_name',
        header: 'Customer Name',
        cell: ({ row }) => {
          const sid = row.original.session_id;
          return (
            <div>
              <span className="font-medium">{row.original.customer_name}</span>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={storageUrl(`${sid}.csv`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline"
                >
                  <FileSpreadsheet className="h-3 w-3" /> CSV
                </a>
                <a
                  href={storageUrl(`${sid}_metadata.json`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline"
                >
                  <FileText className="h-3 w-3" /> Metadata
                </a>
              </div>
            </div>
          );
        },
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
        accessorKey: 'phoropter_id',
        header: 'Phoropter',
        cell: ({ getValue }) => {
          const id = getValue<string>();
          if (!id) return <span className="text-sm text-muted-foreground">—</span>;
          const name = getPhoroptrName(id);
          return (
            <div>
              <span className="font-medium text-sm">{name}</span>
              {name !== id && (
                <span className="block text-[10px] text-muted-foreground font-mono">{id}</span>
              )}
            </div>
          );
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
        accessorKey: 'test_duration_display',
        header: 'Duration',
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv(filteredRows)}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
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

      {uniquePhoroptrs.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Phoropter:</span>
          <select
            value={phoroptrFilter}
            onChange={(e) => setPhoroptrFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Phoropters</option>
            {uniquePhoroptrs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

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
