import React, { useState, useEffect } from 'react';
import { ClientService, calculatePaymentProgress } from '../services/clientService';
import { useClients } from '../stores/appStore';
import type { Client, Payment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Percent, Calendar, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentManagerProps {
  client: Client;
  onUpdate?: () => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ client, onUpdate }) => {
  const { updateClient } = useClients();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form state
  const [inputType, setInputType] = useState<'value' | 'percentage'>('value');
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPayments();
  }, [client.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await ClientService.getPayments(client.id);
      setPayments(data);
    } catch (error: any) {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar histórico de pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const progress = calculatePaymentProgress(client.monthlyValue, payments);

  const handleAddPayment = async () => {
    try {
      setAdding(true);

      // Calcular valor baseado no input type
      let paymentAmount = 0;
      let paymentPercentage: number | undefined = undefined;

      if (inputType === 'value') {
        paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          toast.error('Digite um valor válido');
          return;
        }
        // Calcular a porcentagem baseada no valor
        paymentPercentage = (paymentAmount / client.monthlyValue) * 100;
      } else {
        paymentPercentage = parseFloat(percentage);
        if (isNaN(paymentPercentage) || paymentPercentage <= 0 || paymentPercentage > 100) {
          toast.error('Digite uma porcentagem válida (0-100)');
          return;
        }
        // Calcular o valor baseado na porcentagem
        paymentAmount = (client.monthlyValue * paymentPercentage) / 100;
      }

      const nextInstallmentNumber = payments.length + 1;

      await ClientService.createPayment({
        clientId: client.id,
        amount: paymentAmount,
        dueDate,
        status: paymentStatus,
        method: 'pix',
        paidDate: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
        installmentNumber: nextInstallmentNumber,
        percentage: Math.round(paymentPercentage * 100) / 100, // 2 decimais
        notes: notes || undefined,
      });

      toast.success('Pagamento adicionado com sucesso!');

      // Reset form
      setAmount('');
      setPercentage('');
      setNotes('');
      setPaymentStatus('pending');

      // Recarregar pagamentos e verificar se completou 100%
      const updatedPayments = await ClientService.getPayments(client.id);
      setPayments(updatedPayments);

      // Calcular novo progresso
      const newProgress = calculatePaymentProgress(client.monthlyValue, updatedPayments);

      // Se atingiu 100%, auto-completar o cliente
      if (newProgress.paymentProgress >= 100 && client.status !== 'completed') {
        try {
          await ClientService.update(client.id, { status: 'completed' });
          updateClient(client.id, { status: 'completed' });
          toast.success('Projeto concluído! Todas as parcelas foram pagas.');
        } catch (error) {
          console.error('Erro ao atualizar status do cliente:', error);
        }
      }

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao adicionar pagamento:', error);
      toast.error('Erro ao adicionar pagamento');
    } finally {
      setAdding(false);
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      paid: { label: 'Pago', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      pending: { label: 'Pendente', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      overdue: { label: 'Atrasado', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      installment: { label: 'Parcelado', icon: Clock, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    };
    const variant = variants[status];
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Pagamento */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo do Projeto</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">{formatCurrency(client.monthlyValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Recebido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(progress.totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(progress.remainingAmount)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso de Pagamento</span>
              <span className="font-semibold">{progress.paymentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={progress.paymentProgress} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Formulário para Adicionar Pagamento */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Adicionar Novo Pagamento</h3>
        <div className="space-y-4">
          <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="value">
                <DollarSign className="h-4 w-4 mr-2" />
                Por Valor (R$)
              </TabsTrigger>
              <TabsTrigger value="percentage">
                <Percent className="h-4 w-4 mr-2" />
                Por Porcentagem (%)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="value" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Pagamento (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 500.00"
                />
              </div>
            </TabsContent>

            <TabsContent value="percentage" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentagem do Valor Total (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="Ex: 50"
                />
                {percentage && !isNaN(parseFloat(percentage)) && (
                  <p className="text-sm text-muted-foreground">
                    Equivale a {formatCurrency((client.monthlyValue * parseFloat(percentage)) / 100)}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data do Pagamento</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Status do Pagamento</Label>
              <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Primeira parcela, entrada do projeto..."
            />
          </div>

          <Button onClick={handleAddPayment} disabled={adding} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {adding ? 'Adicionando...' : 'Adicionar Pagamento'}
          </Button>
        </div>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum pagamento registrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Porcentagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.installmentNumber ? `#${payment.installmentNumber}` : '-'}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.percentage ? `${payment.percentage.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default PaymentManager;
