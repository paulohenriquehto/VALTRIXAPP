import { useCallback, useEffect, useState } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import { ProspectColumn } from './ProspectColumn';
import { ProspectCard } from './ProspectCard';
import type { Prospect, DragEndResult } from '@/types/prospects';

export function ProspectBoard() {
  const { user } = useAuth();
  const {
    stages,
    prospects,
    prospectsByStage,
    isLoading,
    loadStagesWithMetrics,
    loadProspects,
    moveProspect,
    openProspectDialog,
    openStageDialog,
    openDetailPanel,
    deleteProspect,
    markAsWon,
    markAsLost,
    convertToClient,
    selectProspect,
    selectStage,
  } = useProspectsStore();

  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement needed to start drag
      },
    })
  );

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadStagesWithMetrics(user.id);
      loadProspects(user.id);
    }
  }, [user?.id, loadStagesWithMetrics, loadProspects]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const prospect = prospects.find((p) => p.id === active.id);
    if (prospect) {
      setActiveProspect(prospect);
    }
  }, [prospects]);

  // Handle drag over (for real-time feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Could add visual feedback here
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveProspect(null);

      if (!over || !user?.id) return;

      const prospectId = active.id as string;
      const prospect = prospects.find((p) => p.id === prospectId);
      if (!prospect) return;

      // Determine target stage
      let targetStageId: string;
      let targetIndex: number;

      // Check if dropped on a stage (column)
      const targetStage = stages.find((s) => s.id === over.id);
      if (targetStage) {
        targetStageId = targetStage.id;
        const stageProspects = prospectsByStage.get(targetStageId) || [];
        targetIndex = stageProspects.length; // Add to end
      } else {
        // Dropped on another prospect
        const targetProspect = prospects.find((p) => p.id === over.id);
        if (!targetProspect) return;

        targetStageId = targetProspect.stageId;
        const stageProspects = prospectsByStage.get(targetStageId) || [];
        targetIndex = stageProspects.findIndex((p) => p.id === over.id);
        if (targetIndex === -1) targetIndex = stageProspects.length;
      }

      // Don't do anything if position hasn't changed
      if (prospect.stageId === targetStageId) {
        const sourceProspects = prospectsByStage.get(prospect.stageId) || [];
        const sourceIndex = sourceProspects.findIndex((p) => p.id === prospectId);
        if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
          return;
        }
      }

      const dragResult: DragEndResult = {
        prospectId,
        sourceStageId: prospect.stageId,
        destinationStageId: targetStageId,
        sourceIndex: prospect.positionInStage,
        destinationIndex: targetIndex,
      };

      await moveProspect(dragResult, user.id);
    },
    [prospects, stages, prospectsByStage, user?.id, moveProspect]
  );

  // Handle edit prospect
  const handleEditProspect = (prospect: Prospect) => {
    selectProspect(prospect);
    openProspectDialog('edit');
  };

  // Handle delete prospect
  const handleDeleteProspect = async (prospect: Prospect) => {
    if (confirm(`Tem certeza que deseja excluir "${prospect.name}"?`)) {
      await deleteProspect(prospect.id);
    }
  };

  // Handle click prospect (open detail panel)
  const handleClickProspect = (prospect: Prospect) => {
    openDetailPanel(prospect);
  };

  // Handle mark as won
  const handleMarkWon = async (prospect: Prospect) => {
    if (!user?.id) return;
    await markAsWon(prospect.id, user.id);
  };

  // Handle mark as lost
  const handleMarkLost = async (prospect: Prospect) => {
    if (!user?.id) return;
    const reason = prompt('Motivo da perda (opcional):');
    await markAsLost(prospect.id, user.id, reason || undefined);
  };

  // Handle convert to client
  const handleConvert = async (prospect: Prospect) => {
    if (!user?.id) return;
    if (confirm(`Converter "${prospect.name}" em cliente?`)) {
      const clientId = await convertToClient(prospect.id, user.id);
      alert(`Cliente criado com sucesso! ID: ${clientId}`);
    }
  };

  // Handle edit stage
  const handleEditStage = (stage: any) => {
    selectStage(stage);
    openStageDialog('edit');
  };

  // Handle delete stage
  const handleDeleteStage = async (stage: any) => {
    const stageProspects = prospectsByStage.get(stage.id) || [];
    if (stageProspects.length > 0) {
      alert('Nao e possivel excluir uma coluna que possui prospects. Mova os prospects primeiro.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a coluna "${stage.name}"?`)) {
      await useProspectsStore.getState().deleteStage(stage.id);
    }
  };

  // Handle add stage
  const handleAddStage = () => {
    selectStage(null);
    openStageDialog('create');
  };

  // Loading state
  if (isLoading && stages.length === 0) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-80 flex-shrink-0">
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-32 w-full mb-2" />
            <Skeleton className="h-32 w-full mb-2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto h-full">
        {/* Stage columns */}
        {stages.map((stage) => (
          <ProspectColumn
            key={stage.id}
            stage={stage}
            prospects={prospectsByStage.get(stage.id) || []}
            onAddProspect={(stageId) => openProspectDialog('create', stageId)}
            onEditStage={handleEditStage}
            onDeleteStage={handleDeleteStage}
            onEditProspect={handleEditProspect}
            onDeleteProspect={handleDeleteProspect}
            onClickProspect={handleClickProspect}
            onMarkWon={handleMarkWon}
            onMarkLost={handleMarkLost}
            onConvert={handleConvert}
          />
        ))}

        {/* Add column button */}
        <div className="w-80 flex-shrink-0">
          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={handleAddStage}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Coluna
          </Button>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeProspect ? (
          <div className="opacity-80">
            <ProspectCard prospect={activeProspect} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
