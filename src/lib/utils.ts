import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EyePower } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function fmtNum(val: number | null): string {
  if (val == null) return '—';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

export function formatEyePower(eye: EyePower | undefined | null): string {
  if (!eye) return '—';
  return `Sph: ${fmtNum(eye.sph)} | Cyl: ${fmtNum(eye.cyl)} | Axis: ${eye.axis ?? '—'} | Add: ${fmtNum(eye.add)}`;
}
