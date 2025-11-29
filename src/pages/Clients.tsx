import React, { useState, useMemo, useEffect } from 'react';
import { useClients, useAuth } from '../stores/appStore';
import { ClientService, calculateROI } from '../services';
import { Plus, Building2, Pencil, Trash2, RefreshCw, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveTable, type TableColumn } from '@/components/ui/responsive-table';
import { PageHeader, PageContainer } from '@/components/ui/page-header';
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
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import MRRDashboard from '../components/MRRDashboard';
import ClientDialog from '../components/ClientDialog';
import type { Client } from '../types';

const Clients: React.FC = () => {
  const { clients, setClients, setPayments, getMRRMetrics } = useClients();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'freelance'>('all');

  // Carregar clientes e pagamentos do Supabase
  useEffect(() => {
    if (user) {
      loadClientsAndPayments();
    }
  }, [user]);

  const loadClientsAndPayments = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // Carregar clientes e pagamentos em paralelo
      const [clientsData, paymentsData] = await Promise.all([
        ClientService.getAll(user.id),
        ClientService.getAllPayments(),
      ]);
      setClients(clientsData);
      setPayments(paymentsData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error(error.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Alias para manter compatibilidade
  const loadClients = loadClientsAndPayments;

  const metrics = useMemo(() => getMRRMetrics(), [clients, getMRRMetrics]);

  const filteredClients = useMemo(() => {
    if (filterType === 'all') return clients;
    return clients.filter(c => c.clientType === filterType);
  }, [clients, filterType]);

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
      installment: { label: 'Parcelado', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Badge de progresso de pagamento para clientes freelance
  const getFreelancePaymentBadge = (client: Client) => {
    if (client.clientType !== 'freelance') {
      return getPaymentStatusBadge(client.paymentStatus);
    }

    // Se está marcado como parcelado, mostra badge especial
    if (client.paymentStatus === 'installment') {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Parcelado</Badge>;
    }

    // Para freelance, usar status como proxy de progresso
    if (client.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Pago</Badge>;
    } else if (client.status === 'active') {
      if (client.paymentStatus === 'paid') {
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Parcial</Badge>;
      } else {
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Pendente</Badge>;
      }
    } else {
      return getPaymentStatusBadge(client.paymentStatus);
    }
  };

  const getSegmentLabel = (segment: Client['segment']) => {
    const labels: Record<Client['segment'], string> = {
      web_development: 'Desenvolvimento Web',
      software_development: 'Desenvolvimento de Software',
      bug_fixing: 'Correção de Bugs',
      landing_pages: 'Landing Pages',
      microsites: 'Microsites',
      web_design: 'Web Design',
      ui_ux_design: 'UI/UX Design',
      chatbot: 'Chatbot',
      website_automation: 'Automação de Sites',
      n8n_automation: 'Automação com n8n',
      defy_automation: 'Automação com DeFy',
      agno_automation: 'Automação com agno',
      langchain_automation: 'Automação com LangChain',
      traffic_management: 'Gestão de Tráfego',
      seo: 'SEO',
      consulting: 'Consultoria',
      maintenance: 'Manutenção',
      other: 'Outro',
    };
    return labels[segment];
  };

  // Badge de ROI com cores baseado no retorno
  const getROIBadge = (client: Client) => {
    const roiData = calculateROI(client);

    if (roiData.roi === null) {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Orgânico
        </Badge>
      );
    }

    const roi = roiData.roi;

    if (roi > 300) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          {roi.toFixed(0)}%
        </Badge>
      );
    }

    if (roi >= 100) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          {roi.toFixed(0)}%
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        {roi.toFixed(0)}%
      </Badge>
    );
  };

  // Definição das colunas para o ResponsiveTable
  const columns: TableColumn<Client>[] = [
    {
      accessor: 'companyName',
      header: 'Empresa',
      mobilePriority: 1,
      cell: (client) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium flex items-center gap-2 flex-wrap">
              <span className="truncate">{client.companyName}</span>
              <Badge variant={client.clientType === 'freelance' ? 'secondary' : 'default'} className="text-xs shrink-0">
                {client.clientType === 'freelance' ? 'Freelance' : 'Recorrente'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground truncate">{client.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessor: 'segment',
      header: 'Serviço',
      mobileLabel: 'Serviço',
      mobilePriority: 4,
      mobileHidden: true,
      cell: (client) => getSegmentLabel(client.segment),
    },
    {
      accessor: 'contactPerson',
      header: 'Contato',
      mobileHidden: true,
      cell: (client) => (
        <div>
          <div>{client.contactPerson}</div>
          {client.phone && (
            <div className="text-sm text-muted-foreground">{client.phone}</div>
          )}
        </div>
      ),
    },
    {
      accessor: 'monthlyValue',
      header: filterType === 'freelance' ? 'Valor Total' : filterType === 'recurring' ? 'MRR' : 'Valor',
      mobileLabel: 'Valor',
      mobilePriority: 2,
      cell: (client) => (
        <span className="font-medium">{formatCurrency(client.monthlyValue)}</span>
      ),
    },
    {
      accessor: 'paymentDueDay',
      header: 'Vencimento',
      mobileHidden: true,
      cell: (client) => formatPaymentDay(client.paymentDueDay),
    },
    {
      accessor: 'paymentStatus',
      header: 'Pagamento',
      mobileLabel: 'Pag.',
      mobilePriority: 3,
      cell: (client) => getFreelancePaymentBadge(client),
    },
    {
      accessor: 'acquisitionCost',
      header: 'ROI',
      mobileHidden: true,
      cell: (client) => getROIBadge(client),
    },
    {
      accessor: 'status',
      header: 'Status',
      mobilePriority: 4,
      cell: (client) => getStatusBadge(client.status),
    },
  ];

  // Ações do dropdown para mobile
  const renderActions = (client: Client) => (
    <>
      <DropdownMenuItem onClick={() => handleEdit(client)}>
        <Pencil className="h-4 w-4 mr-2" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleDeleteClick(client)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Excluir
      </DropdownMenuItem>
    </>
  );

  // Card template customizado para mobile
  const mobileCardTemplate = (client: Client) => (
    <div className="space-y-3">
      {/* Header com empresa e tipo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{client.companyName}</div>
            <div className="text-sm text-muted-foreground truncate">{client.email}</div>
          </div>
        </div>
        <Badge variant={client.clientType === 'freelance' ? 'secondary' : 'default'} className="shrink-0">
          {client.clientType === 'freelance' ? <Zap className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
        </Badge>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Valor</span>
          <p className="font-medium">{formatCurrency(client.monthlyValue)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Vencimento</span>
          <p className="font-medium">{formatPaymentDay(client.paymentDueDay)}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusBadge(client.status)}
        {getFreelancePaymentBadge(client)}
        {getROIBadge(client)}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(client)}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteClick(client)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        actions={
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <MRRDashboard metrics={metrics} />

      {/* Filter Tabs - Responsivo */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Todos</span> ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 sm:flex-none">
              <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Recorrentes</span> ({clients.filter(c => c.clientType === 'recurring').length})
            </TabsTrigger>
            <TabsTrigger value="freelance" className="flex-1 sm:flex-none">
              <Zap className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Freelance</span> ({clients.filter(c => c.clientType === 'freelance').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Clientes ({filteredClients.length})
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          {clients.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado.</p>
              <Button variant="outline" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro cliente
              </Button>
            </div>
          ) : (
            <ResponsiveTable
              columns={columns}
              data={filteredClients}
              keyExtractor={(client) => client.id}
              onRowClick={handleEdit}
              actions={renderActions}
              mobileCardTemplate={mobileCardTemplate}
              isLoading={isLoading}
              showViewToggle={true}
              defaultView="auto"
            />
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
    </PageContainer>
  );
};

export default Clients;
