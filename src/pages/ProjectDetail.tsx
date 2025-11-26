import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects, useClients, useAuth } from '../stores/appStore';
import { ProjectService, TaskService } from '../services';
import { useIsMobile } from '@/hooks/use-mobile';
import { KPIGrid, ResponsiveGrid } from '@/components/ui/responsive-grid';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Upload,
  Download,
  X,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ListTodo,
  FileIcon,
  FolderIcon,
  Image,
  File,
  ChevronDown,
  ChevronRight,
  User,
  Target,
  TrendingUp,
  Filter,
  Pin,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import ProjectDialog from '../components/ProjectDialog';
import type { Project, ProjectNote, ProjectDocument, Task } from '../types';
import { cn } from '@/lib/utils';

// Categorias de notas disponíveis
const NOTE_CATEGORIES = [
  { value: 'meeting', label: 'Reunião', color: 'bg-blue-500' },
  { value: 'reminder', label: 'Lembrete', color: 'bg-yellow-500' },
  { value: 'important', label: 'Importante', color: 'bg-red-500' },
  { value: 'feedback', label: 'Feedback', color: 'bg-purple-500' },
  { value: 'general', label: 'Geral', color: 'bg-gray-500' },
];

// Categorias de documentos
const DOC_CATEGORIES = [
  { value: 'briefing', label: 'Briefing' },
  { value: 'contract', label: 'Contrato' },
  { value: 'design', label: 'Arte/Design' },
  { value: 'reference', label: 'Referência' },
  { value: 'report', label: 'Relatório' },
  { value: 'other', label: 'Outro' },
];

