import { ColoredProgress } from './ColoredProgress';
import type { GoalProgress, GoalStatus } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

interface GoalProgressItemProps {
  progress: GoalProgress;
  showDetails?: boolean;
}

const statusIcons: Record<GoalStatus, React.ReactNode> = {
  behind: <TrendingDown className="h-4 w-4 text-red-500" />,
  on_track: <Target className="h-4 w-4 text-yellow-500" />,
  ahead: <TrendingUp className="h-4 w-4 text-green-500" />,
  achieved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

const statusLabels: Record<GoalStatus, string> = {
  behind: 'Atrasado',
  on_track: 'No ritmo',
  ahead: 'Adiantado',
  achieved: 'Batida!',
};

const statusTextColors: Record<GoalStatus, string> = {
  behind: 'text-red-600',
  on_track: 'text-yellow-600',
  ahead: 'text-green-600',
  achieved: 'text-emerald-600',
};

export function GoalProgressItem({
  progress,
  showDetails = true,
}: GoalProgressItemProps) {
  const formatValue = (value: number) => {
    if (progress.prefix) {
      return `${progress.prefix} ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: progress.metric === 'mrr' ? 2 : 0,
        maximumFractionDigits: progress.metric === 'mrr' ? 2 : 0,
      })}`;
    }
    return value.toString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[progress.status]}
          <span className="text-sm font-medium">{progress.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn('text-xs font-medium', statusTextColors[progress.status])}
          >
            {statusLabels[progress.status]}
          </span>
          <span className="text-sm font-semibold">{progress.progress}%</span>
        </div>
      </div>

      <ColoredProgress value={progress.progress} status={progress.status} />

      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Atual: {formatValue(progress.current)}
            {progress.unit && ` ${progress.unit}`}
          </span>
          <span>
            Meta: {formatValue(progress.target)}
            {progress.unit && ` ${progress.unit}`}
          </span>
        </div>
      )}
    </div>
  );
}
