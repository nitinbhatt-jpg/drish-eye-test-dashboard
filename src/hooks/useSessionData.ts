import { useCallback, useEffect, useState } from 'react';
import { fetchAllSessionData } from '@/api/storage';
import { fetchAllManualRx } from '@/api/manualRx';
import type { DashboardRow, ManualRx, SessionData } from '@/types';

function mergeData(sessions: SessionData[], manualRxList: ManualRx[]): DashboardRow[] {
  const rxMap = new Map(manualRxList.map((rx) => [rx.session_id, rx]));
  return sessions.map((s) => ({
    ...s,
    manual_rx: rxMap.get(s.session_id) ?? null,
  }));
}

export function useSessionData() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessions, manualRxList] = await Promise.all([
        fetchAllSessionData(),
        fetchAllManualRx(),
      ]);
      setRows(mergeData(sessions, manualRxList));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateManualRx(sessionId: string, rx: ManualRx) {
    setRows((prev) =>
      prev.map((row) =>
        row.session_id === sessionId ? { ...row, manual_rx: rx } : row,
      ),
    );
  }

  return { rows, loading, error, reload: load, updateManualRx };
}
