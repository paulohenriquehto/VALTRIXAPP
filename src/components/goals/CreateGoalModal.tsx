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
  Save,
  Play,
} from 'lucide-react';
import { PeriodSelector } from './PeriodSelector';
import { GoalsService } from '@/services/goalsService';
import type { GoalPeriodType, GoalInput } from '@/types/goals';

interface GoalInputFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  suggested: number;
  onChange: (value: number) => void;
  prefix?: string;
}

function GoalInputField({
  label,
  icon,
  value,
  suggested,
  onChange,
  prefix,
}: GoalInputFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
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
            type="button"
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
          Sugestao IA: {prefix ? `${prefix} ` : ''}
          {suggested.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}

export function CreateGoalModal() {
  const { user } = useAuth();

  // Usar seletores individuais para garantir estabilidade de referência
  const isCreateModalOpen = useGoalsStore((s) => s.isCreateModalOpen);
  const aiSuggestions = useGoalsStore((s) => s.aiSuggestions);
  const selectedPeriodType = useGoalsStore((s) => s.selectedPeriodType);
  const isLoading = useGoalsStore((s) => s.isLoading);
  const closeCreateModal = useGoalsStore((s) => s.closeCreateModal);
  const createGoal = useGoalsStore((s) => s.createGoal);
  const confirmGoalById = useGoalsStore((s) => s.confirmGoalById);
  const loadAISuggestions = useGoalsStore((s) => s.loadAISuggestions);
  const setSelectedPeriodType = useGoalsStore((s) => s.setSelectedPeriodType);

  // Form state
  const [periodType, setPeriodType] = useState<GoalPeriodType>(selectedPeriodType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [mrrTarget, setMrrTarget] = useState(0);
  const [clientsTarget, setClientsTarget] = useState(0);
  const [tasksTarget, setTasksTarget] = useState(0);
  const [projectsTarget, setProjectsTarget] = useState(0);

  // Initialize dates when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      const dates = GoalsService.getDefaultDates(periodType);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setTitle('');

      // Load AI suggestions
      if (user?.id) {
        loadAISuggestions(user.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateModalOpen, user?.id]);

  // Auto-generate title when period changes
  useEffect(() => {
    if (startDate && endDate) {
      const autoTitle = GoalsService.generateTitle(periodType, startDate, endDate);
      setTitle(autoTitle);
    }
  }, [periodType, startDate, endDate]);

  // Set suggestions as defaults
  useEffect(() => {
    if (aiSuggestions) {
      setMrrTarget(aiSuggestions.mrr || 0);
      setClientsTarget(aiSuggestions.clients || 0);
      setTasksTarget(aiSuggestions.tasks || 0);
      setProjectsTarget(aiSuggestions.projects || 0);
    }
  }, [aiSuggestions]);

  const handlePeriodTypeChange = (type: GoalPeriodType) => {
    setPeriodType(type);
    setSelectedPeriodType(type);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleUseSuggestions = () => {
    if (aiSuggestions) {
      setMrrTarget(aiSuggestions.mrr);
      setClientsTarget(aiSuggestions.clients);
      setTasksTarget(aiSuggestions.tasks);
      setProjectsTarget(aiSuggestions.projects);
    }
  };

  const getGoalInput = (): GoalInput => ({
    period_type: periodType,
    start_date: startDate,
    end_date: endDate,
    title,
    mrr_target: mrrTarget,
    clients_target: clientsTarget,
    tasks_target: tasksTarget,
    projects_target: projectsTarget,
  });

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    await createGoal(user.id, getGoalInput());
  };

  const handleCreateAndActivate = async () => {
    if (!user?.id) return;
    const newGoal = await createGoal(user.id, getGoalInput());
    await confirmGoalById(newGoal.id, user.id);
  };

  const isValid = startDate && endDate && title && (
    mrrTarget > 0 || clientsTarget > 0 || tasksTarget > 0 || projectsTarget > 0
  );

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={closeCreateModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Criar Nova Meta
          </DialogTitle>
          <DialogDescription>
            Defina o periodo e os objetivos da sua meta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period selector */}
          <PeriodSelector
            selectedType={periodType}
            startDate={startDate}
            endDate={endDate}
            onTypeChange={handlePeriodTypeChange}
            onDateChange={handleDateChange}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titulo da Meta</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meta de Dezembro, Sprint Q4..."
            />
            <p className="text-xs text-muted-foreground">
              O titulo e gerado automaticamente, mas voce pode personalizar.
            </p>
          </div>

          {/* AI Suggestions button */}
          {aiSuggestions && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleUseSuggestions}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Usar Todas as Sugestoes da IA
            </Button>
          )}

          {/* Target inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GoalInputField
              label="MRR (Receita Recorrente)"
              icon={<DollarSign className="h-4 w-4" />}
              value={mrrTarget}
              suggested={aiSuggestions?.mrr || 0}
              onChange={setMrrTarget}
              prefix="R$"
            />

            <GoalInputField
              label="Novos Clientes"
              icon={<Users className="h-4 w-4" />}
              value={clientsTarget}
              suggested={aiSuggestions?.clients || 0}
              onChange={setClientsTarget}
            />

            <GoalInputField
              label="Tarefas Concluidas"
              icon={<CheckSquare className="h-4 w-4" />}
              value={tasksTarget}
              suggested={aiSuggestions?.tasks || 0}
              onChange={setTasksTarget}
            />

            <GoalInputField
              label="Projetos Entregues"
              icon={<FolderKanban className="h-4 w-4" />}
              value={projectsTarget}
              suggested={aiSuggestions?.projects || 0}
              onChange={setProjectsTarget}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={closeCreateModal}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Rascunho
          </Button>
          <Button
            onClick={handleCreateAndActivate}
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Criar e Ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
