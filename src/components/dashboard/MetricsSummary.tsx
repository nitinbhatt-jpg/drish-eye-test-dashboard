import { Activity, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardRow } from '@/types';

interface MetricsSummaryProps {
  rows: DashboardRow[];
}

export function MetricsSummary({ rows }: MetricsSummaryProps) {
  const totalAI = rows.length;
  const totalManual = rows.filter((r) => r.manual_rx !== null).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total AI Eye Tests</p>
            <p className="text-3xl font-bold">{totalAI}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Manual Rx Entries</p>
            <p className="text-3xl font-bold">{totalManual}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
