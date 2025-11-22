import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AnalyticsPeriod, DateRange } from '../types';
import { getPeriodLabel } from '../utils/analytics';

interface PeriodFilterProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  customDateRange?: DateRange;
  onCustomDateRangeChange?: (range: DateRange) => void;
  showCustomDate?: boolean;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  period,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange,
  showCustomDate = false,
}) => {
  const periods: AnalyticsPeriod[] = [
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'this_month',
    'last_month',
    'this_quarter',
    'last_quarter',
    'this_year',
    'last_year',
    'custom',
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Período:</Label>
      </div>

      <Select value={period} onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p} value={p}>
              {getPeriodLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === 'custom' && showCustomDate && onCustomDateRangeChange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customDateRange?.startDate?.split('T')[0] || ''}
            onChange={(e) =>
              onCustomDateRangeChange({
                startDate: new Date(e.target.value).toISOString(),
                endDate: customDateRange?.endDate || new Date().toISOString(),
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={customDateRange?.endDate?.split('T')[0] || ''}
            onChange={(e) =>
              onCustomDateRangeChange({
                startDate: customDateRange?.startDate || new Date().toISOString(),
                endDate: new Date(e.target.value).toISOString(),
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
          />
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
