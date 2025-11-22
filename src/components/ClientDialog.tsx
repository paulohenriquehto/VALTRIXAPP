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
import type { Client, ClientSegment, ClientStatus, PaymentMethod, PaymentStatus } from '../types';

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
    segment: 'technology' as ClientSegment,
    contactPerson: '',
    email: '',
    phone: '',
    monthlyValue: '',
    contractStartDate: '',
    paymentDueDay: '1',
    paymentMethod: 'pix' as PaymentMethod,
    paymentStatus: 'pending' as PaymentStatus,
    status: 'active' as ClientStatus,
    notes: '',
  });

  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        companyName: client.companyName,
        segment: client.segment,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone || '',
        monthlyValue: client.monthlyValue.toString(),
        contractStartDate: client.contractStartDate
          ? new Date(client.contractStartDate).toISOString().split('T')[0]
          : '',
        paymentDueDay: client.paymentDueDay.toString(),
        paymentMethod: client.paymentMethod,
        paymentStatus: client.paymentStatus,
        status: client.status,
        notes: client.notes || '',
      });
    } else if (mode === 'create') {
      setFormData({
        companyName: '',
        segment: 'technology',
        contactPerson: '',
        email: '',
        phone: '',
        monthlyValue: '',
        contractStartDate: '',
        paymentDueDay: '1',
        paymentMethod: 'pix',
        paymentStatus: 'pending',
        status: 'active',
        notes: '',
      });
    }
  }, [mode, client, open]);

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
      monthlyValue: parseFloat(formData.monthlyValue),
      contractStartDate: formData.contractStartDate
        ? new Date(formData.contractStartDate).toISOString()
        : new Date().toISOString(),
      paymentDueDay: parseInt(formData.paymentDueDay),
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    if (mode === 'edit' && client) {
      clientData.id = client.id;
    }

    onSave(clientData);
    onClose();
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="financial">Informações Financeiras</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="segment">Segmento *</Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value) =>
                      setFormData({ ...formData, segment: value as ClientSegment })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Tecnologia</SelectItem>
                      <SelectItem value="healthcare">Saúde</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="finance">Finanças</SelectItem>
                      <SelectItem value="retail">Varejo</SelectItem>
                      <SelectItem value="manufacturing">Manufatura</SelectItem>
                      <SelectItem value="services">Serviços</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contato Principal *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Observações</Label>
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

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyValue">Valor Mensal (MRR) *</Label>
                  <Input
                    id="monthlyValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyValue}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyValue: e.target.value })
                    }
                    placeholder="1500.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">Data de Início do Contrato *</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) =>
                      setFormData({ ...formData, contractStartDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDueDay">Dia de Vencimento (1-31) *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Status do Pagamento</Label>
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status do Cliente</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
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
