import { Activity, ClipboardCheck, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardRow } from '@/types';

interface AdminMetricsSummaryProps {
  rows: DashboardRow[];
}

function computeAccuracy(row: DashboardRow): number | null {
  const ai = row.final_prescription;
  const m = row.manual_rx;
  if (!ai || !m) return null;

  const checks: boolean[] = [];
  function check(aiVal: number | null | undefined, mVal: number | null, threshold: number) {
    if (aiVal != null) {
      checks.push(mVal != null ? Math.abs(aiVal - mVal) <= threshold : false);
    }
  }
  check(ai.right?.sph, m.right_sph, 0.25);
  check(ai.right?.cyl, m.right_cyl, 0.25);
  check(ai.right?.axis, m.right_axis, 5);
  check(ai.right?.add, m.right_add, 0.25);
  check(ai.left?.sph, m.left_sph, 0.25);
  check(ai.left?.cyl, m.left_cyl, 0.25);
  check(ai.left?.axis, m.left_axis, 5);
  check(ai.left?.add, m.left_add, 0.25);

  if (checks.length === 0) return null;
  return checks.filter(Boolean).length / checks.length;
}

function hasHighDeviation(row: DashboardRow): boolean {
  const ai = row.final_prescription;
  const m = row.manual_rx;
  if (!ai || !m) return false;

  function exceeds(aiVal: number | null | undefined, mVal: number | null, threshold: number): boolean {
    if (aiVal == null || mVal == null) return false;
    return Math.abs(aiVal - mVal) > threshold;
  }

  return (
    exceeds(ai.right?.sph, m.right_sph, 0.25) ||
    exceeds(ai.right?.cyl, m.right_cyl, 0.25) ||
    exceeds(ai.right?.axis, m.right_axis, 5) ||
    exceeds(ai.right?.add, m.right_add, 0.25) ||
    exceeds(ai.left?.sph, m.left_sph, 0.25) ||
    exceeds(ai.left?.cyl, m.left_cyl, 0.25) ||
    exceeds(ai.left?.axis, m.left_axis, 5) ||
    exceeds(ai.left?.add, m.left_add, 0.25)
  );
}

export function AdminMetricsSummary({ rows }: AdminMetricsSummaryProps) {
  const totalAI = rows.length;
  const totalManual = rows.filter((r) => r.manual_rx != null).length;
  const pendingRx = rows.filter((r) => r.manual_rx == null).length;

  const accuracies = rows.map(computeAccuracy).filter((a): a is number => a != null);
  const avgAccuracy = accuracies.length > 0
    ? Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 100)
    : null;

  const highDevCount = rows.filter(hasHighDeviation).length;

  const metrics = [
    {
      label: 'Total AI Tests',
      value: totalAI,
      icon: Activity,
      bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Manual Rx Done',
      value: totalManual,
      icon: ClipboardCheck,
      bg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      valueColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Pending Rx',
      value: pendingRx,
      icon: Clock,
      bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Avg Accuracy',
      value: avgAccuracy != null ? `${avgAccuracy}%` : '—',
      icon: TrendingUp,
      bg: avgAccuracy != null && avgAccuracy >= 75
        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      valueColor: avgAccuracy != null && avgAccuracy >= 75
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'High Deviation',
      value: highDevCount,
      icon: AlertTriangle,
      bg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      valueColor: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.bg}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <p className={`text-2xl font-bold ${m.valueColor}`}>{m.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
