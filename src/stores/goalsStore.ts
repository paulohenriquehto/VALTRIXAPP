import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  MonthlyGoals,
  Goal,
  GoalProgress,
  GoalInsight,
  GoalSuggestions,
  GoalPeriodType,
  GoalInput,
  GoalFilters,
} from '../types/goals';
import { GoalsService } from '../services/goalsService';

type GoalTab = 'active' | 'drafts' | 'history' | 'expired';

interface GoalsStore {
  // State - Legacy (mantido para compatibilidade)
  currentGoals: MonthlyGoals | null;
  goalProgress: GoalProgress[];
  goalInsights: GoalInsight[];
  aiSuggestions: GoalSuggestions | null;
  isLoading: boolean;
  isConfigModalOpen: boolean;
  error: string | null;

  // Day info - Legacy
  dayOfMonth: number;
  daysInMonth: number;
  expectedProgress: number;

  // State - NEW: Multi-goal support
  goals: Goal[];
  activeGoals: Goal[];
  draftGoals: Goal[];
  completedGoals: Goal[];
  expiredGoals: Goal[];
  selectedGoal: Goal | null;
  goalProgressMap: Map<string, GoalProgress[]>;
  filters: GoalFilters;
  selectedPeriodType: GoalPeriodType;
  isCreateModalOpen: boolean;
  activeTab: GoalTab;

  // Actions - Legacy
  loadGoals: (userId: string) => Promise<void>;
  loadAISuggestions: (userId: string) => Promise<void>;
  loadGoalInsights: (userId: string) => Promise<void>;
  saveGoals: (userId: string, goals: Partial<MonthlyGoals>) => Promise<void>;
  confirmGoals: (userId: string) => Promise<void>;
  updateProgress: (userId: string) => Promise<void>;
  setMetricTarget: (
    metric: 'mrr' | 'clients' | 'tasks' | 'projects',
    value: number
  ) => void;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  clearError: () => void;
  reset: () => void;

  // Actions - NEW: Multi-goal support
  loadAllGoals: (userId: string) => Promise<void>;
  loadActiveGoals: (userId: string) => Promise<void>;
  loadDraftGoals: (userId: string) => Promise<void>;
  loadCompletedGoals: (userId: string) => Promise<void>;
  loadExpiredGoals: (userId: string) => Promise<void>;
  createGoal: (userId: string, input: GoalInput) => Promise<Goal>;
  updateGoal: (goalId: string, userId: string, updates: Partial<GoalInput>) => Promise<void>;
  confirmGoalById: (goalId: string, userId: string) => Promise<void>;
  completeGoal: (goalId: string, userId: string) => Promise<void>;
  checkAutoComplete: (userId: string) => Promise<void>;
  deleteGoal: (goalId: string, userId: string) => Promise<void>;
  selectGoal: (goal: Goal | null) => void;
  setSelectedPeriodType: (type: GoalPeriodType) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  setActiveTab: (tab: GoalTab) => void;
  setFilters: (filters: GoalFilters) => void;
  getGoalProgress: (goalId: string) => GoalProgress[];
}

const initialState = {
  // Legacy state
  currentGoals: null,
  goalProgress: [],
  goalInsights: [],
  aiSuggestions: null,
  isLoading: false,
  isConfigModalOpen: false,
  error: null,
  dayOfMonth: new Date().getDate(),
  daysInMonth: new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate(),
  expectedProgress: GoalsService.getExpectedProgress(),

  // New state
  goals: [] as Goal[],
  activeGoals: [] as Goal[],
  draftGoals: [] as Goal[],
  completedGoals: [] as Goal[],
  expiredGoals: [] as Goal[],
  selectedGoal: null as Goal | null,
  goalProgressMap: new Map<string, GoalProgress[]>(),
  filters: {} as GoalFilters,
  selectedPeriodType: 'monthly' as GoalPeriodType,
  isCreateModalOpen: false,
  activeTab: 'active' as GoalTab,
};

