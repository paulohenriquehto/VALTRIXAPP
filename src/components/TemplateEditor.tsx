import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Save,
  X,
  Check,
  AlertTriangle,
  Loader2,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  TemplateService,
  type TemplateWithDetails,
  type TemplateProject,
  type TemplateTask,
} from '@/services/templateService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TemplateEditorProps {
  templateId: string;
  onClose: () => void;
  onSaved?: () => void;
}

// Task categories
const TASK_CATEGORIES = [
  { value: 'communication', label: 'Comunicacao' },
  { value: 'setup', label: 'Configuracao' },
  { value: 'technical', label: 'Tecnica' },
  { value: 'review', label: 'Revisao' },
  { value: 'general', label: 'Geral' },
];

// Task roles
const TASK_ROLES = [
  { value: 'team', label: 'Equipe' },
  { value: 'client', label: 'Cliente' },
  { value: 'both', label: 'Ambos' },
];

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateId,
  onClose,
  onSaved,
}) => {
  const [template, setTemplate] = useState<TemplateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<TemplateProject | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogMode, setTaskDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<TemplateTask | null>(null);
  const [taskParentProjectId, setTaskParentProjectId] = useState<string>('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'project' | 'task'>('project');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    isRequired: true,
    estimatedDurationDays: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    isRequired: true,
    daysAfterStart: '0',
    category: '',
    assignedToRole: '',
  });

  // Load template
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getTemplateWithDetails(templateId);
      setTemplate(data);
      // Expand first project by default
      if (data.projects.length > 0) {
        setExpandedProjects(new Set([data.projects[0].id]));
      }
    } catch (error: any) {
      console.error('Erro ao carregar template:', error);
      toast.error(error.message || 'Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  };

  // Project CRUD
  const openCreateProjectDialog = () => {
    setProjectDialogMode('create');
    setEditingProject(null);
    setProjectForm({
      name: '',
      description: '',
      isRequired: true,
      estimatedDurationDays: '',
    });
    setProjectDialogOpen(true);
  };

  const openEditProjectDialog = (project: TemplateProject) => {
    setProjectDialogMode('edit');
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      isRequired: project.isRequired,
      estimatedDurationDays: project.estimatedDurationDays?.toString() || '',
    });
    setProjectDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name.trim()) {
      toast.error('Nome da fase e obrigatorio');
      return;
    }

    try {
      setSaving(true);

      if (projectDialogMode === 'create') {
        const maxSortOrder = template?.projects.reduce(
          (max, p) => Math.max(max, p.sortOrder),
          -1
        ) ?? -1;

        await TemplateService.createTemplateProject({
          serviceTemplateId: templateId,
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || null,
          isRequired: projectForm.isRequired,
          estimatedDurationDays: projectForm.estimatedDurationDays
            ? parseInt(projectForm.estimatedDurationDays)
            : null,
          sortOrder: maxSortOrder + 1,
        });
        toast.success('Fase criada com sucesso!');
      } else if (editingProject) {
        await TemplateService.updateTemplateProject(editingProject.id, {
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || null,
          isRequired: projectForm.isRequired,
          estimatedDurationDays: projectForm.estimatedDurationDays
            ? parseInt(projectForm.estimatedDurationDays)
            : null,
        });
        toast.success('Fase atualizada com sucesso!');
      }

      await loadTemplate();
      setProjectDialogOpen(false);
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar fase:', error);
      toast.error(error.message || 'Erro ao salvar fase');
    } finally {
      setSaving(false);
    }
  };

  // Task CRUD
  const openCreateTaskDialog = (projectId: string) => {
    setTaskDialogMode('create');
    setEditingTask(null);
    setTaskParentProjectId(projectId);
    setTaskForm({
      title: '',
      description: '',
      isRequired: true,
      daysAfterStart: '0',
      category: '',
      assignedToRole: '',
    });
    setTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: TemplateTask) => {
    setTaskDialogMode('edit');
    setEditingTask(task);
    setTaskParentProjectId(task.templateProjectId);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      isRequired: task.isRequired,
      daysAfterStart: task.daysAfterStart.toString(),
      category: task.category || '',
      assignedToRole: task.assignedToRole || '',
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('Titulo da tarefa e obrigatorio');
      return;
    }

    try {
      setSaving(true);

      if (taskDialogMode === 'create') {
        const project = template?.projects.find((p) => p.id === taskParentProjectId);
        const maxSortOrder = project?.tasks.reduce((max, t) => Math.max(max, t.sortOrder), -1) ?? -1;

        await TemplateService.createTemplateTask({
          templateProjectId: taskParentProjectId,
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          isRequired: taskForm.isRequired,
          daysAfterStart: parseInt(taskForm.daysAfterStart) || 0,
          category: taskForm.category || null,
          assignedToRole: taskForm.assignedToRole || null,
          sortOrder: maxSortOrder + 1,
        });
        toast.success('Tarefa criada com sucesso!');
      } else if (editingTask) {
        await TemplateService.updateTemplateTask(editingTask.id, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          isRequired: taskForm.isRequired,
          daysAfterStart: parseInt(taskForm.daysAfterStart) || 0,
          category: taskForm.category || null,
          assignedToRole: taskForm.assignedToRole || null,
        });
        toast.success('Tarefa atualizada com sucesso!');
      }

      await loadTemplate();
      setTaskDialogOpen(false);
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error(error.message || 'Erro ao salvar tarefa');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (type: 'project' | 'task', id: string, name: string) => {
    setDeleteType(type);
    setDeleteTarget({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setSaving(true);

      if (deleteType === 'project') {
        await TemplateService.deleteTemplateProject(deleteTarget.id);
        toast.success('Fase excluida com sucesso!');
      } else {
        await TemplateService.deleteTemplateTask(deleteTarget.id);
        toast.success('Tarefa excluida com sucesso!');
      }

      await loadTemplate();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error(error.message || 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  // Move project up/down
  const moveProject = async (project: TemplateProject, direction: 'up' | 'down') => {
    if (!template) return;

    const currentIndex = template.projects.findIndex((p) => p.id === project.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= template.projects.length) return;

    const targetProject = template.projects[targetIndex];

    try {
      await Promise.all([
        TemplateService.updateTemplateProject(project.id, { sortOrder: targetProject.sortOrder }),
        TemplateService.updateTemplateProject(targetProject.id, { sortOrder: project.sortOrder }),
      ]);
      await loadTemplate();
    } catch (error: any) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao reordenar fases');
    }
  };

  // Move task up/down
  const moveTask = async (task: TemplateTask, direction: 'up' | 'down') => {
    if (!template) return;

    const project = template.projects.find((p) => p.id === task.templateProjectId);
    if (!project) return;

    const currentIndex = project.tasks.findIndex((t) => t.id === task.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= project.tasks.length) return;

    const targetTask = project.tasks[targetIndex];

    try {
      await Promise.all([
        TemplateService.updateTemplateTask(task.id, { sortOrder: targetTask.sortOrder }),
        TemplateService.updateTemplateTask(targetTask.id, { sortOrder: task.sortOrder }),
      ]);
      await loadTemplate();
    } catch (error: any) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao reordenar tarefas');
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Stats
  const totalProjects = template?.projects.length || 0;
  const totalTasks = template?.projects.reduce((sum, p) => sum + p.tasks.length, 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Template nao encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="text-muted-foreground">
            Edite as fases e tarefas deste template de onboarding
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalProjects} fases</Badge>
          <Badge variant="secondary">{totalTasks} tarefas</Badge>
        </div>
      </div>

      <Separator />

      {/* Add Phase Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fases do Projeto</h3>
        <Button onClick={openCreateProjectDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fase
        </Button>
      </div>

      {/* Projects List */}
      {template.projects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fase criada</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando fases ao seu template
            </p>
            <Button onClick={openCreateProjectDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Fase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {template.projects.map((project, projectIndex) => {
            const isExpanded = expandedProjects.has(project.id);

            return (
              <Card key={project.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleProject(project.id)}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {project.name}
                            {project.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatorio
                              </Badge>
                            )}
                          </CardTitle>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </CollapsibleTrigger>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {project.tasks.length} tarefas
                        </Badge>
                        {project.estimatedDurationDays && (
                          <Badge variant="secondary" className="text-xs">
                            {project.estimatedDurationDays} dias
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveProject(project, 'up')}
                            disabled={projectIndex === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveProject(project, 'down')}
                            disabled={projectIndex === template.projects.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditProjectDialog(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog('project', project.id, project.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />

                      {/* Add Task Button */}
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreateTaskDialog(project.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Tarefa
                        </Button>
                      </div>

                      {/* Tasks List */}
                      {project.tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Nenhuma tarefa nesta fase</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {project.tasks.map((task, taskIndex) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {taskIndex + 1}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm flex items-center gap-2">
                                  {task.title}
                                  {task.isRequired && (
                                    <span className="text-red-500 text-xs">(obrigatorio)</span>
                                  )}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  {task.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {TASK_CATEGORIES.find((c) => c.value === task.category)?.label ||
                                        task.category}
                                    </Badge>
                                  )}
                                  {task.assignedToRole && (
                                    <Badge variant="outline" className="text-xs">
                                      {TASK_ROLES.find((r) => r.value === task.assignedToRole)?.label ||
                                        task.assignedToRole}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    +{task.daysAfterStart} dias
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveTask(task, 'up')}
                                  disabled={taskIndex === 0}
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveTask(task, 'down')}
                                  disabled={taskIndex === project.tasks.length - 1}
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditTaskDialog(task)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => openDeleteDialog('task', task.id, task.title)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {projectDialogMode === 'create' ? 'Nova Fase' : 'Editar Fase'}
            </DialogTitle>
            <DialogDescription>
              {projectDialogMode === 'create'
                ? 'Adicione uma nova fase ao template'
                : 'Edite as informacoes da fase'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome da Fase *</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="Ex: Fase 1 - Discovery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Descricao</Label>
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Descreva o objetivo desta fase..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-duration">Duracao Estimada (dias)</Label>
              <Input
                id="project-duration"
                type="number"
                min="0"
                value={projectForm.estimatedDurationDays}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, estimatedDurationDays: e.target.value })
                }
                placeholder="Ex: 7"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="project-required" className="cursor-pointer">
                  Fase Obrigatoria
                </Label>
                <p className="text-sm text-muted-foreground">
                  Esta fase deve ser concluida para o onboarding
                </p>
              </div>
              <Switch
                id="project-required"
                checked={projectForm.isRequired}
                onCheckedChange={(checked) =>
                  setProjectForm({ ...projectForm, isRequired: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {projectDialogMode === 'create' ? 'Criar Fase' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {taskDialogMode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}
            </DialogTitle>
            <DialogDescription>
              {taskDialogMode === 'create'
                ? 'Adicione uma nova tarefa a fase'
                : 'Edite as informacoes da tarefa'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titulo da Tarefa *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Ex: Criar grupo no WhatsApp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descricao</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Descreva os detalhes da tarefa..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-category">Categoria</Label>
                <Select
                  value={taskForm.category}
                  onValueChange={(value) => setTaskForm({ ...taskForm, category: value })}
                >
                  <SelectTrigger id="task-category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {TASK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-role">Responsavel</Label>
                <Select
                  value={taskForm.assignedToRole}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assignedToRole: value })}
                >
                  <SelectTrigger id="task-role">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nao definido</SelectItem>
                    {TASK_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-days">Dias apos inicio do projeto</Label>
              <Input
                id="task-days"
                type="number"
                min="0"
                value={taskForm.daysAfterStart}
                onChange={(e) => setTaskForm({ ...taskForm, daysAfterStart: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Quando esta tarefa deve ser iniciada (0 = primeiro dia)
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="task-required" className="cursor-pointer">
                  Tarefa Obrigatoria
                </Label>
                <p className="text-sm text-muted-foreground">
                  Esta tarefa deve ser concluida
                </p>
              </div>
              <Switch
                id="task-required"
                checked={taskForm.isRequired}
                onCheckedChange={(checked) => setTaskForm({ ...taskForm, isRequired: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTask} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {taskDialogMode === 'create' ? 'Criar Tarefa' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteType === 'project' ? 'a fase' : 'a tarefa'}{' '}
              <strong>"{deleteTarget?.name}"</strong>?
              {deleteType === 'project' && (
                <>
                  <br />
                  <br />
                  <span className="text-red-600 font-medium">
                    Todas as tarefas desta fase tambem serao excluidas.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateEditor;
