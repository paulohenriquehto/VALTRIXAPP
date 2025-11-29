import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Target,
  Trash2,
  Edit2,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Goal, GoalProgress } from '@/types/goals';
import {
  PERIOD_TYPE_LABELS,
  PERIOD_TYPE_COLORS,
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
} from '@/types/goals';
import { GoalsService } from '@/services/goalsService';
import { GoalProgressItem } from './GoalProgressItem';

interface GoalCardProps {
  goal: Goal;
  progress?: GoalProgress[];
  variant?: 'compact' | 'full';
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onConfirm?: (goal: Goal) => void;
  onComplete?: (goal: Goal) => void;
  onClick?: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  progress,
  variant = 'compact',
  onEdit,
  onDelete,
  onConfirm,
  onComplete,
  onClick,
}: GoalCardProps) {
  const dayInfo = GoalsService.getGoalDayInfo(goal);
  const overallProgress = GoalsService.getOverallProgress(goal);
  const goalProgress = progress || GoalsService.calculateGoalProgress(goal);
  const isActive = GoalsService.isGoalActive(goal);
  const isDraft = GoalsService.isGoalDraft(goal);
  const isCompleted = GoalsService.isGoalCompleted(goal);
  const isExpired = GoalsService.isGoalExpired(goal);

  const formatDateRange = () => {
    return GoalsService.formatDateRange(goal.start_date, goal.end_date);
  };

  // Determine status color based on overall progress
  const getOverallStatus = () => {
    if (overallProgress >= 100) return 'achieved';
    if (overallProgress >= dayInfo.percentElapsed * 0.9) return 'ahead';
    if (overallProgress >= dayInfo.percentElapsed * 0.5) return 'on_track';
    return 'behind';
  };

  const overallStatus = getOverallStatus();

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
          isDraft && 'border-dashed border-muted-foreground/50',
          isCompleted && 'opacity-75 border-green-500/50',
          isExpired && 'opacity-75 border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
        )}
        onClick={() => onClick?.(goal)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title and badge */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{goal.title}</h4>
              <Badge
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0', PERIOD_TYPE_COLORS[goal.period_type])}
              >
                {PERIOD_TYPE_LABELS[goal.period_type]}
              </Badge>
              {isDraft && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Rascunho
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Expirada
                </Badge>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDateRange()}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className={cn('font-medium', GOAL_STATUS_COLORS[overallStatus].replace('bg-', 'text-'))}>
                  {overallProgress}%
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-1.5"
              />
            </div>
          </div>

          {/* Days remaining / Status badges */}
          <div className="flex flex-col items-end gap-1">
            {isActive && (
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className={cn(
                  'font-medium',
                  dayInfo.daysRemaining <= 3 && dayInfo.daysRemaining > 0 && 'text-orange-500',
                  dayInfo.daysRemaining === 0 && 'text-red-500'
                )}>
                  {dayInfo.daysRemaining > 0
                    ? `${dayInfo.daysRemaining}d restantes`
                    : 'Ultimo dia!'}
                </span>
              </div>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluida
              </Badge>
            )}
            {isExpired && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Expirou</span>
              </div>
            )}

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isDraft && onConfirm && (
                  <DropdownMenuItem onClick={() => onConfirm(goal)}>
                    <Play className="h-4 w-4 mr-2" />
                    Ativar Meta
                  </DropdownMenuItem>
                )}
                {isActive && onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(goal)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Concluir Meta
                  </DropdownMenuItem>
                )}
                {onEdit && !isCompleted && !isExpired && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(goal)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-card',
        isDraft && 'border-dashed border-muted-foreground/50',
        isCompleted && 'opacity-75 border-green-500/50',
        isExpired && 'opacity-75 border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{goal.title}</h3>
            <Badge
              variant="secondary"
              className={cn('text-xs', PERIOD_TYPE_COLORS[goal.period_type])}
            >
              {PERIOD_TYPE_LABELS[goal.period_type]}
            </Badge>
            {isDraft && (
              <Badge variant="outline" className="text-xs">
                Rascunho
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateRange()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Dia {dayInfo.currentDay}/{dayInfo.totalDays}
              {!isCompleted && dayInfo.daysRemaining > 0 && (
                <span className="text-muted-foreground">
                  ({dayInfo.daysRemaining} restantes)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isDraft && onConfirm && (
            <Button size="sm" onClick={() => onConfirm(goal)}>
              <Play className="h-4 w-4 mr-1" />
              Ativar
            </Button>
          )}
          {isActive && onComplete && (
            <Button size="sm" variant="outline" onClick={() => onComplete(goal)}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          )}
          {isCompleted && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluida
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive">
              Expirada
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && !isCompleted && !isExpired && (
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(goal)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso Geral</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn(GOAL_STATUS_COLORS[overallStatus].replace('bg-', 'text-'))}>
              {GOAL_STATUS_LABELS[overallStatus]}
            </Badge>
            <span className="text-sm font-bold">{overallProgress}%</span>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          Esperado para hoje: {dayInfo.percentElapsed}%
        </p>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {goalProgress.map((p) => (
          <GoalProgressItem key={p.metric} progress={p} />
        ))}
      </div>
    </div>
  );
}
