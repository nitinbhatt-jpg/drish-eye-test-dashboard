import { supabase } from '@/lib/supabase';
import type { EyeVA, FinalDistanceVA, SessionData } from '@/types';

const BUCKET = 'Eye_Test_logs';

const DEMO_NAMES = new Set(['unknown', 'john doe', 'sid', 'test', 'demo', '']);

function isDemoSession(name: string): boolean {
  return DEMO_NAMES.has(name.toLowerCase().trim());
}

function parseEyeVA(raw: unknown): EyeVA | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const chart = typeof obj.chart === 'string' ? obj.chart : null;
  const line = typeof obj.line === 'string' ? obj.line : null;
  if (!line) return null;
  return { chart: chart ?? '', line };
}

function extractFinalDistanceVA(json: Record<string, unknown>): FinalDistanceVA | null {
  const va = json.final_distance_va;
  if (va == null || typeof va !== 'object') return null;
  const obj = va as Record<string, unknown>;
  const right = parseEyeVA(obj.right);
  const left = parseEyeVA(obj.left);
  if (!right && !left) return null;
  return { right, left };
}

export async function fetchAllSessionData(): Promise<SessionData[]> {
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

  if (listError) throw listError;
  if (!files) return [];

  const jsonFiles = files.filter((f) => f.name.endsWith('.json'));

  const results = await Promise.allSettled(
    jsonFiles.map(async (file) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(file.name);
      if (error) throw error;

      const text = await data.text();
      const json = JSON.parse(text);

      return {
        session_id: json.session_id,
        customer_name: json.customer_name ?? json.patient_input?.patient_name ?? 'Unknown',
        customer_phone: json.customer_phone ?? '',
        final_prescription: json.final_prescription ?? { right: { sph: 0, cyl: 0, axis: 0, add: 0 }, left: { sph: 0, cyl: 0, axis: 0, add: 0 } },
        final_distance_va: extractFinalDistanceVA(json),
        test_duration_display: json.test_duration_display ?? '—',
        total_steps: json.total_steps ?? 0,
        session_start_time: json.session_start_time ?? '',
      } satisfies SessionData;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<SessionData> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((s) => !isDemoSession(s.customer_name))
    .sort((a, b) => {
      if (!a.session_start_time && !b.session_start_time) return 0;
      if (!a.session_start_time) return 1;
      if (!b.session_start_time) return -1;
      return new Date(b.session_start_time).getTime() - new Date(a.session_start_time).getTime();
    });
}
