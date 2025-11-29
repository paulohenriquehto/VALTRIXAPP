import { useEffect, useState } from 'react';
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
import { Loader2, User, Building2, Mail, Phone, DollarSign, Calendar, Tag } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { useAuth } from '@/stores/appStore';
import type { ProspectInput, ProspectPriority } from '@/types/prospects';
import { PriorityLabels, CommonSources } from '@/types/prospects';

export function ProspectDialog() {
  const { user } = useAuth();
  const {
    stages,
    selectedProspect,
    isProspectDialogOpen,
    dialogMode,
    defaultStageId,
    isLoading,
    closeProspectDialog,
    createProspect,
    updateProspect,
  } = useProspectsStore();

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expectedValue, setExpectedValue] = useState(0);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [priority, setPriority] = useState<ProspectPriority>('medium');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [stageId, setStageId] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (isProspectDialogOpen) {
      if (dialogMode === 'edit' && selectedProspect) {
        setName(selectedProspect.name);
        setCompanyName(selectedProspect.companyName || '');
        setEmail(selectedProspect.email || '');
        setPhone(selectedProspect.phone || '');
        setExpectedValue(selectedProspect.expectedValue || 0);
        setExpectedCloseDate(selectedProspect.expectedCloseDate || '');
        setPriority(selectedProspect.priority);
        setSource(selectedProspect.source || '');
        setNotes(selectedProspect.notes || '');
        setStageId(selectedProspect.stageId);
      } else {
        // Create mode
        setName('');
        setCompanyName('');
        setEmail('');
        setPhone('');
        setExpectedValue(0);
        setExpectedCloseDate('');
        setPriority('medium');
        setSource('');
        setNotes('');
        setStageId(defaultStageId || stages[0]?.id || '');
      }
    }
  }, [isProspectDialogOpen, dialogMode, selectedProspect, defaultStageId, stages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !name.trim()) return;

    const input: ProspectInput = {
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      expectedValue: expectedValue || undefined,
      expectedCloseDate: expectedCloseDate || undefined,
      priority,
      source: source || undefined,
      notes: notes.trim() || undefined,
    };

    if (dialogMode === 'edit' && selectedProspect) {
      await updateProspect(selectedProspect.id, input);
    } else {
      await createProspect(user.id, stageId, input);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={isProspectDialogOpen} onOpenChange={closeProspectDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit' ? 'Editar Prospect' : 'Novo Prospect'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? 'Atualize as informacoes do prospect.'
                : 'Adicione um novo prospect ao pipeline.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Stage selector (only for create) */}
            {dialogMode === 'create' && (
              <div className="space-y-2">
                <Label>Estagio</Label>
                <Select value={stageId} onValueChange={setStageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estagio" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="h-4 w-4 inline mr-1" />
                Nome *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do contato"
                required
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">
                <Building2 className="h-4 w-4 inline mr-1" />
                Empresa
              </Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            {/* Email and Phone row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Value and Close Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Valor Esperado
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="value"
                    type="number"
                    value={expectedValue || ''}
                    onChange={(e) => setExpectedValue(Number(e.target.value))}
                    className="pl-10"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeDate">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Previsao de Fechamento
                </Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                />
              </div>
            </div>

            {/* Priority and Source row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ProspectPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PriorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Origem
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CommonSources.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informacoes adicionais sobre o prospect..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeProspectDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === 'edit' ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