export const useGoalsStore = create<GoalsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================================
      // LEGACY ACTIONS (mantidas para compatibilidade)
      // ============================================

      loadGoals: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Update progress first
          await GoalsService.updateProgress(userId);

          // Then load goals
          const goals = await GoalsService.getCurrentGoals(userId);
          const progress = GoalsService.calculateProgress(goals);
          const dayInfo = GoalsService.getDayInfo();

          set({
            currentGoals: goals,
            goalProgress: progress,
            ...dayInfo,
            expectedProgress: GoalsService.getExpectedProgress(),
            isLoading: false,
          });

          // Also load all goals for the new UI
          await get().loadAllGoals(userId);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao carregar metas',
            isLoading: false,
          });
        }
      },

      loadAISuggestions: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const suggestions = await GoalsService.getAISuggestions(userId);
          set({ aiSuggestions: suggestions, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao carregar sugestoes',
            isLoading: false,
          });
        }
      },

      loadGoalInsights: async (userId: string) => {
        try {
          const insights = await GoalsService.getGoalInsights(userId);
          set({ goalInsights: insights });
        } catch (error) {
          console.error('Erro ao carregar insights de metas:', error);
        }
      },

      saveGoals: async (userId: string, goals: Partial<MonthlyGoals>) => {
        set({ isLoading: true, error: null });
        try {
          const savedGoals = await GoalsService.saveGoals(userId, goals);
          const progress = GoalsService.calculateProgress(savedGoals);
          set({
            currentGoals: savedGoals,
            goalProgress: progress,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao salvar metas',
            isLoading: false,
          });
        }
      },

      confirmGoals: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const confirmedGoals = await GoalsService.confirmGoals(userId);
          const progress = GoalsService.calculateProgress(confirmedGoals);
          set({
            currentGoals: confirmedGoals,
            goalProgress: progress,
            isLoading: false,
            isConfigModalOpen: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao confirmar metas',
            isLoading: false,
          });
        }
      },

      updateProgress: async (userId: string) => {
        try {
          await GoalsService.updateProgress(userId);
          await get().loadGoals(userId);
        } catch (error) {
          console.error('Erro ao atualizar progresso:', error);
        }
      },

      setMetricTarget: (metric, value) => {
        const { currentGoals } = get();
        const targetKey = `${metric}_target` as keyof MonthlyGoals;
        set({
          currentGoals: {
            ...currentGoals,
            [targetKey]: value,
          } as MonthlyGoals,
        });
      },

      openConfigModal: () => set({ isConfigModalOpen: true }),
      closeConfigModal: () => set({ isConfigModalOpen: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),

      // ============================================
      // NEW ACTIONS: Multi-goal support
      // ============================================

      loadAllGoals: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const [active, drafts, completed, expired] = await Promise.all([
            GoalsService.getAllGoals(userId, { status: 'active' }),
            GoalsService.getAllGoals(userId, { status: 'draft' }),
            GoalsService.getAllGoals(userId, { status: 'completed' }),
            GoalsService.getAllGoals(userId, { status: 'expired' }),
          ]);

          const allGoals = [...active, ...drafts, ...completed, ...expired];

          // Calculate progress for each goal
          const progressMap = new Map<string, GoalProgress[]>();
          allGoals.forEach((goal) => {
            progressMap.set(goal.id, GoalsService.calculateGoalProgress(goal));
          });

          set({
            goals: allGoals,
            activeGoals: active,
            draftGoals: drafts,
            completedGoals: completed,
            expiredGoals: expired,
            goalProgressMap: progressMap,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao carregar metas',
            isLoading: false,
          });
        }
      },

      loadActiveGoals: async (userId: string) => {
        try {
          const active = await GoalsService.getGoalsByStatus(userId, 'active');
          set({ activeGoals: active });
        } catch (error) {
          console.error('Erro ao carregar metas ativas:', error);
        }
      },

      loadDraftGoals: async (userId: string) => {
        try {
          const drafts = await GoalsService.getGoalsByStatus(userId, 'draft');
          set({ draftGoals: drafts });
        } catch (error) {
          console.error('Erro ao carregar rascunhos:', error);
        }
      },

      loadCompletedGoals: async (userId: string) => {
        try {
          const completed = await GoalsService.getAllGoals(userId, { status: 'completed' });
          set({ completedGoals: completed });
        } catch (error) {
          console.error('Erro ao carregar historico:', error);
        }
      },

      loadExpiredGoals: async (userId: string) => {
        try {
          const expired = await GoalsService.getAllGoals(userId, { status: 'expired' });
          set({ expiredGoals: expired });
        } catch (error) {
          console.error('Erro ao carregar metas expiradas:', error);
        }
      },

      createGoal: async (userId: string, input: GoalInput) => {
        set({ isLoading: true, error: null });
        try {
          const newGoal = await GoalsService.createGoal(userId, input);

          // Add to drafts
          const { draftGoals, goalProgressMap } = get();
          const progress = GoalsService.calculateGoalProgress(newGoal);
          goalProgressMap.set(newGoal.id, progress);

          set({
            draftGoals: [newGoal, ...draftGoals],
            goalProgressMap: new Map(goalProgressMap),
            isLoading: false,
            isCreateModalOpen: false,
          });

          return newGoal;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao criar meta',
            isLoading: false,
          });
          throw error;
        }
      },

      updateGoal: async (goalId: string, userId: string, updates: Partial<GoalInput>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedGoal = await GoalsService.updateGoal(goalId, userId, updates);

          // Update in state
          const { goals, activeGoals, draftGoals, completedGoals, expiredGoals, goalProgressMap } = get();

          const updateList = (list: Goal[]) =>
            list.map((g) => (g.id === goalId ? updatedGoal : g));

          const progress = GoalsService.calculateGoalProgress(updatedGoal);
          goalProgressMap.set(goalId, progress);

          set({
            goals: updateList(goals),
            activeGoals: updateList(activeGoals),
            draftGoals: updateList(draftGoals),
            completedGoals: updateList(completedGoals),
            expiredGoals: updateList(expiredGoals),
            goalProgressMap: new Map(goalProgressMap),
            selectedGoal: updatedGoal,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao atualizar meta',
            isLoading: false,
          });
        }
      },

      confirmGoalById: async (goalId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const confirmedGoal = await GoalsService.confirmGoalById(goalId, userId);

          // Move from drafts to active
          const { draftGoals, activeGoals, goalProgressMap } = get();

          const newDrafts = draftGoals.filter((g) => g.id !== goalId);
          const newActive = [confirmedGoal, ...activeGoals];

          const progress = GoalsService.calculateGoalProgress(confirmedGoal);
          goalProgressMap.set(goalId, progress);

          set({
            draftGoals: newDrafts,
            activeGoals: newActive,
            goalProgressMap: new Map(goalProgressMap),
            selectedGoal: confirmedGoal,
            isLoading: false,
            isConfigModalOpen: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao confirmar meta',
            isLoading: false,
          });
        }
      },

      completeGoal: async (goalId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const completedGoal = await GoalsService.completeGoal(goalId, userId);

          // Move from active to completed
          const { activeGoals, completedGoals, goalProgressMap } = get();

          const newActive = activeGoals.filter((g) => g.id !== goalId);
          const newCompleted = [completedGoal, ...completedGoals];

          const progress = GoalsService.calculateGoalProgress(completedGoal);
          goalProgressMap.set(goalId, progress);

          set({
            activeGoals: newActive,
            completedGoals: newCompleted,
            goalProgressMap: new Map(goalProgressMap),
            selectedGoal: completedGoal,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao concluir meta',
            isLoading: false,
          });
        }
      },

      checkAutoComplete: async (userId: string) => {
        try {
          const autoCompleted = await GoalsService.checkAutoComplete(userId);
          if (autoCompleted.length > 0) {
            // Reload all goals to refresh the state
            await get().loadAllGoals(userId);
          }
        } catch (error) {
          console.error('Erro ao verificar auto-conclusao:', error);
        }
      },

      deleteGoal: async (goalId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await GoalsService.deleteGoal(goalId, userId);

          // Remove from all lists
          const { goals, activeGoals, draftGoals, completedGoals, expiredGoals, goalProgressMap, selectedGoal } = get();

          const filterList = (list: Goal[]) => list.filter((g) => g.id !== goalId);
          goalProgressMap.delete(goalId);

          set({
            goals: filterList(goals),
            activeGoals: filterList(activeGoals),
            draftGoals: filterList(draftGoals),
            completedGoals: filterList(completedGoals),
            expiredGoals: filterList(expiredGoals),
            goalProgressMap: new Map(goalProgressMap),
            selectedGoal: selectedGoal?.id === goalId ? null : selectedGoal,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Erro ao excluir meta',
            isLoading: false,
          });
        }
      },

      selectGoal: (goal: Goal | null) => {
        set({ selectedGoal: goal });
      },

      setSelectedPeriodType: (type: GoalPeriodType) => {
        set({ selectedPeriodType: type });
      },

      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),

      setActiveTab: (tab: GoalTab) => {
        set({ activeTab: tab });
      },

      setFilters: (filters: GoalFilters) => {
        set({ filters });
      },

      getGoalProgress: (goalId: string) => {
        const { goalProgressMap } = get();
        return goalProgressMap.get(goalId) || [];
      },
    }),
    { name: 'goals-store' }
  )
);

// Selectors
export const useActiveGoals = () => useGoalsStore((state) => state.activeGoals);
export const useDraftGoals = () => useGoalsStore((state) => state.draftGoals);
export const useCompletedGoals = () => useGoalsStore((state) => state.completedGoals);
export const useExpiredGoals = () => useGoalsStore((state) => state.expiredGoals);
export const useSelectedGoal = () => useGoalsStore((state) => state.selectedGoal);
export const useGoalProgressMap = () => useGoalsStore((state) => state.goalProgressMap);
