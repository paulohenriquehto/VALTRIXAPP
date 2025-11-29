import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  SalesDailyActivity,
  SalesGoal,
  SalesSummary,
  SalesFunnelStage,
  SalesChartData,
  SalesCheckin,
  SalesActivityInput,
  SalesStrategy,
} from '@/types/sales';
import type {
  UserStreak,
  UserAchievement,
  UserGamification,
} from '@/types/gamification';
import { SalesService } from '@/services/salesService';
import { GamificationService } from '@/services/gamificationService';

type SalesTab = 'dashboard' | 'goals' | 'achievements' | 'coach';
type CheckinType = 'manual' | 'automatic' | 'chat';

interface SalesStore {
  // State - Atividades
  todayActivity: SalesDailyActivity | null;
  activities: SalesDailyActivity[];
  summary: SalesSummary | null;
  funnelData: SalesFunnelStage[];
  chartData: SalesChartData[];

  // State - Metas
  activeGoal: SalesGoal | null;
  allGoals: SalesGoal[];

  // State - Estratégias
  strategies: SalesStrategy[];

  // State - Gamification
  streaks: UserStreak[];
  achievements: UserAchievement[];
  allAchievements: Achievement[];
  gamification: UserGamification | null;
  newAchievements: UserAchievement[];

  // State - Check-in
  showCheckinModal: boolean;
  checkinType: CheckinType;
  currentCheckin: SalesCheckin | null;
  checkinDismissedThisSession: boolean;

  // State - UI
  isLoading: boolean;
  error: string | null;
  selectedPeriod: number;
  activeTab: SalesTab;

  // Actions - Carregamento
  loadAll: (userId: string) => Promise<void>;
  loadTodayActivity: (userId: string) => Promise<void>;
  loadSummary: (userId: string, days?: number) => Promise<void>;
  loadFunnelData: (userId: string, days?: number) => Promise<void>;
  loadChartData: (userId: string, days?: number) => Promise<void>;
  loadGoals: (userId: string) => Promise<void>;
  loadStrategies: (userId: string) => Promise<void>;

  // Actions - Atividades
  updateActivity: (userId: string, updates: SalesActivityInput) => Promise<void>;
  incrementActivity: (
    userId: string,
    field: keyof SalesActivityInput,
    amount?: number
  ) => Promise<void>;

  // Actions - Metas
  createGoal: (userId: string, input: SalesGoalInput) => Promise<SalesGoal>;
  updateGoal: (
    goalId: string,
    userId: string,
    updates: Partial<SalesGoalInput>
  ) => Promise<void>;
  deleteGoal: (goalId: string, userId: string) => Promise<void>;

  // Actions - Gamification
  loadGamification: (userId: string) => Promise<void>;
  checkAchievements: (userId: string) => Promise<void>;
  dismissNewAchievements: () => void;

  // Actions - Check-in
  checkForAutoCheckin: (userId: string) => Promise<void>;
  startManualCheckin: () => void;
  startChatCheckin: () => void;
  closeCheckin: () => void;

  // Actions - Util
  setSelectedPeriod: (days: number) => void;
  setActiveTab: (tab: SalesTab) => void;
  clearError: () => void;
  reset: () => void;
}

// Import que faltou
import type { Achievement } from '@/types/gamification';
import type { SalesGoalInput } from '@/types/sales';

const initialState = {
  // Atividades
  todayActivity: null as SalesDailyActivity | null,
  activities: [] as SalesDailyActivity[],
  summary: null as SalesSummary | null,
  funnelData: [] as SalesFunnelStage[],
  chartData: [] as SalesChartData[],

  // Metas
  activeGoal: null as SalesGoal | null,
  allGoals: [] as SalesGoal[],

  // Estratégias
  strategies: [] as SalesStrategy[],

  // Gamification
  streaks: [] as UserStreak[],
  achievements: [] as UserAchievement[],
  allAchievements: [] as Achievement[],
  gamification: null as UserGamification | null,
  newAchievements: [] as UserAchievement[],

  // Check-in
  showCheckinModal: false,
  checkinType: 'manual' as CheckinType,
  currentCheckin: null as SalesCheckin | null,
  checkinDismissedThisSession: false,

  // UI
  isLoading: false,
  error: null as string | null,
  selectedPeriod: 30,
  activeTab: 'dashboard' as SalesTab,
};

