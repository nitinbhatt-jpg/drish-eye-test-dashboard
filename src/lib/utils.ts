import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EyePower } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PHOROPTER_NAME_MAP: Record<string, string> = {
  'cv5000pc': 'Lenskart-HQ',
  'lkst1782-1': 'Delta Tower',
  'lenskart-bhiwadi': 'Lenskart-Bhiwadi',
};

export function getPhoroptrName(id: string): string {
  if (!id) return '';
  return PHOROPTER_NAME_MAP[id.toLowerCase().trim()] ?? id;
}

function fmtNum(val: number | null): string {
  if (val == null) return '—';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

export function formatEyePower(eye: EyePower | undefined | null): string {
  if (!eye) return '—';
  return `Sph: ${fmtNum(eye.sph)} | Cyl: ${fmtNum(eye.cyl)} | Axis: ${eye.axis ?? '—'} | Add: ${fmtNum(eye.add)}`;
}
