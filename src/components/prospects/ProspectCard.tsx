import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  UserPlus,
  X,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';
import type { Prospect } from '@/types/prospects';
import {
  PriorityLabels,
  PriorityColors,
  formatCurrency,
  getDaysInStage,
} from '@/types/prospects';

interface ProspectCardProps {
  prospect: Prospect;
  isDragging?: boolean;
  onEdit?: (prospect: Prospect) => void;
  onDelete?: (prospect: Prospect) => void;
  onClick?: (prospect: Prospect) => void;
  onMarkWon?: (prospect: Prospect) => void;
  onMarkLost?: (prospect: Prospect) => void;
  onConvert?: (prospect: Prospect) => void;
}

export function ProspectCard({
  prospect,
  isDragging,
  onEdit,
  onDelete,
  onClick,
  onMarkWon,
  onMarkLost,
  onConvert,
}: ProspectCardProps) {
  const daysInStage = getDaysInStage(prospect.enteredStageAt);

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
      onClick={() => onClick?.(prospect)}
    >
      {/* Header with name and menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{prospect.name}</h4>
          {prospect.companyName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{prospect.companyName}</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(prospect); }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onMarkWon && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkWon(prospect); }}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Marcar como Ganho
              </DropdownMenuItem>
            )}
            {onMarkLost && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkLost(prospect); }}>
                <X className="h-4 w-4 mr-2 text-red-600" />
                Marcar como Perdido
              </DropdownMenuItem>
            )}
            {onConvert && prospect.status === 'won' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConvert(prospect); }}>
                <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                Converter em Cliente
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(prospect); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      {prospect.expectedValue > 0 && (
        <div className="text-lg font-bold text-primary mb-2">
          {formatCurrency(prospect.expectedValue)}
        </div>
      )}

      {/* Priority badge */}
      <div className="flex items-center gap-2 mb-2">
        <Badge className={cn('text-[10px] px-1.5 py-0', PriorityColors[prospect.priority])}>
          {PriorityLabels[prospect.priority]}
        </Badge>
        {prospect.expectedCloseDate && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Calendar className="h-2.5 w-2.5 mr-1" />
            {new Date(prospect.expectedCloseDate).toLocaleDateString('pt-BR')}
          </Badge>
        )}
      </div>

      {/* Tags */}
      {prospect.tags && prospect.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prospect.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {prospect.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +{prospect.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Contact info and days in stage */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {prospect.email && (
            <span className="flex items-center gap-0.5">
              <Mail className="h-3 w-3" />
            </span>
          )}
          {prospect.phone && (
            <span className="flex items-center gap-0.5">
              <Phone className="h-3 w-3" />
            </span>
          )}
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {daysInStage}d
        </span>
      </div>
    </div>
  );
}

// Sortable wrapper for drag-and-drop
export function SortableProspectCard(props: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="pl-1 group-hover:pl-5 transition-all">
          <ProspectCard {...props} isDragging={isDragging} />
        </div>
      </div>
    </div>
  );
}
