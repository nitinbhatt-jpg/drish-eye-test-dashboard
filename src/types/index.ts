export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
}

export interface EyePower {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
}

export interface FinalPrescription {
  right: EyePower | null;
  left: EyePower | null;
}

export interface EyeVA {
  chart: string;
  line: string;
}

export interface FinalDistanceVA {
  right: EyeVA | null;
  left: EyeVA | null;
}

export interface SessionData {
  session_id: string;
  phoropter_id: string;
  customer_name: string;
  customer_phone: string;
  final_prescription: FinalPrescription | null;
  final_distance_va: FinalDistanceVA | null;
  test_duration_display: string;
  total_steps: number;
  session_start_time: string;
}

export interface ManualRx {
  id: string;
  session_id: string;
  left_sph: number | null;
  left_cyl: number | null;
  left_axis: number | null;
  left_add: number | null;
  right_sph: number | null;
  right_cyl: number | null;
  right_axis: number | null;
  right_add: number | null;
  updated_by: string | null;
  updated_by_email: string | null;
  updated_at: string;
  created_at: string;
}

export interface ManualRxInput {
  session_id: string;
  left_sph: number | null;
  left_cyl: number | null;
  left_axis: number | null;
  left_add: number | null;
  right_sph: number | null;
  right_cyl: number | null;
  right_axis: number | null;
  right_add: number | null;
}

export interface DashboardRow {
  session_id: string;
  phoropter_id: string;
  customer_name: string;
  customer_phone: string;
  final_prescription: FinalPrescription | null;
  final_distance_va: FinalDistanceVA | null;
  test_duration_display: string;
  total_steps: number;
  session_start_time: string;
  manual_rx: ManualRx | null;
}
