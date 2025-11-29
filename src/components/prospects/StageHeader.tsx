import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit2, Trash2, Palette } from 'lucide-react';
import type { PipelineStage } from '@/types/prospects';
import { formatCompactCurrency } from '@/types/prospects';

interface StageHeaderProps {
  stage: PipelineStage;
  onEdit?: (stage: PipelineStage) => void;
  onDelete?: (stage: PipelineStage) => void;
}

export function StageHeader({ stage, onEdit, onDelete }: StageHeaderProps) {
  const canDelete = !stage.isDefault && !stage.isWinStage && !stage.isLossStage;

  return (
    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
      <div className="flex items-center gap-2 min-w-0">
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.color }}
        />

        {/* Stage name */}
        <h3 className="font-semibold text-sm truncate">{stage.name}</h3>

        {/* Count badge */}
        {stage.prospectCount !== undefined && stage.prospectCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {stage.prospectCount}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Total value */}
        {stage.totalValue !== undefined && stage.totalValue > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {formatCompactCurrency(stage.totalValue)}
          </span>
        )}

        {/* Probability */}
        {stage.probability > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {stage.probability}%
          </Badge>
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(stage)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Coluna
              </DropdownMenuItem>
            )}
            {onDelete && canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(stage)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Coluna
                </DropdownMenuItem>
              </>
            )}
            {!canDelete && (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {stage.isDefault && 'Coluna padrao nao pode ser excluida'}
                {stage.isWinStage && 'Coluna de ganho nao pode ser excluida'}
                {stage.isLossStage && 'Coluna de perda nao pode ser excluida'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
