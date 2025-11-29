import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Zap, DollarSign, Building2, TrendingUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Client, ClientType, ClientSegment, ClientStatus, PaymentMethod, PaymentStatus } from '../types';
import PaymentManager from './PaymentManager';
import { TemplateService, type ClientOnboardingStatus } from '../services/templateService';
import { Badge } from '@/components/ui/badge';

interface ClientDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
}

const ClientDialog: React.FC<ClientDialogProps> = ({
  open,
  mode,
  client,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    segment: 'web_development' as ClientSegment,
    contactPerson: '',
    email: '',
    phone: '',
    clientType: 'recurring' as ClientType,
    monthlyValue: '',
    contractStartDate: '',
    paymentDueDay: '1',
    paymentMethod: 'pix' as PaymentMethod,
    paymentStatus: 'pending' as PaymentStatus,
    status: 'active' as ClientStatus,
    acquisitionCost: '', // Custo de Aquisição de Cliente (CAC)
    notes: '',
  });

  const [onboardingStatus, setOnboardingStatus] = useState<ClientOnboardingStatus | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        companyName: client.companyName,
        segment: client.segment,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone || '',
        clientType: client.clientType || 'recurring',
        monthlyValue: client.monthlyValue.toString(),
        contractStartDate: client.contractStartDate
          ? new Date(client.contractStartDate).toISOString().split('T')[0]
          : '',
        paymentDueDay: client.paymentDueDay.toString(),
        paymentMethod: client.paymentMethod,
        paymentStatus: client.paymentStatus,
        status: client.status,
        acquisitionCost: client.acquisitionCost?.toString() || '0',
        notes: client.notes || '',
      });
    } else if (mode === 'create') {
      setFormData({
        companyName: '',
        segment: 'web_development',
        contactPerson: '',
        email: '',
        phone: '',
        clientType: 'recurring',
        monthlyValue: '',
        contractStartDate: '',
        paymentDueDay: '1',
        paymentMethod: 'pix',
        paymentStatus: 'pending',
        status: 'active',
        acquisitionCost: '0',
        notes: '',
      });
    }
  }, [mode, client, open]);

  // Buscar status de onboarding quando o dialog abrir no modo edit
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (mode === 'edit' && client?.id && open) {
        setLoadingOnboarding(true);
        try {
          const status = await TemplateService.getClientOnboardingStatus(client.id);
          setOnboardingStatus(status);
        } catch (error) {
          console.error('Erro ao buscar status de onboarding:', error);
          setOnboardingStatus(null);
        } finally {
          setLoadingOnboarding(false);
        }
      } else {
        setOnboardingStatus(null);
      }
    };

    fetchOnboardingStatus();
  }, [mode, client?.id, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim() || !formData.email.trim() || !formData.monthlyValue) {
      return;
    }

    const clientData: Partial<Client> = {
      companyName: formData.companyName,
      segment: formData.segment,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone || undefined,
      clientType: formData.clientType,
      monthlyValue: parseFloat(formData.monthlyValue),
      contractStartDate: formData.contractStartDate
        ? new Date(formData.contractStartDate).toISOString()
        : new Date().toISOString(),
      paymentDueDay: parseInt(formData.paymentDueDay),
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      status: formData.status,
      acquisitionCost: formData.acquisitionCost ? parseFloat(formData.acquisitionCost) : 0,
      notes: formData.notes || undefined,
    };

    if (mode === 'edit' && client) {
      clientData.id = client.id;
    }

    onSave(clientData);
    onClose();
  };

  // Verificar se deve mostrar abas extras
  const showOnboardingTab = mode === 'edit';
  const showPaymentsTab = mode === 'edit' && client?.clientType === 'freelance';

  // Calcular número de colunas do grid
  const getGridCols = () => {
    if (mode === 'create') return 'grid-cols-3';
    if (showPaymentsTab) return 'grid-cols-5'; // basic, financial, acquisition, onboarding, payments
    return 'grid-cols-4'; // basic, financial, acquisition, onboarding
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Adicione um novo cliente preenchendo as informações abaixo.'
              : 'Edite as informações do cliente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className={`grid w-full ${getGridCols()}`}>
              <TabsTrigger value="basic">
                <Building2 className="h-4 w-4 mr-1.5" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="financial">
                <DollarSign className="h-4 w-4 mr-1.5" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="acquisition">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                CAC / ROI
              </TabsTrigger>
              {showOnboardingTab && (
                <TabsTrigger value="onboarding">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Onboarding
                </TabsTrigger>
              )}
              {showPaymentsTab && (
                <TabsTrigger value="payments">
                  <DollarSign className="h-4 w-4 mr-1.5" />
                  Pagamentos
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6 px-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div className="col-span-2 space-y-2.5">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Ex: Tech Solutions Ltda"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="clientType" className="text-sm font-medium">
                    Tipo de Cliente *
                  </Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientType: value as ClientType })
                    }
                  >
                    <SelectTrigger id="clientType">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span>Recorrente (MRR)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="freelance">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span>Freelance</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formData.clientType === 'freelance'
                      ? 'Serviço único'
                      : 'Cobrança mensal'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="segment" className="text-sm font-medium">
                    Tipo de Serviço *
                  </Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value) =>
                      setFormData({ ...formData, segment: value as ClientSegment })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="grid grid-cols-2 gap-1">
                        <SelectItem value="web_development">Desenvolvimento Web</SelectItem>
                        <SelectItem value="software_development">Desenvolvimento de Software</SelectItem>
                        <SelectItem value="bug_fixing">Correção de Bugs</SelectItem>
                        <SelectItem value="landing_pages">Landing Pages</SelectItem>
                        <SelectItem value="microsites">Microsites</SelectItem>
                        <SelectItem value="web_design">Web Design</SelectItem>
                        <SelectItem value="ui_ux_design">UI/UX Design</SelectItem>
                        <SelectItem value="chatbot">Chatbot</SelectItem>
                        <SelectItem value="website_automation">Automação de Sites</SelectItem>
                        <SelectItem value="n8n_automation">Automação com n8n</SelectItem>
                        <SelectItem value="defy_automation">Automação com DeFy</SelectItem>
                        <SelectItem value="agno_automation">Automação com agno</SelectItem>
                        <SelectItem value="langchain_automation">Automação com LangChain</SelectItem>
                        <SelectItem value="traffic_management">Gestão de Tráfego</SelectItem>
                        <SelectItem value="seo">SEO</SelectItem>
                        <SelectItem value="consulting">Consultoria</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="contactPerson" className="text-sm font-medium">
                    Contato Principal *
                  </Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    placeholder="Nome do contato"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contato@empresa.com"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="col-span-2 space-y-2.5">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informações adicionais sobre o cliente"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6 mt-6 px-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="monthlyValue" className="text-sm font-medium">
                    {formData.clientType === 'freelance'
                      ? 'Valor Total do Projeto *'
                      : 'Valor Mensal (MRR) *'}
                  </Label>
                  <Input
                    id="monthlyValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyValue}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyValue: e.target.value })
                    }
                    placeholder={formData.clientType === 'freelance' ? '5000.00' : '1500.00'}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formData.clientType === 'freelance'
                      ? 'Valor total do projeto/serviço'
                      : 'Receita mensal recorrente (MRR)'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="contractStartDate" className="text-sm font-medium">
                    Data de Início do Contrato *
                  </Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) =>
                      setFormData({ ...formData, contractStartDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="paymentDueDay" className="text-sm font-medium">
                    Dia de Vencimento (1-31) *
                  </Label>
                  <Input
                    id="paymentDueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.paymentDueDay}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDueDay: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="paymentMethod" className="text-sm font-medium">
                    Método de Pagamento
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value as PaymentMethod })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="paymentStatus" className="text-sm font-medium">
                    Status do Pagamento
                  </Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentStatus: value as PaymentStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status do Cliente
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as ClientStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="churned">Cancelado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.clientType === 'freelance' && formData.status === 'completed' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">
                      Projeto freelance finalizado com sucesso
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Aba de Custos de Aquisição - Nova aba para CAC */}
            <TabsContent value="acquisition" className="space-y-6 mt-6 px-1">
              <div className="grid grid-cols-1 gap-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="acquisitionCost" className="text-sm font-medium">
                    Custo Total de Aquisição (R$)
                  </Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.acquisitionCost}
                    onChange={(e) =>
                      setFormData({ ...formData, acquisitionCost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Valor gasto para adquirir este cliente. Deixe em R$ 0 se foi orgânico.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-semibold">O que incluir no Custo de Aquisição?</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Tráfego Pago:</strong> Anúncios no Google, Facebook, Instagram, etc.</li>
                    <li>• <strong>Comissão de Indicação:</strong> Valor pago a quem indicou o cliente</li>
                    <li>• <strong>Ferramentas:</strong> Custos de softwares usados na prospecção</li>
                    <li>• <strong>Marketing:</strong> Materiais promocionais, eventos, networking</li>
                    <li>• <strong>Outros:</strong> Qualquer custo direto relacionado à aquisição</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    <strong>💡 Dica:</strong> O ROI será calculado automaticamente como:
                    <code className="ml-1 px-1 bg-background rounded">((Receita - CAC) / CAC) × 100%</code>
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Onboarding - Apenas no modo edit */}
            {mode === 'edit' && (
              <TabsContent value="onboarding" className="space-y-6 mt-6 px-1">
                {loadingOnboarding ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <Clock className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Carregando progresso do onboarding...</p>
                    </div>
                  </div>
                ) : onboardingStatus ? (
                  <div className="space-y-6">
                    {/* Header com Progresso */}
                    <div className="bg-muted/30 rounded-lg p-6 border border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Progresso do Onboarding</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Acompanhe o progresso de integração do cliente
                          </p>
                        </div>
                        <Badge variant={
                          onboardingStatus.status === 'completed' ? 'default' :
                          onboardingStatus.status === 'in_progress' ? 'secondary' :
                          onboardingStatus.status === 'paused' ? 'outline' :
                          'destructive'
                        }>
                          {onboardingStatus.status === 'completed' ? '✅ Concluído' :
                           onboardingStatus.status === 'in_progress' ? '🔄 Em Andamento' :
                           onboardingStatus.status === 'paused' ? '⏸️ Pausado' :
                           '📋 Não Iniciado'}
                        </Badge>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Conclusão</span>
                          <span className="text-muted-foreground">{onboardingStatus.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-secondary/30 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${onboardingStatus.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Circle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold">{onboardingStatus.totalTasks}</p>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-muted-foreground">Concluídas</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{onboardingStatus.completedTasks}</p>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-muted-foreground">Pendentes</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{onboardingStatus.pendingTasks}</p>
                      </div>
                    </div>

                    {/* Informações de Data */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                      <h4 className="font-semibold text-sm mb-3">Cronologia</h4>
                      {onboardingStatus.startedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Iniciado em:</span>
                          <span className="font-medium">
                            {new Date(onboardingStatus.startedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {onboardingStatus.completedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Concluído em:</span>
                          <span className="font-medium text-green-600">
                            {new Date(onboardingStatus.completedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {onboardingStatus.pausedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pausado em:</span>
                          <span className="font-medium text-orange-600">
                            {new Date(onboardingStatus.pausedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mensagem de ajuda */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>💡 Dica:</strong> As tarefas de onboarding foram criadas automaticamente
                        quando o cliente foi cadastrado. Acompanhe o progresso na página de Projetos e Tarefas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Circle className="h-16 w-16 text-muted-foreground/30" />
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Nenhum onboarding configurado</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Não há um template de onboarding ativo para o tipo de serviço deste cliente.
                        Configure um template na página de Templates para habilitar o onboarding automático.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Aba de Pagamentos - Apenas para clientes freelance no modo edit */}
            {mode === 'edit' && client?.clientType === 'freelance' && (
              <TabsContent value="payments" className="space-y-6 mt-6 px-1">
                <PaymentManager client={client} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
