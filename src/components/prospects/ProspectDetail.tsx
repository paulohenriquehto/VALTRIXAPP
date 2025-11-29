import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  UserPlus,
  MessageSquarePlus,
  Tag,
  FileText,
} from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import { InteractionTimeline } from './InteractionTimeline';
import type { Prospect } from '@/types/prospects';
import {
  formatCurrency,
  PriorityLabels,
  PriorityColors,
  StatusLabels,
  StatusColors,
  getDaysInStage,
} from '@/types/prospects';

export function ProspectDetail() {
  const { user } = useAuth();
  const {
    selectedProspect,
    interactions,
    stages,
    isDetailPanelOpen,
    isLoadingInteractions,
    closeDetailPanel,
    openProspectDialog,
    openInteractionDialog,
    deleteProspect,
    markAsWon,
    markAsLost,
    convertToClient,
    selectProspect,
  } = useProspectsStore();

  if (!selectedProspect) return null;

  const stage = stages.find((s) => s.id === selectedProspect.stageId);
  const daysInStage = getDaysInStage(selectedProspect.enteredStageAt);

  const handleEdit = () => {
    selectProspect(selectedProspect);
    openProspectDialog('edit');
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir "${selectedProspect.name}"?`)) {
      await deleteProspect(selectedProspect.id);
    }
  };

  const handleMarkWon = async () => {
    if (!user?.id) return;
    await markAsWon(selectedProspect.id, user.id);
  };

  const handleMarkLost = async () => {
    if (!user?.id) return;
    const reason = prompt('Motivo da perda (opcional):');
    await markAsLost(selectedProspect.id, user.id, reason || undefined);
  };

  const handleConvert = async () => {
    if (!user?.id) return;
    if (confirm(`Converter "${selectedProspect.name}" em cliente?`)) {
      const clientId = await convertToClient(selectedProspect.id, user.id);
      alert(`Cliente criado com sucesso!`);
    }
  };

  return (
    <Sheet open={isDetailPanelOpen} onOpenChange={closeDetailPanel}>
      <SheetContent className="w-[450px] sm:max-w-[450px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">{selectedProspect.name}</SheetTitle>
              {selectedProspect.companyName && (
                <SheetDescription className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedProspect.companyName}
                </SheetDescription>
              )}
            </div>
            <Badge className={StatusColors[selectedProspect.status]}>
              {StatusLabels[selectedProspect.status]}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={openInteractionDialog}>
              <MessageSquarePlus className="h-4 w-4 mr-1" />
              Interacao
            </Button>
            {selectedProspect.status === 'open' && (
              <>
                <Button size="sm" variant="outline" className="text-green-600" onClick={handleMarkWon}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Ganho
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={handleMarkLost}>
                  <X className="h-4 w-4 mr-1" />
                  Perdido
                </Button>
              </>
            )}
            {selectedProspect.status === 'won' && !selectedProspect.convertedClientId && (
              <Button size="sm" variant="default" onClick={handleConvert}>
                <UserPlus className="h-4 w-4 mr-1" />
                Converter
              </Button>
            )}
          </div>

          {/* Stage & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estagio</p>
              <div className="flex items-center gap-2">
                {stage && (
                  <>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-sm">{stage.name}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysInStage} dias neste estagio
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valor Esperado</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(selectedProspect.expectedValue || 0)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contato</h4>
            <div className="space-y-2 text-sm">
              {selectedProspect.email && (
                <a
                  href={`mailto:${selectedProspect.email}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedProspect.email}
                </a>
              )}
              {selectedProspect.phone && (
                <a
                  href={`tel:${selectedProspect.phone}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedProspect.phone}
                </a>
              )}
              {selectedProspect.expectedCloseDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Previsao: {format(new Date(selectedProspect.expectedCloseDate), "dd 'de' MMMM", { locale: ptBR })}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Prioridade</p>
              <Badge className={PriorityColors[selectedProspect.priority]}>
                {PriorityLabels[selectedProspect.priority]}
              </Badge>
            </div>
            {selectedProspect.source && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Origem</p>
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{selectedProspect.source}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {selectedProspect.tags && selectedProspect.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {selectedProspect.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedProspect.notes && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {selectedProspect.notes}
              </div>
            </div>
          )}

          <Separator />

          {/* Interactions Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Historico de Interacoes</h4>
              <Button size="sm" variant="ghost" onClick={openInteractionDialog}>
                <MessageSquarePlus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>
            <InteractionTimeline
              interactions={interactions}
              isLoading={isLoadingInteractions}
            />
          </div>

          {/* Dates */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>Criado em: {format(new Date(selectedProspect.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            {selectedProspect.lastInteractionAt && (
              <p>
                Ultima interacao: {format(new Date(selectedProspect.lastInteractionAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            {selectedProspect.convertedAt && (
              <p className="text-green-600">
                Convertido em: {format(new Date(selectedProspect.convertedAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Prospect
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