// Filtros de tarefas
type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useProjects();
  const { clients } = useClients();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ProjectNote | null>(null);
  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ProjectDocument | null>(null);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);

  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'general' });
  const [noteMode, setNoteMode] = useState<'create' | 'edit'>('create');
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Task states
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['all']));
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());

  // Notes states
  const [notesSearch, setNotesSearch] = useState('');
  const [notesCategory, setNotesCategory] = useState<string>('all');

  // Documents states
  const [docViewMode, setDocViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (id && user) {
      loadProject();
    }
  }, [id, user]);

  const loadProject = async () => {
    if (!id || !user) return;
    try {
      setIsLoading(true);
      const data = await ProjectService.getById(id);
      setSelectedProject(data);
    } catch (error: any) {
      console.error('Erro ao carregar projeto:', error);
      toast.error(error.message || 'Erro ao carregar projeto');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !user) return;
    try {
      await ProjectService.delete(selectedProject.id);
      toast.success('Projeto excluído com sucesso!');
      navigate('/projects');
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast.error(error.message || 'Erro ao excluir projeto');
    }
  };

  const handleSaveEdit = async (projectData: Partial<Project>) => {
    if (!selectedProject || !user) return;
    try {
      await ProjectService.update(selectedProject.id, projectData);
      toast.success('Projeto atualizado com sucesso!');
      await loadProject();
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error(error.message || 'Erro ao atualizar projeto');
    }
  };

  // ========== TASK TOGGLE ==========
  const handleToggleTaskStatus = useCallback(async (task: Task) => {
    if (!user || updatingTasks.has(task.id)) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const newProgress = newStatus === 'completed' ? 100 : 0;

    setUpdatingTasks((prev) => new Set([...prev, task.id]));

    try {
      await TaskService.update(task.id, {
        status: newStatus,
        progress: newProgress,
      });
      await loadProject();
      toast.success(
        newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta'
      );
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error.message || 'Erro ao atualizar tarefa');
    } finally {
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }, [user, updatingTasks, loadProject]);

  // ========== NOTES ==========
  const handleCreateNote = () => {
    setNoteMode('create');
    setSelectedNote(null);
    setNoteForm({ title: '', content: '', category: 'general' });
    setNoteDialogOpen(true);
  };

  const handleEditNote = (note: ProjectNote) => {
    setNoteMode('edit');
    setSelectedNote(note);
    setNoteForm({ title: note.title, content: note.content, category: 'general' });
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedProject || !user || !noteForm.title.trim() || !noteForm.content.trim()) {
      toast.error('Preencha título e conteúdo da nota');
      return;
    }

    try {
      if (noteMode === 'create') {
        await ProjectService.createNote(
          { projectId: selectedProject.id, title: noteForm.title, content: noteForm.content },
          user.id
        );
        toast.success('Nota criada com sucesso!');
      } else if (selectedNote) {
        await ProjectService.updateNote(selectedNote.id, {
          title: noteForm.title,
          content: noteForm.content,
        });
        toast.success('Nota atualizada com sucesso!');
      }
      await loadProject();
      setNoteDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      toast.error(error.message || 'Erro ao salvar nota');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await ProjectService.deleteNote(noteToDelete.id);
      toast.success('Nota excluída com sucesso!');
      await loadProject();
      setDeleteNoteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error);
      toast.error(error.message || 'Erro ao excluir nota');
    }
  };

  // ========== DOCUMENTS ==========
  const handleFileUpload = async (files: FileList | null) => {
    if (!selectedProject || !user || !files?.length) return;

    for (const file of Array.from(files)) {
      try {
        setUploadingFile(true);
        await ProjectService.uploadDocument(selectedProject.id, file, user.id);
        toast.success(`${file.name} enviado com sucesso!`);
      } catch (error: any) {
        console.error('Erro ao enviar documento:', error);
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
      }
    }
    setUploadingFile(false);
    await loadProject();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [selectedProject, user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDownloadDocument = async (doc: ProjectDocument) => {
    try {
      const url = await ProjectService.getDocumentUrl(doc.storagePath);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error);
      toast.error(error.message || 'Erro ao baixar documento');
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await ProjectService.deleteDocument(documentToDelete.id);
      toast.success('Documento excluído com sucesso!');
      await loadProject();
      setDeleteDocDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      toast.error(error.message || 'Erro ao excluir documento');
    }
  };

  // ========== COMPUTED VALUES ==========
  const taskStats = useMemo(() => {
    const tasks = selectedProject?.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, progress };
  }, [selectedProject?.tasks]);

  // Agrupar tarefas por categoria (fase do projeto)
  const tasksByPhase = useMemo(() => {
    const tasks = selectedProject?.tasks || [];
    const phases: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      const phaseName = task.category?.name || 'Sem Fase';
      if (!phases[phaseName]) {
        phases[phaseName] = [];
      }
      phases[phaseName].push(task);
    });

    // Ordenar fases
    const orderedPhases: Record<string, Task[]> = {};
    Object.keys(phases)
      .sort((a, b) => {
        // Manter "Sem Fase" no final
        if (a === 'Sem Fase') return 1;
        if (b === 'Sem Fase') return -1;
        return a.localeCompare(b);
      })
      .forEach((key) => {
        orderedPhases[key] = phases[key];
      });

    return orderedPhases;
  }, [selectedProject?.tasks]);

  const filteredTasks = useMemo(() => {
    const tasks = selectedProject?.tasks || [];
    switch (taskFilter) {
      case 'pending':
        return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      case 'overdue':
        return tasks.filter((t) => {
          if (!t.dueDate || t.status === 'completed') return false;
          return new Date(t.dueDate) < new Date();
        });
      default:
        return tasks;
    }
  }, [selectedProject?.tasks, taskFilter]);

  const filteredNotes = useMemo(() => {
    let notes = selectedProject?.notes || [];
    if (notesSearch) {
      const search = notesSearch.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search)
      );
    }
    return notes;
  }, [selectedProject?.notes, notesSearch, notesCategory]);

  const daysRemaining = useMemo(() => {
    if (!selectedProject?.endDate) return null;
    const end = new Date(selectedProject.endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [selectedProject?.endDate]);

  // ========== HELPERS ==========
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

  const getTaskStatusIcon = (task: Task) => {
    if (task.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants: Record<Task['priority'], { label: string; className: string }> = {
      low: {
        label: 'Baixa',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
      medium: {
        label: 'Média',
        className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      },
      high: {
        label: 'Alta',
        className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      },
      urgent: {
        label: 'Urgente',
        className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      },
    };
    const variant = variants[priority];
    return <Badge className={cn('text-xs', variant.className)}>{variant.label}</Badge>;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-8 w-8 text-gray-400" />;
    if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <FileText className="h-8 w-8 text-blue-600" />;
    if (fileType.includes('sheet') || fileType.includes('excel'))
      return <FileText className="h-8 w-8 text-green-600" />;
    return <File className="h-8 w-8 text-gray-400" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando projeto...</div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Projeto não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="shrink-0">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{selectedProject.name}</h1>
              {getStatusBadge(selectedProject.status)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Cliente: {selectedProject.client.companyName}
            </p>
          </div>
        </div>
        {/* Actions - mobile: dropdown, desktop: buttons */}
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <MoreVertical className="h-4 w-4 mr-2" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar Projeto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:grid sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm whitespace-nowrap">
              Tarefas {taskStats.total > 0 && `(${taskStats.completed}/${taskStats.total})`}
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm whitespace-nowrap">
              Notas {selectedProject.notes?.length ? `(${selectedProject.notes.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm whitespace-nowrap">
              Docs {selectedProject.documents?.length ? `(${selectedProject.documents.length})` : ''}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Progresso do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl sm:text-3xl font-bold">{taskStats.progress}%</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {taskStats.completed} de {taskStats.total} tarefas
                  </span>
                </div>
                <Progress value={taskStats.progress} className="h-2 sm:h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <KPIGrid>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{taskStats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Concluídas</p>
                  <p className="text-lg sm:text-2xl font-bold">{taskStats.completed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                  <p className="text-lg sm:text-2xl font-bold">{taskStats.pending}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Atrasadas</p>
                  <p className="text-lg sm:text-2xl font-bold">{taskStats.overdue}</p>
                </div>
              </div>
            </Card>
          </KPIGrid>

          {/* Info Cards */}
          <ResponsiveGrid preset="three">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold text-sm sm:text-base truncate">{selectedProject.client.companyName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedProject.client.contactPerson}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Orçamento</p>
                  <p className="font-semibold text-sm sm:text-base truncate">{formatCurrency(selectedProject.budget)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Período</p>
                  <p className="font-semibold text-xs sm:text-sm truncate">
                    {selectedProject.startDate
                      ? formatDate(selectedProject.startDate)
                      : 'Não definido'}
                    {selectedProject.endDate && ` - ${formatDate(selectedProject.endDate)}`}
                  </p>
                  {daysRemaining !== null && (
                    <p
                      className={cn(
                        'text-xs truncate',
                        daysRemaining < 0
                          ? 'text-red-500'
                          : daysRemaining < 7
                          ? 'text-yellow-500'
                          : 'text-muted-foreground'
                      )}
                    >
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} dias de atraso`
                        : `${daysRemaining} dias restantes`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </ResponsiveGrid>

          {/* Description */}
          {selectedProject.description && (
            <Card className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-2">Descrição</h3>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedProject.description}
              </p>
            </Card>
          )}

          {/* Activity Summary */}
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Resumo de Atividades</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{taskStats.completed}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Concluídas</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {selectedProject.notes?.length || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Notas</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {selectedProject.documents?.length || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Documentos</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ========== TASKS TAB ========== */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            {/* Header with filters */}
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <h2 className="text-base sm:text-lg font-semibold">Tarefas</h2>
                <Badge variant="secondary" className="text-xs">
                  {taskStats.completed}/{taskStats.total}
                </Badge>
              </div>
              <Select
                value={taskFilter}
                onValueChange={(v) => setTaskFilter(v as TaskFilter)}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({taskStats.total})</SelectItem>
                  <SelectItem value="pending">Pendentes ({taskStats.pending})</SelectItem>
                  <SelectItem value="completed">Concluídas ({taskStats.completed})</SelectItem>
                  <SelectItem value="overdue">Atrasadas ({taskStats.overdue})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress Bar */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-muted/30">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm font-medium">Progresso: {taskStats.progress}%</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {taskStats.completed} de {taskStats.total}
                </span>
              </div>
              <Progress value={taskStats.progress} className="h-1.5 sm:h-2" />
            </div>

            {/* Task List by Phase */}
            <div className="divide-y">
              {!filteredTasks.length ? (
                <div className="p-8 sm:p-12 text-center">
                  <ListTodo className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {taskFilter === 'all'
                      ? 'Nenhuma tarefa vinculada a este projeto.'
                      : 'Nenhuma tarefa encontrada com este filtro.'}
                  </p>
                </div>
              ) : (
                Object.entries(tasksByPhase).map(([phaseName, phaseTasks]) => {
                  const filteredPhaseTasks = phaseTasks.filter((t) => {
                    if (taskFilter === 'pending')
                      return t.status === 'pending' || t.status === 'in_progress';
                    if (taskFilter === 'completed') return t.status === 'completed';
                    if (taskFilter === 'overdue') {
                      if (!t.dueDate || t.status === 'completed') return false;
                      return new Date(t.dueDate) < new Date();
                    }
                    return true;
                  });

                  if (filteredPhaseTasks.length === 0) return null;

                  const phaseCompleted = filteredPhaseTasks.filter(
                    (t) => t.status === 'completed'
                  ).length;
                  const phaseTotal = filteredPhaseTasks.length;
                  const phaseProgress =
                    phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
                  const isExpanded = expandedPhases.has('all') || expandedPhases.has(phaseName);

                  return (
                    <div key={phaseName} className="border-b last:border-b-0">
                      {/* Phase Header */}
                      <button
                        onClick={() => togglePhase(phaseName)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          )}
                          <span className="font-medium text-sm sm:text-base truncate">{phaseName}</span>
                          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                            {phaseCompleted}/{phaseTotal}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground w-6 sm:w-8 text-right">
                            {phaseProgress}%
                          </span>
                        </div>
                      </button>

                      {/* Tasks */}
                      {isExpanded && (
                        <div className="divide-y">
                          {filteredPhaseTasks.map((task) => {
                            const isOverdue =
                              task.dueDate &&
                              new Date(task.dueDate) < new Date() &&
                              task.status !== 'completed';
                            const isUpdating = updatingTasks.has(task.id);

                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  'px-3 sm:px-4 py-2.5 sm:py-3 pl-8 sm:pl-12 hover:bg-muted/30 transition-colors',
                                  task.status === 'completed' && 'bg-muted/20',
                                  isOverdue && 'bg-red-50 dark:bg-red-900/10'
                                )}
                              >
                                {/* Mobile: Stack layout, Desktop: Flex layout */}
                                <div className="flex items-start gap-2 sm:gap-4">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => handleToggleTaskStatus(task)}
                                    disabled={isUpdating}
                                    className={cn(
                                      'flex-shrink-0 transition-opacity mt-0.5',
                                      isUpdating && 'opacity-50'
                                    )}
                                  >
                                    {isUpdating ? (
                                      <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <span className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                                        {getTaskStatusIcon(task)}
                                      </span>
                                    )}
                                  </button>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                      <p
                                        className={cn(
                                          'font-medium text-sm sm:text-base',
                                          task.status === 'completed' &&
                                            'line-through text-muted-foreground'
                                        )}
                                      >
                                        {task.title}
                                      </p>
                                      {/* Desktop badges inline */}
                                      <div className="hidden sm:flex items-center gap-2">
                                        {getPriorityBadge(task.priority)}
                                        {task.status === 'completed' && (
                                          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Concluída
                                          </Badge>
                                        )}
                                        {isOverdue && (
                                          <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            Atrasada
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {task.description && (
                                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                        {task.description}
                                      </p>
                                    )}
                                    {/* Mobile: badges and date below */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 sm:hidden">
                                      {getPriorityBadge(task.priority)}
                                      {task.dueDate && (
                                        <div
                                          className={cn(
                                            'flex items-center gap-1 text-[10px]',
                                            isOverdue ? 'text-red-600' : 'text-muted-foreground'
                                          )}
                                        >
                                          <Calendar className="h-3 w-3" />
                                          {formatDate(task.dueDate)}
                                        </div>
                                      )}
                                      {task.status === 'completed' && (
                                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                          Concluída
                                        </Badge>
                                      )}
                                      {isOverdue && (
                                        <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                          Atrasada
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Desktop: Due Date */}
                                  {task.dueDate && (
                                    <div
                                      className={cn(
                                        'hidden sm:flex items-center gap-1 text-xs shrink-0',
                                        isOverdue ? 'text-red-600' : 'text-muted-foreground'
                                      )}
                                    >
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(task.dueDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ========== NOTES TAB ========== */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <div className="p-3 sm:p-4 border-b flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base sm:text-lg font-semibold">Notas do Projeto</h2>
                <Button onClick={handleCreateNote} size={isMobile ? 'sm' : 'default'} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Nova Nota
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notas..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
            <div className="p-3 sm:p-6">
              {!filteredNotes.length ? (
                <div className="text-center py-6 sm:py-8">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {notesSearch ? 'Nenhuma nota encontrada.' : 'Nenhuma nota criada ainda.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{note.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditNote(note)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setNoteToDelete(note);
                                setDeleteNoteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 sm:line-clamp-4">
                        {note.content}
                      </p>
                      <Separator className="my-2 sm:my-3" />
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{note.createdBy.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.createdAt)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ========== DOCUMENTS TAB ========== */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <div className="p-3 sm:p-4 border-b flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h2 className="text-base sm:text-lg font-semibold">Documentos</h2>
                  <div className="flex items-center gap-1 border rounded-md p-0.5 sm:p-1">
                    <Button
                      variant={docViewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      onClick={() => setDocViewMode('list')}
                    >
                      <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant={docViewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      onClick={() => setDocViewMode('grid')}
                    >
                      <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  disabled={uploadingFile}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  size={isMobile ? 'sm' : 'default'}
                  className="w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {uploadingFile ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'mx-3 sm:mx-4 mt-3 sm:mt-4 border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
            >
              <Upload
                className={cn(
                  'h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isDragging
                  ? 'Solte os arquivos aqui...'
                  : isMobile
                    ? 'Toque em "Enviar" para adicionar arquivos'
                    : 'Arraste e solte arquivos aqui ou clique em "Enviar"'}
              </p>
            </div>

            {/* Document List/Grid */}
            <div className="p-3 sm:p-4">
              {!selectedProject.documents || selectedProject.documents.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <FolderIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
                </div>
              ) : docViewMode === 'grid' || isMobile ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {selectedProject.documents.map((doc) => (
                    <Card
                      key={doc.id}
                      className="p-2 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="[&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-8 sm:[&>svg]:w-8">
                          {getFileIcon(doc.fileType)}
                        </span>
                        <p className="text-xs sm:text-sm font-medium mt-1.5 sm:mt-2 line-clamp-2">
                          {doc.originalName}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                          {formatFileSize(doc.fileSize)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentToDelete(doc);
                            setDeleteDocDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Arquivo</TableHead>
                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                        <TableHead className="hidden md:table-cell">Tamanho</TableHead>
                        <TableHead className="hidden lg:table-cell">Enviado por</TableHead>
                        <TableHead className="hidden md:table-cell">Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-8 sm:[&>svg]:w-8 shrink-0">
                                {getFileIcon(doc.fileType)}
                              </span>
                              <span className="font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                                {doc.originalName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                            {doc.fileType?.split('/')[1] || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                            {formatFileSize(doc.fileSize)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                            {doc.uploadedBy.fullName}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDocument(doc)}
                                title="Baixar documento"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDocumentToDelete(doc);
                                  setDeleteDocDialogOpen(true);
                                }}
                                title="Excluir documento"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ProjectDialog
        open={editDialogOpen}
        mode="edit"
        project={selectedProject}
        clients={clients}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
      />

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Tem certeza que deseja excluir o projeto "{selectedProject.name}"? Esta ação não
              pode ser desfeita. Todas as notas e documentos associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {noteMode === 'create' ? 'Nova Nota' : 'Editar Nota'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {noteMode === 'create'
                ? 'Crie uma nova nota para este projeto.'
                : 'Edite as informações da nota.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="note-title" className="text-xs sm:text-sm">Título *</Label>
              <Input
                id="note-title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="Ex: Reunião com cliente"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="note-content" className="text-xs sm:text-sm">Conteúdo *</Label>
              <Textarea
                id="note-content"
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Descreva a nota..."
                rows={isMobile ? 4 : 5}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} className="w-full sm:w-auto">
              {noteMode === 'create' ? 'Criar Nota' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Dialog */}
      <AlertDialog open={deleteNoteDialogOpen} onOpenChange={setDeleteNoteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Excluir Nota</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Tem certeza que deseja excluir a nota "{noteToDelete?.title}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Tem certeza que deseja excluir o documento "{documentToDelete?.originalName}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetail;
