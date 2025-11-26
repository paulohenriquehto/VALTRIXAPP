import React, { useState, useEffect } from 'react';
import { useTeam, useAuth } from '../stores/appStore';
import { TeamService } from '../services';
import { Plus, Users, Network, Mail, Copy, Check, Pencil, Trash2, Link2, UserPlus, Shield, X, MoreVertical, Building2, Briefcase, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRoleLabel, getDepartmentLabel } from '../utils/permissions';
import { toast } from 'sonner';
import { PageHeader, PageContainer, PageAction } from '@/components/ui/page-header';
import { ResponsiveGrid, CardGrid } from '@/components/ui/responsive-grid';
import { useIsMobile } from '@/hooks/use-mobile';
import type { TeamMember, TeamRole, Department, TeamInvite } from '../types';

const Team: React.FC = () => {
  const {
    teamMembers,
    teamInvites,
    setTeamMembers,
    setTeamInvites,
    updateTeamMember,
    removeTeamMember,
    sendInvite,
    cancelInvite
  } = useTeam();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membersData, invitesData] = await Promise.all([
        TeamService.getAllMembers(),
        TeamService.getAllInvites()
      ]);
      setTeamMembers(membersData);
      setTeamInvites(invitesData);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      toast.error('Erro ao carregar dados da equipe');
    }
  };

  // Estados dos dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLinkDialogOpen, setInviteLinkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Dados do formulário de convite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('junior');
  const [inviteDepartment, setInviteDepartment] = useState<Department>('engineering');

  // Dados do formulário de edição
  const [editRole, setEditRole] = useState<TeamRole>('junior');
  const [editDepartment, setEditDepartment] = useState<Department>('engineering');
  const [editStatus, setEditStatus] = useState<TeamMember['status']>('active');

  // Filtrar membros
  const filteredMembers = teamMembers.filter((member) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = member.user.fullName.toLowerCase().includes(query);
      const matchesEmail = member.user.email.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail) return false;
    }

    if (departmentFilter !== 'all' && member.department !== departmentFilter) {
      return false;
    }

    if (roleFilter !== 'all' && member.role !== roleFilter) {
      return false;
    }

    if (statusFilter !== 'all' && member.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'active').length,
    pending: teamInvites.filter((i) => i.status === 'pending').length,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    const variants: Record<TeamMember['status'], { label: string; className: string }> = {
      active: {
        label: 'Ativo',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      inactive: {
        label: 'Inativo',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      on_leave: {
        label: 'Afastado',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      terminated: {
        label: 'Desligado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    const colors: Record<string, string> = {
      ceo: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      c_level: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      director: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      manager: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      team_lead: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      senior: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      mid_level: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
      junior: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      intern: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getInviteStatusBadge = (status: TeamInvite['status']) => {
    const variants: Record<TeamInvite['status'], { label: string; className: string }> = {
      pending: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      accepted: {
        label: 'Aceito',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      rejected: {
        label: 'Rejeitado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      expired: {
        label: 'Expirado',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Gerar link de convite
  const handleGenerateInviteLink = () => {
    const token = crypto.randomUUID();
    const link = `${window.location.origin}/join/${token}`;
    setInviteLink(link);
    setInviteLinkDialogOpen(true);
    toast.success('Link de convite gerado!');
  };

  // Copiar link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success('Link copiado para a área de transferência');
  };

  // Enviar convite
  const handleSendInvite = async () => {
    if (!inviteEmail || !user) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    try {
      const newInvite: Partial<TeamInvite> = {
        email: inviteEmail,
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        department: inviteDepartment,
        permissions: {
          modules: {
            dashboard: { view: true, edit: false, delete: false },
            tasks: { view: true, edit: true, delete: false },
            clients: { view: true, edit: false, delete: false },
            calendar: { view: true, edit: true, delete: false },
            team: { view: false, edit: false, delete: false },
            analytics: { view: false, edit: false, delete: false },
            tags: { view: true, edit: false, delete: false },
            settings: { view: false, edit: false, delete: false },
          },
          admin: {
            manageUsers: false,
            manageRoles: false,
            manageSettings: false,
            viewAuditLogs: false,
          },
          dataScope: 'own',
        } as any,
        invitedBy: user,
      };

      const createdInvite = await TeamService.createInvite(newInvite);
      sendInvite(createdInvite);

      toast.success(`Convite enviado para ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('junior');
      setInviteDepartment('engineering');
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    }
  };

  // Abrir dialog de edição
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditDepartment(member.department);
    setEditStatus(member.status);
    setEditDialogOpen(true);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!selectedMember) return;

    try {
      const updates = {
        role: editRole,
        department: editDepartment,
        status: editStatus
      };

      const updatedMember = await TeamService.updateMember(selectedMember.id, updates);
      updateTeamMember(selectedMember.id, updatedMember);

      toast.success('Membro atualizado com sucesso');
      setEditDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toast.error('Erro ao atualizar membro');
    }
  };

  // Remover membro
  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  // Confirmar remoção
  const handleConfirmDelete = async () => {
    if (!selectedMember) return;

    try {
      await TeamService.deleteMember(selectedMember.id);
      removeTeamMember(selectedMember.id);
      toast.success('Membro removido com sucesso');
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro');
    }
  };

  // Reenviar convite
  const handleResendInvite = async (invite: TeamInvite) => {
    try {
      const updatedInvite = await TeamService.resendInvite(invite.id);
      setTeamInvites(teamInvites.map(inv => inv.id === invite.id ? updatedInvite : inv));
      toast.success('Convite reenviado com sucesso');
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
      toast.error('Erro ao reenviar convite');
    }
  };

  // Cancelar convite
  const handleCancelInvite = async (invite: TeamInvite) => {
    try {
      await TeamService.deleteInvite(invite.id);
      cancelInvite(invite.id);
      toast.success('Convite cancelado');
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Equipe"
        description="Gerencie membros, convites e permissões"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleGenerateInviteLink} className="w-full sm:w-auto">
              <Link2 className="mr-2 h-4 w-4" />
              <span className="sm:inline">Link</span>
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Convidar</span>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <ResponsiveGrid preset="three">
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Membros</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{stats.total}</h3>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Membros Ativos</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{stats.active}</h3>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Convites Pendentes</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{stats.pending}</h3>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </ResponsiveGrid>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="list" className="text-xs sm:text-sm">
            <Users className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs sm:text-sm">
            <Network className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Org</span>
          </TabsTrigger>
          <TabsTrigger value="invites" className="text-xs sm:text-sm">
            <Mail className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Convites</span>
            <span className="ml-1">({stats.pending})</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Lista */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Depto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="engineering">Engenharia</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="customer_success">CS</SelectItem>
                    <SelectItem value="finance">Financeiro</SelectItem>
                    <SelectItem value="hr">RH</SelectItem>
                    <SelectItem value="operations">Operações</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                    <SelectItem value="c_level">C-Level</SelectItem>
                    <SelectItem value="director">Diretor</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="team_lead">Tech Lead</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="mid_level">Pleno</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="intern">Estagiário</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs sm:text-sm col-span-2 sm:col-span-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="on_leave">Afastado</SelectItem>
                    <SelectItem value="terminated">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Lista de Membros */}
          <Card>
            {filteredMembers.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">Nenhum membro encontrado.</p>
                <Button variant="outline" onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Convidar primeiro membro
                </Button>
              </div>
            ) : isMobile ? (
              /* Cards para Mobile */
              <CardGrid className="p-3">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
                          <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{member.user.fullName}</div>
                          <div className="text-xs text-muted-foreground truncate">{member.user.email}</div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMember(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteMember(member)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={getRoleBadgeColor(member.role) + " text-xs"}>
                        {getRoleLabel(member.role)}
                      </Badge>
                      {getStatusBadge(member.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{getDepartmentLabel(member.department)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(member.hireDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardGrid>
            ) : (
              /* Tabela para Desktop */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="hidden md:table-cell">Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Data de Entrada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
                            <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{member.user.fullName}</div>
                            <div className="text-sm text-muted-foreground truncate">{member.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getDepartmentLabel(member.department)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(member.hireDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteMember(member)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Aba Organograma */}
        <TabsContent value="chart">
          <Card className="p-8 sm:p-12 text-center">
            <Network className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Organograma</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Visualização hierárquica da equipe em desenvolvimento...
            </p>
          </Card>
        </TabsContent>

        {/* Aba Convites */}
        <TabsContent value="invites">
          <Card>
            {teamInvites.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Nenhum Convite Pendente</h3>
                <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                  Convide novos membros para sua equipe
                </p>
                <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enviar Convite
                </Button>
              </div>
            ) : isMobile ? (
              /* Cards de Convites para Mobile */
              <CardGrid className="p-3">
                {teamInvites.map((invite) => (
                  <Card key={invite.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{invite.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {getInviteStatusBadge(invite.status)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={getRoleBadgeColor(invite.role) + " text-xs"}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getDepartmentLabel(invite.department)}
                      </Badge>
                    </div>
                    {invite.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleResendInvite(invite)}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Reenviar
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCancelInvite(invite)}
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </CardGrid>
            ) : (
              /* Tabela de Convites para Desktop */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="hidden md:table-cell">Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Enviado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(invite.role)}>
                          {getRoleLabel(invite.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getDepartmentLabel(invite.department)}</TableCell>
                      <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {invite.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendInvite(invite)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Reenviar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCancelInvite(invite)} className="text-destructive">
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Convidar Membro */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Envie um convite por email para adicionar um novo membro à equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm">Cargo</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TeamRole)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Estagiário</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="mid_level">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="team_lead">Tech Lead</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="director">Diretor</SelectItem>
                    <SelectItem value="c_level">C-Level</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm">Departamento</Label>
                <Select value={inviteDepartment} onValueChange={(value) => setInviteDepartment(value as Department)}>
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engenharia</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="customer_success">CS</SelectItem>
                    <SelectItem value="finance">Financeiro</SelectItem>
                    <SelectItem value="hr">RH</SelectItem>
                    <SelectItem value="operations">Operações</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Link de Convite */}
      <Dialog open={inviteLinkDialogOpen} onOpenChange={setInviteLinkDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Convite</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Compartilhe este link para convidar membros para sua equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs sm:text-sm" />
              <Button onClick={handleCopyLink} size="icon" variant="outline" className="shrink-0">
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <p className="font-medium mb-1">Informações de Segurança</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Este link expira em 7 dias</li>
                    <li>• Pode ser usado múltiplas vezes</li>
                    <li>• Você pode revogar a qualquer momento</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteLinkDialogOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Membro */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize as informações do membro da equipe
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4 py-2 sm:py-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={selectedMember.user.avatarUrl} />
                  <AvatarFallback>{getInitials(selectedMember.user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{selectedMember.user.fullName}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{selectedMember.user.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm">Cargo</Label>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as TeamRole)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Estagiário</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="mid_level">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="team_lead">Tech Lead</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="director">Diretor</SelectItem>
                    <SelectItem value="c_level">C-Level</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department" className="text-sm">Departamento</Label>
                  <Select value={editDepartment} onValueChange={(value) => setEditDepartment(value as Department)}>
                    <SelectTrigger id="edit-department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engenharia</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="customer_success">CS</SelectItem>
                      <SelectItem value="finance">Financeiro</SelectItem>
                      <SelectItem value="hr">RH</SelectItem>
                      <SelectItem value="operations">Operações</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-sm">Status</Label>
                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as TeamMember['status'])}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="on_leave">Afastado</SelectItem>
                      <SelectItem value="terminated">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Remover Membro */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Tem certeza que deseja remover <strong>{selectedMember?.user.fullName}</strong> da equipe?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default Team;
