import React, { useState } from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Target,
  Flame,
} from 'lucide-react';

interface CheckinModalProps {
  open: boolean;
  onClose: () => void;
  type: 'manual' | 'automatic' | 'chat';
}

export const CheckinModal: React.FC<CheckinModalProps> = ({ open, onClose, type }) => {
  const { user } = useAuth();
  const { updateActivity, todayActivity, streaks, loadAll } = useSalesStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contacts_sent: 0,
    calls_made: 0,
    meetings_held: 0,
    proposals_sent: 0,
    deals_closed: 0,
    revenue_generated: 0,
    notes: '',
  });

  const totalSteps = 3;
  const progressPercent = (step / totalSteps) * 100;

  const prospectingStreak = streaks.find(s => s.streak_type === 'daily_prospecting');
  const currentStreak = prospectingStreak?.current_count || 0;

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateActivity(user.id, {
        contacts_sent: (todayActivity?.contacts_sent || 0) + formData.contacts_sent,
        calls_made: (todayActivity?.calls_made || 0) + formData.calls_made,
        meetings_held: (todayActivity?.meetings_held || 0) + formData.meetings_held,
        proposals_sent: (todayActivity?.proposals_sent || 0) + formData.proposals_sent,
        deals_closed: (todayActivity?.deals_closed || 0) + formData.deals_closed,
        revenue_generated: (todayActivity?.revenue_generated || 0) + formData.revenue_generated,
        notes: formData.notes || undefined,
      });

      // Reload data
      await loadAll(user.id);

      // Go to success step
      setStep(totalSteps + 1);
    } catch (error) {
      console.error('Error saving check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      contacts_sent: 0,
      calls_made: 0,
      meetings_held: 0,
      proposals_sent: 0,
      deals_closed: 0,
      revenue_generated: 0,
      notes: '',
    });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Atividades de Prospeccao</h3>
              <p className="text-sm text-muted-foreground">
                Quantas atividades voce realizou hoje?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Contatos Enviados
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.contacts_sent}
                  onChange={(e) => setFormData({ ...formData, contacts_sent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  Ligacoes
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.calls_made}
                  onChange={(e) => setFormData({ ...formData, calls_made: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Reunioes
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.meetings_held}
                  onChange={(e) => setFormData({ ...formData, meetings_held: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Propostas
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.proposals_sent}
                  onChange={(e) => setFormData({ ...formData, proposals_sent: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Resultados</h3>
              <p className="text-sm text-muted-foreground">
                Fechou algum negocio hoje?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Negocios Fechados</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.deals_closed}
                  onChange={(e) => setFormData({ ...formData, deals_closed: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Receita Gerada (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.revenue_generated}
                  onChange={(e) => setFormData({ ...formData, revenue_generated: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="p-3 bg-purple-500/10 rounded-full w-fit mx-auto mb-3">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">Observacoes</h3>
              <p className="text-sm text-muted-foreground">
                Algo importante que aconteceu hoje?
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Ex: Fechei cliente novo de automacao, muito feliz..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Resumo do Check-in:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Contatos:</span>{' '}
                  <span className="font-medium">{formData.contacts_sent}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ligacoes:</span>{' '}
                  <span className="font-medium">{formData.calls_made}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reunioes:</span>{' '}
                  <span className="font-medium">{formData.meetings_held}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Propostas:</span>{' '}
                  <span className="font-medium">{formData.proposals_sent}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fechados:</span>{' '}
                  <span className="font-medium">{formData.deals_closed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Receita:</span>{' '}
                  <span className="font-medium">R$ {formData.revenue_generated.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // Success step
      default:
        return (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 bg-green-500/10 rounded-full w-fit mx-auto">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Check-in Completo!</h3>

            {currentStreak > 0 && (
              <div className="flex items-center justify-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-lg">
                  Streak de <span className="font-bold text-orange-500">{currentStreak}</span> dias!
                </span>
              </div>
            )}

            <p className="text-muted-foreground">
              Suas atividades foram registradas com sucesso.
              Continue assim!
            </p>

            <Button onClick={handleClose} className="mt-4">
              Fechar
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step <= totalSteps && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {type === 'automatic' ? 'Check-in Diario' : 'Registrar Atividades'}
                </DialogTitle>
                <Badge variant="outline">
                  Passo {step}/{totalSteps}
                </Badge>
              </div>
              <Progress value={progressPercent} className="h-1" />
            </DialogHeader>
          </>
        )}

        {renderStep()}

        {step <= totalSteps && (
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            )}

            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)} className="gap-2">
                Proximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Finalizar'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
