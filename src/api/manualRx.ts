import { supabase } from '@/lib/supabase';
import type { ManualRx, ManualRxInput } from '@/types';

export async function fetchAllManualRx(): Promise<ManualRx[]> {
  const { data, error } = await supabase
    .from('manual_rx')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ManualRx[];
}

export async function upsertManualRx(input: ManualRxInput): Promise<ManualRx> {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('manual_rx')
    .upsert(
      {
        session_id: input.session_id,
        left_sph: input.left_sph,
        left_cyl: input.left_cyl,
        left_axis: input.left_axis,
        left_add: input.left_add,
        right_sph: input.right_sph,
        right_cyl: input.right_cyl,
        right_axis: input.right_axis,
        right_add: input.right_add,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as ManualRx;
}
