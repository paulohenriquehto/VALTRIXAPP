import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  PipelineStage,
  StageInput,
  StageUpdate,
  Prospect,
  ProspectInput,
  ProspectUpdate,
  ProspectInteraction,
  InteractionInput,
  ProspectFilters,
  PipelineMetrics,
  DragEndResult,
} from '../types/prospects';
import { ProspectService } from '../services/prospectService';

type DialogMode = 'create' | 'edit';

interface ProspectsStore {
  // State
  stages: PipelineStage[];
  prospects: Prospect[];
  selectedProspect: Prospect | null;
  selectedStage: PipelineStage | null;
  interactions: ProspectInteraction[];
  filters: ProspectFilters;
  metrics: PipelineMetrics | null;
  isLoading: boolean;
  isLoadingInteractions: boolean;
  error: string | null;

  // UI State
  isProspectDialogOpen: boolean;
  isStageDialogOpen: boolean;
  isInteractionDialogOpen: boolean;
  isDetailPanelOpen: boolean;
  dialogMode: DialogMode;
  stageDialogMode: DialogMode;
  defaultStageId: string | null;

  // Drag state
  isDragging: boolean;
  activeProspectId: string | null;

  // Computed
  prospectsByStage: Map<string, Prospect[]>;

  // Actions - Stages
  loadStages: (userId: string) => Promise<void>;
  loadStagesWithMetrics: (userId: string) => Promise<void>;
  createStage: (userId: string, input: StageInput) => Promise<void>;
  updateStage: (stageId: string, updates: StageUpdate) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;
  reorderStages: (userId: string, stageIds: string[]) => Promise<void>;

  // Actions - Prospects
  loadProspects: (userId: string, filters?: ProspectFilters) => Promise<void>;
  createProspect: (userId: string, stageId: string, input: ProspectInput) => Promise<Prospect>;
  updateProspect: (prospectId: string, updates: ProspectUpdate) => Promise<void>;
  deleteProspect: (prospectId: string) => Promise<void>;
  moveProspect: (result: DragEndResult, userId: string) => Promise<void>;
  markAsWon: (prospectId: string, userId: string) => Promise<void>;
  markAsLost: (prospectId: string, userId: string, reason?: string) => Promise<void>;
  convertToClient: (prospectId: string, userId: string) => Promise<string>;

  // Actions - Interactions
  loadInteractions: (prospectId: string) => Promise<void>;
  createInteraction: (prospectId: string, userId: string, input: InteractionInput) => Promise<void>;

  // Actions - Metrics
  loadMetrics: (userId: string) => Promise<void>;

  // Actions - UI
  selectProspect: (prospect: Prospect | null) => void;
  selectStage: (stage: PipelineStage | null) => void;
  openProspectDialog: (mode: DialogMode, stageId?: string) => void;
  closeProspectDialog: () => void;
  openStageDialog: (mode: DialogMode) => void;
  closeStageDialog: () => void;
  openInteractionDialog: () => void;
  closeInteractionDialog: () => void;
  openDetailPanel: (prospect: Prospect) => void;
  closeDetailPanel: () => void;
  setFilters: (filters: ProspectFilters) => void;
  clearFilters: () => void;
  setDragging: (isDragging: boolean, prospectId?: string) => void;
  clearError: () => void;
  reset: () => void;

  // Helpers
  getProspectsByStageId: (stageId: string) => Prospect[];
  refreshData: (userId: string) => Promise<void>;
}

const initialState = {
  stages: [] as PipelineStage[],
  prospects: [] as Prospect[],
  selectedProspect: null as Prospect | null,
  selectedStage: null as PipelineStage | null,
  interactions: [] as ProspectInteraction[],
  filters: {} as ProspectFilters,
  metrics: null as PipelineMetrics | null,
  isLoading: false,
  isLoadingInteractions: false,
  error: null as string | null,

  // UI State
  isProspectDialogOpen: false,
  isStageDialogOpen: false,
  isInteractionDialogOpen: false,
  isDetailPanelOpen: false,
  dialogMode: 'create' as DialogMode,
  stageDialogMode: 'create' as DialogMode,
  defaultStageId: null as string | null,

  // Drag state
  isDragging: false,
  activeProspectId: null as string | null,

  // Computed
  prospectsByStage: new Map<string, Prospect[]>(),
};

