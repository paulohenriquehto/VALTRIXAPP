import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Linkedin,
  FileText,
  RefreshCw,
  StickyNote,
  ArrowRight,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import type { ProspectInteraction, InteractionType } from '@/types/prospects';
import { InteractionTypeLabels, InteractionTypeColors } from '@/types/prospects';

const InteractionIcons: Record<InteractionType, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  proposal_sent: <FileText className="h-4 w-4" />,
  follow_up: <RefreshCw className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  stage_change: <ArrowRight className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

interface InteractionTimelineProps {
  interactions: ProspectInteraction[];
  isLoading?: boolean;
}

export function InteractionTimeline({ interactions, isLoading }: InteractionTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma interacao registrada</p>
        <p className="text-xs">Registre ligacoes, emails e reunioes aqui.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Interactions */}
        <div className="space-y-4">
          {interactions.map((interaction, index) => (
            <div key={interaction.id} className="relative flex gap-3 pl-2">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 ${InteractionTypeColors[interaction.type]}`}
              >
                {InteractionIcons[interaction.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{interaction.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {InteractionTypeLabels[interaction.type]}
                      </Badge>
                      {interaction.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {interaction.durationMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(interaction.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                  </time>
                </div>

                {/* Description */}
                {interaction.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {interaction.description}
                  </p>
                )}

                {/* Stage change info */}
                {interaction.type === 'stage_change' && interaction.fromStage && interaction.toStage && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      style={{ borderColor: interaction.fromStage.color, color: interaction.fromStage.color }}
                    >
                      {interaction.fromStage.name}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      style={{ borderColor: interaction.toStage.color, color: interaction.toStage.color }}
                    >
                      {interaction.toStage.name}
                    </Badge>
                  </div>
                )}

                {/* User */}
                {interaction.user && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Por {interaction.user.fullName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
