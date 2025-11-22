import React, { useState, useEffect } from 'react';
import { useTeam, useAuth } from '../stores/appStore';
import { TeamService } from '../services';
import { Plus, Users, Network, Mail, Copy, Check, Pencil, Trash2, Link2, UserPlus, Shield, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRoleLabel, getDepartmentLabel } from '../utils/permissions';
import { toast } from 'sonner';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie membros, convites e permissões
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateInviteLink}>
            <Link2 className="mr-2 h-4 w-4" />
            Link de Convite
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Membro
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
              <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membros Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{stats.active}</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convites Pendentes</p>
              <h3 className="text-2xl font-bold mt-2">{stats.pending}</h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <Users className="mr-2 h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="chart">
            <Network className="mr-2 h-4 w-4" />
            Organograma
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="mr-2 h-4 w-4" />
            Convites ({stats.pending})
          </TabsTrigger>
        </TabsList>

        {/* Aba Lista */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Departamentos</SelectItem>
                  <SelectItem value="engineering">Engenharia</SelectItem>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="customer_success">Customer Success</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="hr">RH</SelectItem>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cargos</SelectItem>
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
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="on_leave">Afastado</SelectItem>
                  <SelectItem value="terminated">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Tabela */}
          <Card>
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Nenhum membro encontrado.</p>
                <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Convidar primeiro membro
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Entrada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
                            <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDepartmentLabel(member.department)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {new Date(member.hireDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
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
          </Card>
        </TabsContent>

        {/* Aba Organograma */}
        <TabsContent value="chart">
          <Card className="p-12 text-center">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">Organograma</h3>
            <p className="text-muted-foreground">
              Visualização hierárquica da equipe em desenvolvimento...
            </p>
          </Card>
        </TabsContent>

        {/* Aba Convites */}
        <TabsContent value="invites">
          <Card>
            {teamInvites.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-2">Nenhum Convite Pendente</h3>
                <p className="text-muted-foreground mb-4">
                  Convide novos membros para sua equipe
                </p>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enviar Convite
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
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
                      <TableCell>{getDepartmentLabel(invite.department)}</TableCell>
                      <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                      <TableCell>
                        {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invite.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(invite)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Reenviar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvite(invite)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
            <DialogDescription>
              Envie um convite por email para adicionar um novo membro à equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
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
              <Label htmlFor="department">Departamento</Label>
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
                  <SelectItem value="customer_success">Customer Success</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="hr">RH</SelectItem>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendInvite}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Link de Convite */}
      <Dialog open={inviteLinkDialogOpen} onOpenChange={setInviteLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite</DialogTitle>
            <DialogDescription>
              Compartilhe este link para convidar membros para sua equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Informações de Segurança</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Este link expira em 7 dias</li>
                    <li>• Pode ser usado múltiplas vezes</li>
                    <li>• Você pode revogar este link a qualquer momento</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteLinkDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Membro */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do membro da equipe
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.user.avatarUrl} />
                  <AvatarFallback>{getInitials(selectedMember.user.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedMember.user.fullName}</div>
                  <div className="text-sm text-muted-foreground">{selectedMember.user.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Cargo</Label>
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

              <div className="space-y-2">
                <Label htmlFor="edit-department">Departamento</Label>
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
                    <SelectItem value="customer_success">Customer Success</SelectItem>
                    <SelectItem value="finance">Financeiro</SelectItem>
                    <SelectItem value="hr">RH</SelectItem>
                    <SelectItem value="operations">Operações</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Remover Membro */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{selectedMember?.user.fullName}</strong> da equipe?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Team;