export const useSalesStore = create<SalesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ===== CARREGAMENTO =====

      loadAll: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await Promise.all([
            get().loadTodayActivity(userId),
            get().loadSummary(userId),
            get().loadFunnelData(userId),
            get().loadChartData(userId),
            get().loadGoals(userId),
            get().loadGamification(userId),
            get().loadStrategies(userId),
          ]);

          // Check para auto check-in
          await get().checkForAutoCheckin(userId);

          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao carregar dados',
            isLoading: false,
          });
        }
      },

      loadTodayActivity: async (userId: string) => {
        try {
          const activity = await SalesService.getTodayActivity(userId);
          set({ todayActivity: activity });
        } catch (error) {
          console.error('Error loading today activity:', error);
        }
      },

      loadSummary: async (userId: string, days?: number) => {
        try {
          const period = days || get().selectedPeriod;
          const summary = await SalesService.getSummary(userId, period);
          set({ summary });
        } catch (error) {
          console.error('Error loading summary:', error);
        }
      },

      loadFunnelData: async (userId: string, days?: number) => {
        try {
          const period = days || get().selectedPeriod;
          const funnelData = await SalesService.getFunnelData(userId, period);
          set({ funnelData });
        } catch (error) {
          console.error('Error loading funnel data:', error);
        }
      },

      loadChartData: async (userId: string, days?: number) => {
        try {
          const period = days || get().selectedPeriod;
          const chartData = await SalesService.getChartData(userId, period);
          set({ chartData });
        } catch (error) {
          console.error('Error loading chart data:', error);
        }
      },

      loadGoals: async (userId: string) => {
        try {
          const [activeGoal, allGoals] = await Promise.all([
            SalesService.getActiveGoal(userId),
            SalesService.getAllGoals(userId),
          ]);
          set({ activeGoal, allGoals });
        } catch (error) {
          console.error('Error loading goals:', error);
        }
      },

      loadStrategies: async (userId: string) => {
        try {
          const strategies = await SalesService.getStrategies(userId);
          set({ strategies });
        } catch (error) {
          console.error('Error loading strategies:', error);
        }
      },

      // ===== ATIVIDADES =====

      updateActivity: async (userId: string, updates: SalesActivityInput) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const updated = await SalesService.upsertActivity(userId, today, updates);
          set({ todayActivity: updated });

          // Update streak se teve atividade de prospecção
          if (updates.contacts_sent || updates.calls_made || updates.meetings_held) {
            await GamificationService.updateStreak(userId, 'daily_prospecting', today);
            await get().loadGamification(userId);
            await get().checkAchievements(userId);
          }

          // Recarregar resumo
          await get().loadSummary(userId);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao atualizar atividade',
          });
        }
      },

      incrementActivity: async (
        userId: string,
        field: keyof SalesActivityInput,
        amount: number = 1
      ) => {
        try {
          const updated = await SalesService.incrementActivity(userId, field, amount);
          set({ todayActivity: updated });

          // Update streak
          const today = new Date().toISOString().split('T')[0];
          if (['contacts_sent', 'calls_made', 'meetings_held'].includes(field)) {
            await GamificationService.updateStreak(userId, 'daily_prospecting', today);
            await get().loadGamification(userId);
            await get().checkAchievements(userId);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao incrementar atividade',
          });
        }
      },

      // ===== METAS =====

      createGoal: async (userId: string, input: SalesGoalInput) => {
        try {
          const newGoal = await SalesService.createGoal(userId, input);
          const { allGoals } = get();
          set({ allGoals: [newGoal, ...allGoals] });

          // Se for a meta ativa atual
          const today = new Date().toISOString().split('T')[0];
          if (input.start_date <= today && input.end_date >= today) {
            set({ activeGoal: newGoal });
          }

          return newGoal;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao criar meta',
          });
          throw error;
        }
      },

      updateGoal: async (goalId: string, userId: string, updates: Partial<SalesGoalInput>) => {
        try {
          const updated = await SalesService.updateGoal(goalId, userId, updates);
          const { allGoals, activeGoal } = get();

          set({
            allGoals: allGoals.map((g) => (g.id === goalId ? updated : g)),
            activeGoal: activeGoal?.id === goalId ? updated : activeGoal,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao atualizar meta',
          });
        }
      },

      deleteGoal: async (goalId: string, userId: string) => {
        try {
          await SalesService.deleteGoal(goalId, userId);
          const { allGoals, activeGoal } = get();

          set({
            allGoals: allGoals.filter((g) => g.id !== goalId),
            activeGoal: activeGoal?.id === goalId ? null : activeGoal,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao excluir meta',
          });
        }
      },

      // ===== GAMIFICATION =====

      loadGamification: async (userId: string) => {
        try {
          const [streaks, achievements, allAchievements, gamification] = await Promise.all([
            GamificationService.getStreaks(userId),
            GamificationService.getUserAchievements(userId),
            GamificationService.getAllAchievements(),
            GamificationService.getGamification(userId),
          ]);
          set({ streaks, achievements, allAchievements, gamification });
        } catch (error) {
          console.error('Error loading gamification:', error);
        }
      },

      checkAchievements: async (userId: string) => {
        try {
          const { streaks, todayActivity, summary } = get();

          const stats = {
            streaks,
            totals: {
              contacts: summary?.totals.contacts || 0,
              calls: summary?.totals.calls || 0,
              meetings: summary?.totals.meetings || 0,
              deals: summary?.totals.deals || 0,
              revenue: summary?.totals.revenue || 0,
            },
            todayActivity: {
              contacts: todayActivity?.contacts_sent || 0,
              calls: todayActivity?.calls_made || 0,
              meetings: todayActivity?.meetings_held || 0,
            },
          };

          const newlyUnlocked = await GamificationService.checkAndUnlockAchievements(
            userId,
            stats
          );

          if (newlyUnlocked.length > 0) {
            set({ newAchievements: newlyUnlocked });
            await get().loadGamification(userId);
          }
        } catch (error) {
          console.error('Error checking achievements:', error);
        }
      },

      dismissNewAchievements: () => set({ newAchievements: [] }),

      // ===== CHECK-IN =====

      checkForAutoCheckin: async (userId: string) => {
        try {
          // Se já foi fechado nesta sessão, não abrir novamente
          if (get().checkinDismissedThisSession) return;

          const shouldAuto = await SalesService.shouldAutoCheckin(userId);
          if (shouldAuto) {
            set({ showCheckinModal: true, checkinType: 'automatic' });
          }
        } catch (error) {
          console.error('Error checking auto check-in:', error);
        }
      },

      startManualCheckin: () => set({ showCheckinModal: true, checkinType: 'manual' }),

      startChatCheckin: () => set({ showCheckinModal: true, checkinType: 'chat' }),

      closeCheckin: () => set({
        showCheckinModal: false,
        currentCheckin: null,
        checkinDismissedThisSession: true,
      }),

      // ===== UTIL =====

      setSelectedPeriod: (days: number) => set({ selectedPeriod: days }),

      setActiveTab: (tab: SalesTab) => set({ activeTab: tab }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    { name: 'sales-store' }
  )
);

// Selectors
export const useTodayActivity = () => useSalesStore((state) => state.todayActivity);
export const useSalesSummary = () => useSalesStore((state) => state.summary);
export const useFunnelData = () => useSalesStore((state) => state.funnelData);
export const useChartData = () => useSalesStore((state) => state.chartData);
export const useActiveGoal = () => useSalesStore((state) => state.activeGoal);
export const useSalesStreaks = () => useSalesStore((state) => state.streaks);
export const useSalesAchievements = () => useSalesStore((state) => state.achievements);
export const useSalesGamification = () => useSalesStore((state) => state.gamification);
export const useNewAchievements = () => useSalesStore((state) => state.newAchievements);
