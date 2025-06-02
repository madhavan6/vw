
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface IntervalSelectorProps {
  value: number;
  onChange: (value: number) => void;
  isAdmin: boolean;
  disabled?: boolean;
}

const intervals = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export function IntervalSelector({ value, onChange, isAdmin, disabled }: IntervalSelectorProps) {
  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="interval" className="text-sm font-medium whitespace-nowrap">
        Screenshot Interval:
      </Label>
      <Select value={value.toString()} onValueChange={(val) => onChange(parseInt(val))} disabled={disabled}>
        <SelectTrigger id="interval" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border z-50">
          {intervals.map((interval) => (
            <SelectItem key={interval.value} value={interval.value.toString()}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
