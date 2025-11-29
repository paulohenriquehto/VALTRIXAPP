import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Linkedin,
  FileText,
  RefreshCw,
  StickyNote,
  Clock,
} from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import type { InteractionType, InteractionInput } from '@/types/prospects';
import { InteractionTypeLabels } from '@/types/prospects';

const InteractionIcons: Record<InteractionType, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  proposal_sent: <FileText className="h-4 w-4" />,
  follow_up: <RefreshCw className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  stage_change: <RefreshCw className="h-4 w-4" />,
  other: <StickyNote className="h-4 w-4" />,
};

export function InteractionDialog() {
  const { user } = useAuth();
  const {
    selectedProspect,
    isInteractionDialogOpen,
    isLoading,
    closeInteractionDialog,
    createInteraction,
  } = useProspectsStore();

  // Form state
  const [type, setType] = useState<InteractionType>('call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedProspect || !title.trim()) return;

    const input: InteractionInput = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes: durationMinutes || undefined,
    };

    await createInteraction(selectedProspect.id, user.id, input);

    // Reset form
    setType('call');
    setTitle('');
    setDescription('');
    setDurationMinutes(undefined);
  };

  const isValid = title.trim().length > 0;

  // Generate suggested title based on type
  const getSuggestedTitle = (interactionType: InteractionType) => {
    const suggestions: Record<InteractionType, string> = {
      call: 'Ligacao com ',
      email: 'Email enviado para ',
      meeting: 'Reuniao com ',
      whatsapp: 'Conversa no WhatsApp com ',
      linkedin: 'Mensagem no LinkedIn para ',
      proposal_sent: 'Proposta enviada para ',
      follow_up: 'Follow-up com ',
      note: 'Nota sobre ',
      stage_change: 'Movido para ',
      other: '',
    };
    return suggestions[interactionType] + (selectedProspect?.name || '');
  };

  const handleTypeChange = (newType: InteractionType) => {
    setType(newType);
    if (!title || title === getSuggestedTitle(type)) {
      setTitle(getSuggestedTitle(newType));
    }
  };

  return (
    <Dialog open={isInteractionDialogOpen} onOpenChange={closeInteractionDialog}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Interacao</DialogTitle>
            <DialogDescription>
              Registre uma interacao com {selectedProspect?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo de Interacao</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as InteractionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(InteractionTypeLabels)
                    .filter(([key]) => key !== 'stage_change')
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {InteractionIcons[key as InteractionType]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="interactionTitle">Titulo *</Label>
              <Input
                id="interactionTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Descreva a interacao"
                required
              />
            </div>

            {/* Duration (for calls and meetings) */}
            {(type === 'call' || type === 'meeting') && (
              <div className="space-y-2">
                <Label htmlFor="duration">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Duracao (minutos)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes || ''}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || undefined)}
                  placeholder="Ex: 30"
                  min={1}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="interactionDescription">Descricao</Label>
              <Textarea
                id="interactionDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre a interacao..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeInteractionDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