export const useProspectsStore = create<ProspectsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================================
      // STAGES ACTIONS
      // ============================================

      loadStages: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Garantir que stages padrao existem
          await ProspectService.createDefaultStages(userId);
          const stages = await ProspectService.getStages(userId);
          set({ stages, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao carregar stages',
            isLoading: false,
          });
        }
      },

      loadStagesWithMetrics: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await ProspectService.createDefaultStages(userId);
          const stages = await ProspectService.getStagesWithMetrics(userId);
          set({ stages, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao carregar stages',
            isLoading: false,
          });
        }
      },

      createStage: async (userId: string, input: StageInput) => {
        set({ isLoading: true, error: null });
        try {
          const newStage = await ProspectService.createStage(userId, input);
          const { stages } = get();
          set({
            stages: [...stages, newStage],
            isLoading: false,
            isStageDialogOpen: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao criar stage',
            isLoading: false,
          });
        }
      },

      updateStage: async (stageId: string, updates: StageUpdate) => {
        set({ isLoading: true, error: null });
        try {
          const updatedStage = await ProspectService.updateStage(stageId, updates);
          const { stages } = get();
          set({
            stages: stages.map((s) => (s.id === stageId ? updatedStage : s)),
            selectedStage: updatedStage,
            isLoading: false,
            isStageDialogOpen: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao atualizar stage',
            isLoading: false,
          });
        }
      },

      deleteStage: async (stageId: string) => {
        set({ isLoading: true, error: null });
        try {
          await ProspectService.deleteStage(stageId);
          const { stages, selectedStage } = get();
          set({
            stages: stages.filter((s) => s.id !== stageId),
            selectedStage: selectedStage?.id === stageId ? null : selectedStage,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao deletar stage',
            isLoading: false,
          });
        }
      },

      reorderStages: async (userId: string, stageIds: string[]) => {
        const { stages } = get();
        // Optimistic update
        const reorderedStages = stageIds
          .map((id, index) => {
            const stage = stages.find((s) => s.id === id);
            return stage ? { ...stage, position: index } : null;
          })
          .filter(Boolean) as PipelineStage[];

        set({ stages: reorderedStages });

        try {
          await ProspectService.reorderStages(userId, stageIds);
        } catch (error) {
          // Rollback on error
          set({ stages });
          set({
            error: error instanceof Error ? error.message : 'Erro ao reordenar stages',
          });
        }
      },

      // ============================================
      // PROSPECTS ACTIONS
      // ============================================

      loadProspects: async (userId: string, filters?: ProspectFilters) => {
        set({ isLoading: true, error: null });
        try {
          const prospects = await ProspectService.getProspects(userId, filters);

          // Group by stage
          const prospectsByStage = new Map<string, Prospect[]>();
          prospects.forEach((prospect) => {
            const current = prospectsByStage.get(prospect.stageId) || [];
            prospectsByStage.set(prospect.stageId, [...current, prospect]);
          });

          // Sort by position within each stage
          prospectsByStage.forEach((stageProspects, stageId) => {
            prospectsByStage.set(
              stageId,
              stageProspects.sort((a, b) => a.positionInStage - b.positionInStage)
            );
          });

          set({
            prospects,
            prospectsByStage,
            filters: filters || {},
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao carregar prospects',
            isLoading: false,
          });
        }
      },

      createProspect: async (userId: string, stageId: string, input: ProspectInput) => {
        set({ isLoading: true, error: null });
        try {
          const newProspect = await ProspectService.createProspect(userId, stageId, input);
          const { prospects, prospectsByStage, stages } = get();

          // Add to prospects list
          const newProspects = [...prospects, newProspect];

          // Add to stage group
          const stageProspects = prospectsByStage.get(stageId) || [];
          prospectsByStage.set(stageId, [...stageProspects, newProspect]);

          // Update stage metrics
          const updatedStages = stages.map((s) => {
            if (s.id === stageId) {
              return {
                ...s,
                prospectCount: (s.prospectCount || 0) + 1,
                totalValue: (s.totalValue || 0) + (newProspect.expectedValue || 0),
              };
            }
            return s;
          });

          set({
            prospects: newProspects,
            prospectsByStage: new Map(prospectsByStage),
            stages: updatedStages,
            isLoading: false,
            isProspectDialogOpen: false,
          });

          return newProspect;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao criar prospect',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProspect: async (prospectId: string, updates: ProspectUpdate) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProspect = await ProspectService.updateProspect(prospectId, updates);
          const { prospects, prospectsByStage, selectedProspect } = get();

          // Update in prospects list
          const newProspects = prospects.map((p) => (p.id === prospectId ? updatedProspect : p));

          // Update in stage group
          const stageId = updatedProspect.stageId;
          const stageProspects = prospectsByStage.get(stageId) || [];
          prospectsByStage.set(
            stageId,
            stageProspects.map((p) => (p.id === prospectId ? updatedProspect : p))
          );

          set({
            prospects: newProspects,
            prospectsByStage: new Map(prospectsByStage),
            selectedProspect: selectedProspect?.id === prospectId ? updatedProspect : selectedProspect,
            isLoading: false,
            isProspectDialogOpen: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao atualizar prospect',
            isLoading: false,
          });
        }
      },

      deleteProspect: async (prospectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { prospects, prospectsByStage, selectedProspect } = get();
          const prospect = prospects.find((p) => p.id === prospectId);

          await ProspectService.deleteProspect(prospectId);

          // Remove from prospects list
          const newProspects = prospects.filter((p) => p.id !== prospectId);

          // Remove from stage group
          if (prospect) {
            const stageProspects = prospectsByStage.get(prospect.stageId) || [];
            prospectsByStage.set(
              prospect.stageId,
              stageProspects.filter((p) => p.id !== prospectId)
            );
          }

          set({
            prospects: newProspects,
            prospectsByStage: new Map(prospectsByStage),
            selectedProspect: selectedProspect?.id === prospectId ? null : selectedProspect,
            isDetailPanelOpen: selectedProspect?.id === prospectId ? false : get().isDetailPanelOpen,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao deletar prospect',
            isLoading: false,
          });
        }
      },

      moveProspect: async (result: DragEndResult, userId: string) => {
        const { prospectId, sourceStageId, destinationStageId, destinationIndex } = result;
        const { prospects, prospectsByStage, stages } = get();

        // Find the prospect
        const prospect = prospects.find((p) => p.id === prospectId);
        if (!prospect) return;

        // Optimistic update
        const sourceProspects = [...(prospectsByStage.get(sourceStageId) || [])];
        const destProspects =
          sourceStageId === destinationStageId
            ? sourceProspects
            : [...(prospectsByStage.get(destinationStageId) || [])];

        // Remove from source
        const sourceIndex = sourceProspects.findIndex((p) => p.id === prospectId);
        if (sourceIndex > -1) {
          sourceProspects.splice(sourceIndex, 1);
        }

        // Add to destination
        const movedProspect = { ...prospect, stageId: destinationStageId, positionInStage: destinationIndex };
        destProspects.splice(destinationIndex, 0, movedProspect);

        // Update positions
        const updatedSourceProspects = sourceProspects.map((p, i) => ({ ...p, positionInStage: i }));
        const updatedDestProspects = destProspects.map((p, i) => ({ ...p, positionInStage: i }));

        // Update maps
        const newProspectsByStage = new Map(prospectsByStage);
        newProspectsByStage.set(sourceStageId, updatedSourceProspects);
        if (sourceStageId !== destinationStageId) {
          newProspectsByStage.set(destinationStageId, updatedDestProspects);
        }

        // Update prospects array
        const newProspects = prospects.map((p) => {
          if (p.id === prospectId) return movedProspect;
          if (p.stageId === sourceStageId) {
            const updated = updatedSourceProspects.find((up) => up.id === p.id);
            return updated || p;
          }
          if (p.stageId === destinationStageId) {
            const updated = updatedDestProspects.find((up) => up.id === p.id);
            return updated || p;
          }
          return p;
        });

        // Update stage metrics
        const updatedStages = stages.map((s) => {
          if (s.id === sourceStageId && sourceStageId !== destinationStageId) {
            return {
              ...s,
              prospectCount: Math.max(0, (s.prospectCount || 0) - 1),
              totalValue: Math.max(0, (s.totalValue || 0) - (prospect.expectedValue || 0)),
            };
          }
          if (s.id === destinationStageId && sourceStageId !== destinationStageId) {
            return {
              ...s,
              prospectCount: (s.prospectCount || 0) + 1,
              totalValue: (s.totalValue || 0) + (prospect.expectedValue || 0),
            };
          }
          return s;
        });

        set({
          prospects: newProspects,
          prospectsByStage: newProspectsByStage,
          stages: updatedStages,
        });

        // Call API
        try {
          await ProspectService.moveProspect(prospectId, destinationStageId, destinationIndex, userId);
        } catch (error) {
          // Rollback on error
          set({
            prospects,
            prospectsByStage,
            stages,
            error: error instanceof Error ? error.message : 'Erro ao mover prospect',
          });
        }
      },

      markAsWon: async (prospectId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await ProspectService.markAsWon(prospectId, userId);
          // Refresh data
          await get().refreshData(userId);
          set({ isLoading: false, isDetailPanelOpen: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao marcar como ganho',
            isLoading: false,
          });
        }
      },

      markAsLost: async (prospectId: string, userId: string, reason?: string) => {
        set({ isLoading: true, error: null });
        try {
          await ProspectService.markAsLost(prospectId, userId, reason);
          await get().refreshData(userId);
          set({ isLoading: false, isDetailPanelOpen: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao marcar como perdido',
            isLoading: false,
          });
        }
      },

      convertToClient: async (prospectId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const clientId = await ProspectService.convertToClient(prospectId, userId);
          await get().refreshData(userId);
          set({ isLoading: false, isDetailPanelOpen: false });
          return clientId;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao converter para cliente',
            isLoading: false,
          });
          throw error;
        }
      },

      // ============================================
      // INTERACTIONS ACTIONS
      // ============================================

      loadInteractions: async (prospectId: string) => {
        set({ isLoadingInteractions: true });
        try {
          const interactions = await ProspectService.getInteractions(prospectId);
          set({ interactions, isLoadingInteractions: false });
        } catch (error) {
          console.error('Erro ao carregar interacoes:', error);
          set({ isLoadingInteractions: false });
        }
      },

      createInteraction: async (prospectId: string, userId: string, input: InteractionInput) => {
        set({ isLoading: true, error: null });
        try {
          const newInteraction = await ProspectService.createInteraction(prospectId, userId, input);
          const { interactions, prospects, prospectsByStage } = get();

          // Update interactions list
          set({
            interactions: [newInteraction, ...interactions],
            isLoading: false,
            isInteractionDialogOpen: false,
          });

          // Update lastInteractionAt on prospect
          const updatedProspects = prospects.map((p) =>
            p.id === prospectId ? { ...p, lastInteractionAt: newInteraction.createdAt } : p
          );

          const prospect = prospects.find((p) => p.id === prospectId);
          if (prospect) {
            const stageProspects = prospectsByStage.get(prospect.stageId) || [];
            prospectsByStage.set(
              prospect.stageId,
              stageProspects.map((p) => (p.id === prospectId ? { ...p, lastInteractionAt: newInteraction.createdAt } : p))
            );
          }

          set({
            prospects: updatedProspects,
            prospectsByStage: new Map(prospectsByStage),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao criar interacao',
            isLoading: false,
          });
        }
      },

      // ============================================
      // METRICS ACTIONS
      // ============================================

      loadMetrics: async (userId: string) => {
        try {
          const metrics = await ProspectService.getPipelineMetrics(userId);
          set({ metrics });
        } catch (error) {
          console.error('Erro ao carregar metricas:', error);
        }
      },

      // ============================================
      // UI ACTIONS
      // ============================================

      selectProspect: (prospect: Prospect | null) => {
        set({ selectedProspect: prospect });
        if (prospect) {
          get().loadInteractions(prospect.id);
        }
      },

      selectStage: (stage: PipelineStage | null) => {
        set({ selectedStage: stage });
      },

      openProspectDialog: (mode: DialogMode, stageId?: string) => {
        set({
          dialogMode: mode,
          isProspectDialogOpen: true,
          defaultStageId: stageId || null,
        });
      },

      closeProspectDialog: () => {
        set({
          isProspectDialogOpen: false,
          defaultStageId: null,
        });
      },

      openStageDialog: (mode: DialogMode) => {
        set({
          stageDialogMode: mode,
          isStageDialogOpen: true,
        });
      },

      closeStageDialog: () => {
        set({ isStageDialogOpen: false });
      },

      openInteractionDialog: () => {
        set({ isInteractionDialogOpen: true });
      },

      closeInteractionDialog: () => {
        set({ isInteractionDialogOpen: false });
      },

      openDetailPanel: (prospect: Prospect) => {
        set({
          selectedProspect: prospect,
          isDetailPanelOpen: true,
        });
        get().loadInteractions(prospect.id);
      },

      closeDetailPanel: () => {
        set({
          isDetailPanelOpen: false,
          selectedProspect: null,
          interactions: [],
        });
      },

      setFilters: (filters: ProspectFilters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setDragging: (isDragging: boolean, prospectId?: string) => {
        set({
          isDragging,
          activeProspectId: prospectId || null,
        });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      // ============================================
      // HELPERS
      // ============================================

      getProspectsByStageId: (stageId: string) => {
        const { prospectsByStage } = get();
        return prospectsByStage.get(stageId) || [];
      },

      refreshData: async (userId: string) => {
        const { filters } = get();
        await Promise.all([
          get().loadStagesWithMetrics(userId),
          get().loadProspects(userId, filters),
          get().loadMetrics(userId),
        ]);
      },
    }),
    { name: 'prospects-store' }
  )
);

// Selectors
export const useStages = () => useProspectsStore((state) => state.stages);
export const useProspects = () => useProspectsStore((state) => state.prospects);
export const useProspectsByStage = () => useProspectsStore((state) => state.prospectsByStage);
export const useSelectedProspect = () => useProspectsStore((state) => state.selectedProspect);
export const usePipelineMetrics = () => useProspectsStore((state) => state.metrics);
export const useProspectFilters = () => useProspectsStore((state) => state.filters);
export const useProspectInteractions = () => useProspectsStore((state) => state.interactions);
