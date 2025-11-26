import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useClients, useAuth } from '../stores/appStore';
import { ProjectService } from '../services';
import {
  Plus,
  FolderKanban,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { toast } from 'sonner';
import ProjectDialog from '../components/ProjectDialog';
import type { Project } from '../types';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setProjects } = useProjects();
  const { clients } = useClients();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await ProjectService.getAll(user.id);
      setProjects(data);
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error);
      toast.error(error.message || 'Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'active').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const onHold = projects.filter((p) => p.status === 'on_hold').length;
    const planning = projects.filter((p) => p.status === 'planning').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    return { total, active, completed, onHold, planning, totalBudget };
  }, [projects]);

  // Projetos filtrados
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesClient = clientFilter === 'all' || project.client.id === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [projects, searchTerm, statusFilter, clientFilter]);

  // Clientes únicos para o filtro
  const uniqueClients = useMemo(() => {
    const clientMap = new Map();
    projects.forEach((p) => {
      if (!clientMap.has(p.client.id)) {
        clientMap.set(p.client.id, p.client);
      }
    });
    return Array.from(clientMap.values());
  }, [projects]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getTaskProgress = (project: Project) => {
    if (!project.tasks || project.tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const total = project.tasks.length;
    const completed = project.tasks.filter((t) => t.status === 'completed').length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !user) return;
    try {
      await ProjectService.delete(projectToDelete.id);
      await loadProjects();
      toast.success('Projeto excluído com sucesso!');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast.error(error.message || 'Erro ao excluir projeto');
    }
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setDialogMode('edit');
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleView = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleSave = async (projectData: Partial<Project>) => {
    if (!user) return;

    try {
      if (dialogMode === 'create') {
        await ProjectService.create(projectData, user.id);
        toast.success('Projeto criado com sucesso!');
      } else if (selectedProject) {
        await ProjectService.update(selectedProject.id, projectData);
        toast.success('Projeto atualizado com sucesso!');
      }
      await loadProjects();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar projeto:', error);
      toast.error(error.message || 'Erro ao salvar projeto');
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    const variants: Record<Project['status'], { label: string; className: string }> = {
      planning: {
        label: 'Planejamento',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      active: {
        label: 'Ativo',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      on_hold: {
        label: 'Pausado',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      completed: {
        label: 'Concluído',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      cancelled: {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus projetos em um só lugar</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">projetos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onHold}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">em projetos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cliente ou descrição..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="on_hold">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Cliente */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {uniqueClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle de Visualização */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Projetos */}
      {filteredProjects.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {projects.length === 0
                ? 'Nenhum projeto cadastrado.'
                : 'Nenhum projeto encontrado com os filtros aplicados.'}
            </p>
            {projects.length === 0 && (
              <Button variant="outline" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro projeto
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* Visualização em Tabela */
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Lista de Projetos ({filteredProjects.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const progress = getTaskProgress(project);
                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(project)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{project.client.companyName}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(project.status)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{progress.completed}/{progress.total}</span>
                            <span>{progress.percentage}%</span>
                          </div>
                          <Progress
                            value={progress.percentage}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {project.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(project.startDate)}
                            </div>
                          )}
                          {project.endDate && (
                            <div className="text-muted-foreground">
                              até {formatDate(project.endDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(project.budget)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ações
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(project)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(project)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(project)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* Visualização em Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const progress = getTaskProgress(project);
            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleView(project)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {project.client.companyName}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {progress.completed}/{progress.total} tarefas ({progress.percentage}%)
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-medium">{formatCurrency(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Início</p>
                      <p className="font-medium">
                        {project.startDate ? formatDate(project.startDate) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-2 pt-2 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(project)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(project)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ProjectDialog
        open={dialogOpen}
        mode={dialogMode}
        project={selectedProject}
        clients={clients}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{projectToDelete?.name}"? Esta ação não
              pode ser desfeita. Todas as notas e documentos associados também serão removidos.
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

export default Projects;
