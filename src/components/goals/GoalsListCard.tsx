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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Plus,
  History,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useGoalsStore } from '@/stores/goalsStore';
import { useAuth } from '@/stores/appStore';
import { GoalCard } from './GoalCard';
import { CreateGoalModal } from './CreateGoalModal';
import type { Goal } from '@/types/goals';

export function GoalsListCard() {
  const { user } = useAuth();

  // Usar seletores individuais para garantir estabilidade de referência
  const activeGoals = useGoalsStore((s) => s.activeGoals);
  const draftGoals = useGoalsStore((s) => s.draftGoals);
  const completedGoals = useGoalsStore((s) => s.completedGoals);
  const expiredGoals = useGoalsStore((s) => s.expiredGoals);
  const goalProgressMap = useGoalsStore((s) => s.goalProgressMap);
  const isLoading = useGoalsStore((s) => s.isLoading);
  const isCreateModalOpen = useGoalsStore((s) => s.isCreateModalOpen);
  const activeTab = useGoalsStore((s) => s.activeTab);
  const loadAllGoals = useGoalsStore((s) => s.loadAllGoals);
  const openCreateModal = useGoalsStore((s) => s.openCreateModal);
  const setActiveTab = useGoalsStore((s) => s.setActiveTab);
  const selectGoal = useGoalsStore((s) => s.selectGoal);
  const confirmGoalById = useGoalsStore((s) => s.confirmGoalById);
  const completeGoal = useGoalsStore((s) => s.completeGoal);
  const deleteGoal = useGoalsStore((s) => s.deleteGoal);
  const openConfigModal = useGoalsStore((s) => s.openConfigModal);

  useEffect(() => {
    if (user?.id) {
      loadAllGoals(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleEdit = (goal: Goal) => {
    selectGoal(goal);
    openConfigModal();
  };

  const handleDelete = async (goal: Goal) => {
    if (!user?.id) return;
    if (confirm(`Tem certeza que deseja excluir "${goal.title}"?`)) {
      await deleteGoal(goal.id, user.id);
    }
  };

  const handleConfirm = async (goal: Goal) => {
    if (!user?.id) return;
    await confirmGoalById(goal.id, user.id);
  };

  const handleComplete = async (goal: Goal) => {
    if (!user?.id) return;
    if (confirm(`Tem certeza que deseja marcar "${goal.title}" como concluida?`)) {
      await completeGoal(goal.id, user.id);
    }
  };

  const handleGoalClick = (goal: Goal) => {
    selectGoal(goal);
  };

  if (isLoading && activeGoals.length === 0 && !isCreateModalOpen) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Minhas Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <CreateGoalModal />
      </>
    );
  }

  const totalActive = activeGoals.length;
  const totalDrafts = draftGoals.length;
  const totalCompleted = completedGoals.length;
  const totalExpired = expiredGoals.length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Minhas Metas
          </CardTitle>
          <CardDescription>
            Acompanhe suas metas com diferentes periodos
          </CardDescription>
          <CardAction>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Meta
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="active" className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                Ativas
                {totalActive > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {totalActive}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drafts" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Rascunhos
                {totalDrafts > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {totalDrafts}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Expiradas
                {totalExpired > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {totalExpired}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                Concluidas
                {totalCompleted > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {totalCompleted}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ScrollArea className="h-[400px] pr-4">
                {activeGoals.length > 0 ? (
                  <div className="space-y-3">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        progress={goalProgressMap.get(goal.id)}
                        variant="compact"
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onComplete={handleComplete}
                        onClick={handleGoalClick}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Target className="h-12 w-12" />}
                    title="Nenhuma meta ativa"
                    description="Crie uma nova meta ou ative um rascunho para comecar a acompanhar."
                    action={
                      <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Meta
                      </Button>
                    }
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="drafts">
              <ScrollArea className="h-[400px] pr-4">
                {draftGoals.length > 0 ? (
                  <div className="space-y-3">
                    {draftGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        progress={goalProgressMap.get(goal.id)}
                        variant="compact"
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onConfirm={handleConfirm}
                        onClick={handleGoalClick}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Nenhum rascunho"
                    description="Rascunhos sao metas que voce ainda nao ativou."
                    action={
                      <Button variant="outline" onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Rascunho
                      </Button>
                    }
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="expired">
              <ScrollArea className="h-[400px] pr-4">
                {expiredGoals.length > 0 ? (
                  <div className="space-y-3">
                    {expiredGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        progress={goalProgressMap.get(goal.id)}
                        variant="compact"
                        onDelete={handleDelete}
                        onClick={handleGoalClick}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<AlertCircle className="h-12 w-12" />}
                    title="Nenhuma meta expirada"
                    description="Metas que passaram da data sem serem concluidas aparecem aqui."
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history">
              <ScrollArea className="h-[400px] pr-4">
                {completedGoals.length > 0 ? (
                  <div className="space-y-3">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        progress={goalProgressMap.get(goal.id)}
                        variant="compact"
                        onDelete={handleDelete}
                        onClick={handleGoalClick}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<History className="h-12 w-12" />}
                    title="Nenhuma meta concluida"
                    description="Metas finalizadas aparecerão aqui para consulta."
                  />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateGoalModal />
    </>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-4 opacity-50">{icon}</div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
        {description}
      </p>
      {action}
    </div>
  );
}
