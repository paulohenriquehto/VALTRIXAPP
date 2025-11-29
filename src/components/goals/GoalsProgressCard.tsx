import { useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalProgressItem } from './GoalProgressItem';
import { useGoalsStore } from '@/stores/goalsStore';
import { useAuth } from '@/stores/appStore';
import { Target, Settings2, Sparkles, CalendarDays } from 'lucide-react';

export function GoalsProgressCard() {
  const { user } = useAuth();
  const {
    currentGoals,
    goalProgress,
    isLoading,
    dayOfMonth,
    daysInMonth,
    expectedProgress,
    loadGoals,
    openConfigModal,
  } = useGoalsStore();

  useEffect(() => {
    if (user?.id) {
      loadGoals(user.id);
    }
  }, [user?.id, loadGoals]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentGoals || !currentGoals.is_confirmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas do Mês
          </CardTitle>
          <CardDescription>
            Defina suas metas mensais para acompanhar o progresso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Você ainda não definiu suas metas para este mês.
              <br />
              Que tal começar agora?
            </p>
            <Button onClick={openConfigModal}>
              <Target className="h-4 w-4 mr-2" />
              Definir Metas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas do Mês
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Dia {dayOfMonth}/{daysInMonth} ({expectedProgress}% esperado)
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" onClick={openConfigModal}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalProgress.map((progress) => (
          <GoalProgressItem key={progress.metric} progress={progress} />
        ))}
      </CardContent>
    </Card>
  );
}
