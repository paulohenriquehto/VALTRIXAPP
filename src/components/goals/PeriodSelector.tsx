import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarRange,
  CalendarDays,
  CalendarClock,
  Settings2,
} from 'lucide-react';
import type { GoalPeriodType } from '@/types/goals';
import { PERIOD_PRESETS, PERIOD_TYPE_COLORS } from '@/types/goals';
import { GoalsService } from '@/services/goalsService';

interface PeriodSelectorProps {
  selectedType: GoalPeriodType;
  startDate: string;
  endDate: string;
  onTypeChange: (type: GoalPeriodType) => void;
  onDateChange: (start: string, end: string) => void;
}

const periodIcons: Record<GoalPeriodType, React.ReactNode> = {
  weekly: <Calendar className="h-4 w-4" />,
  biweekly: <CalendarRange className="h-4 w-4" />,
  monthly: <CalendarDays className="h-4 w-4" />,
  quarterly: <CalendarClock className="h-4 w-4" />,
  custom: <Settings2 className="h-4 w-4" />,
};

export function PeriodSelector({
  selectedType,
  startDate,
  endDate,
  onTypeChange,
  onDateChange,
}: PeriodSelectorProps) {
  const [isCustomDates, setIsCustomDates] = useState(selectedType === 'custom');

  useEffect(() => {
    setIsCustomDates(selectedType === 'custom');
  }, [selectedType]);

  const handleTypeSelect = (type: GoalPeriodType) => {
    onTypeChange(type);

    if (type !== 'custom') {
      const dates = GoalsService.getDefaultDates(type);
      onDateChange(dates.start, dates.end);
    }
  };

  const handleStartDateChange = (value: string) => {
    onDateChange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    onDateChange(startDate, value);
  };

  // Calculate days for display
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Tipo de Periodo</Label>

      {/* Period type buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {PERIOD_PRESETS.map((preset) => (
          <Button
            key={preset.type}
            type="button"
            variant={selectedType === preset.type ? 'default' : 'outline'}
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 px-2 gap-1',
              selectedType === preset.type && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => handleTypeSelect(preset.type)}
          >
            {periodIcons[preset.type]}
            <span className="text-xs font-medium">{preset.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {preset.description}
            </span>
          </Button>
        ))}
      </div>

      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date" className="text-xs">
            Data Inicio
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            disabled={!isCustomDates}
            className={cn(!isCustomDates && 'bg-muted cursor-not-allowed')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-xs">
            Data Fim
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            disabled={!isCustomDates}
            className={cn(!isCustomDates && 'bg-muted cursor-not-allowed')}
          />
        </div>
      </div>

      {/* Duration info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <span>Duracao:</span>
        <span className="font-medium text-foreground">{calculateDays()} dias</span>
      </div>

      {/* Custom dates hint */}
      {!isCustomDates && (
        <p className="text-xs text-muted-foreground">
          Selecione "Personalizado" para escolher datas especificas.
        </p>
      )}
    </div>
  );
}
