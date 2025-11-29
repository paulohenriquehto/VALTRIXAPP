import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoalsStore } from '@/stores/goalsStore';
import { useAuth } from '@/stores/appStore';
import {
  Target,
  Sparkles,
  DollarSign,
  Users,
  CheckSquare,
  FolderKanban,
  Loader2,
} from 'lucide-react';

interface GoalInputProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  suggested: number;
  onChange: (value: number) => void;
  prefix?: string;
}

function GoalInput({
  label,
  icon,
  value,
  suggested,
  onChange,
  prefix,
}: GoalInputProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className={prefix ? 'pl-10' : ''}
            min={0}
          />
        </div>
        {suggested > 0 && value !== suggested && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(suggested)}
            className="whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {prefix
              ? `${prefix} ${suggested.toLocaleString('pt-BR')}`
              : suggested}
          </Button>
        )}
      </div>
      {suggested > 0 && (
        <p className="text-xs text-muted-foreground">
          Sugestão IA: {prefix ? `${prefix} ` : ''}
          {suggested.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}

export function GoalsConfigModal() {
  const { user } = useAuth();
  const {
    currentGoals,
    aiSuggestions,
    isConfigModalOpen,
    isLoading,
    closeConfigModal,
    loadAISuggestions,
    saveGoals,
    confirmGoals,
  } = useGoalsStore();

  const [mrrTarget, setMrrTarget] = useState(0);
  const [clientsTarget, setClientsTarget] = useState(0);
  const [tasksTarget, setTasksTarget] = useState(0);
  const [projectsTarget, setProjectsTarget] = useState(0);

  useEffect(() => {
    if (isConfigModalOpen && user?.id) {
      loadAISuggestions(user.id);
    }
  }, [isConfigModalOpen, user?.id, loadAISuggestions]);

  useEffect(() => {
    if (currentGoals) {
      setMrrTarget(currentGoals.mrr_target || 0);
      setClientsTarget(currentGoals.clients_target || 0);
      setTasksTarget(currentGoals.tasks_target || 0);
      setProjectsTarget(currentGoals.projects_target || 0);
    } else if (aiSuggestions) {
      setMrrTarget(aiSuggestions.mrr || 0);
      setClientsTarget(aiSuggestions.clients || 0);
      setTasksTarget(aiSuggestions.tasks || 0);
      setProjectsTarget(aiSuggestions.projects || 0);
    }
  }, [currentGoals, aiSuggestions]);

  const handleSave = async () => {
    if (!user?.id) return;

    await saveGoals(user.id, {
      mrr_target: mrrTarget,
      clients_target: clientsTarget,
      tasks_target: tasksTarget,
      projects_target: projectsTarget,
    });
  };

  const handleConfirm = async () => {
    if (!user?.id) return;

    await saveGoals(user.id, {
      mrr_target: mrrTarget,
      clients_target: clientsTarget,
      tasks_target: tasksTarget,
      projects_target: projectsTarget,
    });
    await confirmGoals(user.id);
  };

  const handleUseSuggestions = () => {
    if (aiSuggestions) {
      setMrrTarget(aiSuggestions.mrr);
      setClientsTarget(aiSuggestions.clients);
      setTasksTarget(aiSuggestions.tasks);
      setProjectsTarget(aiSuggestions.projects);
    }
  };

  return (
    <Dialog open={isConfigModalOpen} onOpenChange={closeConfigModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configurar Metas do Mês
          </DialogTitle>
          <DialogDescription>
            Defina suas metas mensais. A IA sugere valores baseados no seu
            histórico com 10% de crescimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {aiSuggestions && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUseSuggestions}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Usar Todas as Sugestões da IA
            </Button>
          )}

          <GoalInput
            label="MRR (Receita Recorrente)"
            icon={<DollarSign className="h-4 w-4" />}
            value={mrrTarget}
            suggested={aiSuggestions?.mrr || 0}
            onChange={setMrrTarget}
            prefix="R$"
          />

          <GoalInput
            label="Novos Clientes"
            icon={<Users className="h-4 w-4" />}
            value={clientsTarget}
            suggested={aiSuggestions?.clients || 0}
            onChange={setClientsTarget}
          />

          <GoalInput
            label="Tarefas Concluídas"
            icon={<CheckSquare className="h-4 w-4" />}
            value={tasksTarget}
            suggested={aiSuggestions?.tasks || 0}
            onChange={setTasksTarget}
          />

          <GoalInput
            label="Projetos Entregues"
            icon={<FolderKanban className="h-4 w-4" />}
            value={projectsTarget}
            suggested={aiSuggestions?.projects || 0}
            onChange={setProjectsTarget}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={closeConfigModal}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={isLoading}>
            Salvar Rascunho
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Confirmar Metas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
