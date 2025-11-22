import React, { useState, useMemo, useEffect } from 'react';
import { useClients, useAuth } from '../stores/appStore';
import { ClientService } from '../services';
import { Plus, Building2, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import MRRDashboard from '../components/MRRDashboard';
import ClientDialog from '../components/ClientDialog';
import type { Client } from '../types';

const Clients: React.FC = () => {
  const { clients, setClients, getMRRMetrics } = useClients();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar clientes do Supabase
  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await ClientService.getAll(user.id);
      setClients(data);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast.error(error.message || 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => getMRRMetrics(), [clients, getMRRMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPaymentDay = (day: number) => {
    return `Dia ${day}`;
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete || !user) return;
    try {
      await ClientService.delete(clientToDelete.id);
      await loadClients();
      toast.success('Cliente excluído com sucesso!');
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error(error.message || 'Erro ao excluir cliente');
    }
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setDialogMode('edit');
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleSave = async (clientData: Partial<Client>) => {
    if (!user) return;

    try {
      setIsSaving(true);
      if (dialogMode === 'create') {
        await ClientService.create(clientData, user.id);
        toast.success('Cliente criado com sucesso!');
      } else if (selectedClient) {
        await ClientService.update(selectedClient.id, clientData);
        toast.success('Cliente atualizado com sucesso!');
      }
      await loadClients();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.message || 'Erro ao salvar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Client['status']) => {
    const variants: Record<Client['status'], { label: string; className: string }> = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      trial: { label: 'Trial', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      churned: { label: 'Cancelado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: Client['paymentStatus']) => {
    const variants: Record<Client['paymentStatus'], { label: string; className: string }> = {
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      overdue: { label: 'Atrasado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getSegmentLabel = (segment: Client['segment']) => {
    const labels: Record<Client['segment'], string> = {
      technology: 'Tecnologia',
      healthcare: 'Saúde',
      education: 'Educação',
      finance: 'Finanças',
      retail: 'Varejo',
      manufacturing: 'Manufatura',
      services: 'Serviços',
      other: 'Outro',
    };
    return labels[segment];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <MRRDashboard metrics={metrics} />

      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Clientes ({clients.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado.</p>
              <Button variant="outline" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status Pag.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{client.companyName}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getSegmentLabel(client.segment)}</TableCell>
                    <TableCell>
                      <div>{client.contactPerson}</div>
                      {client.phone && (
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(client.monthlyValue)}
                    </TableCell>
                    <TableCell>{formatPaymentDay(client.paymentDueDay)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(client.paymentStatus)}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                          title="Editar cliente"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(client)}
                          title="Excluir cliente"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <ClientDialog
        open={dialogOpen}
        mode={dialogMode}
        client={selectedClient}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.companyName}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
