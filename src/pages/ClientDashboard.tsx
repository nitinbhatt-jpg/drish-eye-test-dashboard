import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { MetricsSummary } from '@/components/dashboard/MetricsSummary';
import { DataTable } from '@/components/dashboard/DataTable';
import { ManualRxEditor } from '@/components/dashboard/ManualRxEditor';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getPhoroptrName } from '@/lib/utils';
import type { DashboardRow } from '@/types';

type RxFilter = 'all' | 'filled' | 'empty';

export default function ClientDashboard() {
  const { rows, loading, error, reload, updateManualRx } = useSessionData();
  const [rxFilter, setRxFilter] = useState<RxFilter>('all');
  const [phoroptrFilter, setPhoroptrFilter] = useState<string>('all');

  const uniquePhoroptrs = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      const name = getPhoroptrName(r.phoropter_id);
      if (name) seen.add(name);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (phoroptrFilter !== 'all') {
      result = result.filter((r) => getPhoroptrName(r.phoropter_id) === phoroptrFilter);
    }
    if (rxFilter === 'filled') return result.filter((r) => r.manual_rx != null);
    if (rxFilter === 'empty') return result.filter((r) => r.manual_rx == null);
    return result;
  }, [rows, phoroptrFilter, rxFilter]);

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
        cell: ({ row }) => (
          <ManualRxEditor
            sessionId={row.original.session_id}
            manualRx={row.original.manual_rx}
            onSaved={(rx) => updateManualRx(row.original.session_id, rx)}
          />
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
        <h2 className="text-2xl font-bold">Optum Dashboard</h2>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
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
      <MetricsSummary rows={filteredRows} />
      <DataTable columns={columns} data={filteredRows} />
    </div>
  );
}
