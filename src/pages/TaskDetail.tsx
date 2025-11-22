import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Save, X, CheckCircle2, Circle, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../stores/appStore';
import { TaskService, CategoryService, TagService } from '../services';
import { formatDate } from '../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TagSelector from '../components/TagSelector';
import CategorySelector from '../components/CategorySelector';
import { toast } from 'sonner';
import type { Task, Category, Tag } from '../types';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data para modo de edição
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    category: null as Category | null,
    tags: [] as Tag[],
  });

  useEffect(() => {
    if (id && user) {
      loadTask();
      loadCategories();
      loadTags();
    }
  }, [id, user]);

  const loadTask = async () => {
    if (!id || !user) return;
    try {
      setIsLoading(true);
      const data = await TaskService.getAll(user.id);
      const foundTask = data.find(t => t.id === id);

      if (foundTask) {
        setTask(foundTask);
        setFormData({
          title: foundTask.title,
          description: foundTask.description || '',
          status: foundTask.status,
          priority: foundTask.priority,
          dueDate: foundTask.dueDate ? new Date(foundTask.dueDate).toISOString().split('T')[0] : '',
          category: foundTask.category || null,
          tags: foundTask.tags || [],
        });
      } else {
        toast.error('Tarefa não encontrada');
        navigate('/tasks');
      }
    } catch (error: any) {
      console.error('Erro ao carregar tarefa:', error);
      toast.error(error.message || 'Erro ao carregar tarefa');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    try {
      const data = await CategoryService.getAll(user.id);
      setCategories(data);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadTags = async () => {
    if (!user) return;
    try {
      const data = await TagService.getAll(user.id);
      setTags(data);
    } catch (error: any) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const handleSave = async () => {
    if (!task || !user) return;

    try {
      setIsSaving(true);
      const taskData: Partial<Task> = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        category: formData.category || undefined,
        tags: formData.tags,
      };

      await TaskService.update(task.id, taskData);
      await loadTask();
      setIsEditMode(false);
      toast.success('Tarefa atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error.message || 'Erro ao atualizar tarefa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        category: task.category || null,
        tags: task.tags || [],
      });
    }
    setIsEditMode(false);
  };

  const handleToggleComplete = async () => {
    if (!task || !user) return;
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await TaskService.update(task.id, { status: newStatus });
      await loadTask();
      toast.success(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta!');
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error.message || 'Erro ao atualizar tarefa');
    }
  };

  const handleDelete = async () => {
    if (!task || !user) return;
    try {
      await TaskService.delete(task.id);
      toast.success('Tarefa excluída com sucesso!');
      navigate('/tasks');
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error(error.message || 'Erro ao excluir tarefa');
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      in_progress: { label: 'Em Progresso', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      archived: { label: 'Arquivada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants: Record<Task['priority'], { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      high: { label: 'Alta', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const variant = variants[priority];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando tarefa...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Tarefa não encontrada</h2>
          <p className="text-muted-foreground mb-4">A tarefa que você está procurando não existe.</p>
          <Button onClick={() => navigate('/tasks')}>Voltar para Tarefas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tasks">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Tarefa</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e edite os detalhes da sua tarefa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleComplete}
                className={task.status === 'completed' ? 'text-green-600' : ''}
              >
                {task.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluída
                  </>
                ) : (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Marcar como concluída
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            {isEditMode ? (
              // Modo de Edição
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Digite a descrição da tarefa"
                    rows={8}
                  />
                </div>
              </div>
            ) : (
              // Modo de Visualização
              <div className="space-y-4">
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={handleToggleComplete}
                    />
                    <span className="text-sm text-muted-foreground">
                      {task.status === 'completed' ? 'Tarefa concluída' : 'Marcar como concluída'}
                    </span>
                  </div>
                </div>

                <Separator />

                {task.description ? (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h3>
                    <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Nenhuma descrição fornecida</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Informações da Tarefa */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações</h3>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                {isEditMode ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="archived">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">{getStatusBadge(task.status)}</div>
                )}
              </div>

              {/* Prioridade */}
              <div>
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                {isEditMode ? (
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                )}
              </div>

              <Separator />

              {/* Categoria */}
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                {isEditMode ? (
                  <div className="mt-1">
                    <CategorySelector
                      categories={categories}
                      selectedCategory={formData.category}
                      onCategoryChange={(category) => setFormData({ ...formData, category })}
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    {task.category ? (
                      <Badge variant="outline" className="text-xs">
                        {task.category.icon && <span className="mr-1">{task.category.icon}</span>}
                        {task.category.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem categoria</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                {isEditMode ? (
                  <div className="mt-1">
                    <TagSelector
                      tags={tags}
                      selectedTags={formData.tags}
                      onTagsChange={(tags) => setFormData({ ...formData, tags })}
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    {task.tags && task.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: tag.color + '15',
                              borderColor: tag.color + '40',
                              color: tag.color
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem tags</span>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Data de Vencimento */}
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data de Vencimento
                </Label>
                {isEditMode ? (
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {task.dueDate ? (
                      <span className="text-sm">{formatDate(task.dueDate)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem data definida</span>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamps */}
              {!isEditMode && (
                <>
                  <Separator />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Criada em: {task.createdAt ? formatDate(task.createdAt) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Atualizada em: {task.updatedAt ? formatDate(task.updatedAt) : 'N/A'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskDetail;
