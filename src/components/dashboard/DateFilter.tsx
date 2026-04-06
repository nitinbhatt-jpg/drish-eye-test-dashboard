import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Preset = 'today' | 'week' | 'month' | 'all';

interface DateFilterProps {
  onFilterChange: (start: Date | null, end: Date | null) => void;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function startOfMonth(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(1);
  return r;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const [activePreset, setActivePreset] = useState<Preset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function applyPreset(preset: Preset) {
    setActivePreset(preset);
    setCustomStart('');
    setCustomEnd('');
    const now = new Date();
    switch (preset) {
      case 'today':
        onFilterChange(startOfDay(now), null);
        break;
      case 'week':
        onFilterChange(startOfWeek(now), null);
        break;
      case 'month':
        onFilterChange(startOfMonth(now), null);
        break;
      case 'all':
        onFilterChange(null, null);
        break;
    }
  }

  function handleCustomChange(start: string, end: string) {
    setActivePreset('all');
    const s = start ? new Date(start + 'T00:00:00') : null;
    const e = end ? new Date(end + 'T23:59:59') : null;
    if (s || e) {
      onFilterChange(s, e);
    }
  }

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {presets.map(({ key, label }) => (
          <Button
            key={key}
            variant={activePreset === key && !customStart && !customEnd ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={customStart}
          onChange={(e) => {
            setCustomStart(e.target.value);
            handleCustomChange(e.target.value, customEnd);
          }}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => {
            setCustomEnd(e.target.value);
            handleCustomChange(customStart, e.target.value);
          }}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        />
      </div>
    </div>
  );
}
