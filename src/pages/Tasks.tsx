import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useAuth } from '../stores/appStore';
import { TaskService, CategoryService, TagService } from '../services';
import { formatDate } from '../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, CheckCircle2, Circle, ListTodo, Loader2, Search, X, Filter, ChevronDown } from 'lucide-react';
import TaskDialog from '../components/TaskDialog';
import TagSelector from '../components/TagSelector';
import CategorySelector from '../components/CategorySelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Task, Category, Tag } from '../types';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, setTasks, selectedTask: storeSelectedTask, setSelectedTask: setStoreSelectedTask } = useTasks();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Estados de filtro
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadTasks();
      loadCategories();
      loadTags();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await TaskService.getAll(user.id);
      setTasks(data);
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error(error.message || 'Erro ao carregar tarefas');
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

  // Filtrar tarefas por status, busca, categoria e tags
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filtro por status (tabs)
    if (activeTab === 'active') {
      filtered = filtered.filter(task => task.status !== 'completed');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    }

    // Filtro por busca de texto
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
      );
    }

    // Filtro por categoria
    if (filterCategory) {
      filtered = filtered.filter(task => task.category?.id === filterCategory);
    }

    // Filtro por tags
    if (filterTags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags && task.tags.some(tag => filterTags.includes(tag.id))
      );
    }

    return filtered;
  }, [tasks, activeTab, searchText, filterCategory, filterTags]);

  // Contadores de tarefas
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      active: tasks.filter(t => t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks]);

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setDialogMode('edit');
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete || !user) return;
    try {
      await TaskService.delete(taskToDelete.id);
      await loadTasks();
      toast.success('Tarefa excluída com sucesso!');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error(error.message || 'Erro ao excluir tarefa');
    }
  };

  const handleSave = async (taskData: Partial<Task>) => {
    if (!user) return;

    try {
      setIsSaving(true);
      if (dialogMode === 'create') {
        await TaskService.create(taskData, user.id);
        toast.success('Tarefa criada com sucesso!');
      } else if (selectedTask) {
        await TaskService.update(selectedTask.id, taskData);
        toast.success('Tarefa atualizada com sucesso!');
      }
      await loadTasks();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error(error.message || 'Erro ao salvar tarefa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!user) return;
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await TaskService.update(task.id, { status: newStatus });
      await loadTasks();
      toast.success(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta!');
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error.message || 'Erro ao atualizar tarefa');
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setFilterCategory(null);
    setFilterTags([]);
  };

  const hasActiveFilters = searchText.trim() !== '' || filterCategory !== null || filterTags.length > 0;

  // Componente de loading skeleton
  const SkeletonCard = () => (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-5 w-5 rounded mt-1.5" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    </Card>
  );

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

  // Renderizar tarefa individual
  const renderTask = (task: Task) => (
    <Card key={task.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/50">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={(e) => {
              handleToggleComplete(task);
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5"
          />

          <div
            className="flex-1 min-w-0 space-y-3 cursor-pointer"
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <div>
              <h3 className={`text-base font-semibold mb-1.5 transition-all ${task.status === 'completed'
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground group-hover:text-primary'
                }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
              {task.category && (
                <Badge variant="outline" className="text-xs">
                  {task.category.icon && <span className="mr-1">{task.category.icon}</span>}
                  {task.category.name}
                </Badge>
              )}
              {task.dueDate && (
                <Badge variant="outline" className="text-xs">
                  📅 {formatDate(task.dueDate)}
                </Badge>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <>
                <Separator className="my-3" />
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
              </>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(task);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar tarefa</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(task);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir tarefa</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus projetos e acompanhe o progresso
          </p>
          {tasks.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {taskCounts.completed} de {taskCounts.all} tarefas concluídas
                </span>
                <span className="font-medium text-primary">
                  {Math.round((taskCounts.completed / taskCounts.all) * 100)}%
                </span>
              </div>
              <Progress
                value={(taskCounts.completed / taskCounts.all) * 100}
                className="h-2"
              />
            </div>
          )}
        </div>
        <Button onClick={handleCreate} size="lg" className="shadow-md" disabled={isSaving}>
          {isSaving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Salvando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </>
          )}
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Filtros</h3>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {[searchText.trim() !== '', filterCategory !== null, filterTags.length > 0].filter(Boolean).length} ativo(s)
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Limpar filtros
                </Button>
              )}
            </div>

            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Busca de texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
                {searchText && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchText('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filtro por categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Categoria</label>
              <CategorySelector
                categories={categories}
                selectedCategory={categories.find(c => c.id === filterCategory) || null}
                onCategoryChange={(category) => setFilterCategory(category?.id || null)}
                placeholder="Todas as categorias"
              />
            </div>

            {/* Filtro por tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tags</label>
              <TagSelector
                tags={tags}
                selectedTags={tags.filter(t => filterTags.includes(t.id))}
                onTagsChange={(selectedTags) => setFilterTags(selectedTags.map(t => t.id))}
              />
              </div>
            </div>
            </CollapsibleContent>
          </div>
        </Card>
      </Collapsible>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Circle className="h-4 w-4" />
            Ativas
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
              {taskCounts.active}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Concluídas
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
              {taskCounts.completed}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Todas
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
              {taskCounts.all}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Circle className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma tarefa ativa</EmptyTitle>
                <EmptyDescription>
                  Você não tem tarefas pendentes. Que tal criar uma nova?
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar tarefa
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="grid gap-4 pr-4">
                {filteredTasks.map(renderTask)}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma tarefa concluída</EmptyTitle>
                <EmptyDescription>
                  Complete suas tarefas para vê-las aqui!
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="grid gap-4 pr-4">
                {filteredTasks.map(renderTask)}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListTodo className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma tarefa encontrada</EmptyTitle>
                <EmptyDescription>
                  Comece criando sua primeira tarefa!
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira tarefa
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="grid gap-4 pr-4">
                {filteredTasks.map(renderTask)}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        mode={dialogMode}
        task={selectedTask}
        categories={categories}
        tags={tags}
        isSaving={isSaving}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{taskToDelete?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;
