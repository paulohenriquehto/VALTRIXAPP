import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineStage, Prospect } from '@/types/prospects';
import { StageHeader } from './StageHeader';
import { SortableProspectCard } from './ProspectCard';

interface ProspectColumnProps {
  stage: PipelineStage;
  prospects: Prospect[];
  onAddProspect?: (stageId: string) => void;
  onEditStage?: (stage: PipelineStage) => void;
  onDeleteStage?: (stage: PipelineStage) => void;
  onEditProspect?: (prospect: Prospect) => void;
  onDeleteProspect?: (prospect: Prospect) => void;
  onClickProspect?: (prospect: Prospect) => void;
  onMarkWon?: (prospect: Prospect) => void;
  onMarkLost?: (prospect: Prospect) => void;
  onConvert?: (prospect: Prospect) => void;
}

export function ProspectColumn({
  stage,
  prospects,
  onAddProspect,
  onEditStage,
  onDeleteStage,
  onEditProspect,
  onDeleteProspect,
  onClickProspect,
  onMarkWon,
  onMarkLost,
  onConvert,
}: ProspectColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      className={cn(
        'w-80 flex-shrink-0 flex flex-col bg-muted/20 rounded-lg border',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header */}
      <StageHeader
        stage={stage}
        onEdit={onEditStage}
        onDelete={onDeleteStage}
      />

      {/* Cards container */}
      <div ref={setNodeRef} className="flex-1 min-h-0">
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2 space-y-2">
              {prospects.map((prospect) => (
                <SortableProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onEdit={onEditProspect}
                  onDelete={onDeleteProspect}
                  onClick={onClickProspect}
                  onMarkWon={onMarkWon}
                  onMarkLost={onMarkLost}
                  onConvert={onConvert}
                />
              ))}

              {/* Empty state */}
              {prospects.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum prospect neste estagio
                </div>
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </div>

      {/* Add button */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => onAddProspect?.(stage.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Prospect
        </Button>
      </div>
    </div>
  );
}
