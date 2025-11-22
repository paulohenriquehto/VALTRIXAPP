import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects, useClients, useAuth } from '../stores/appStore';
import { ProjectService } from '../services';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ProjectDialog from '../components/ProjectDialog';
import type { Project, ProjectNote, ProjectDocument } from '../types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useProjects();
  const { clients } = useClients();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ProjectNote | null>(null);
  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ProjectDocument | null>(null);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);

  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [noteMode, setNoteMode] = useState<'create' | 'edit'>('create');
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

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

  // ========== NOTES ==========
  const handleCreateNote = () => {
    setNoteMode('create');
    setSelectedNote(null);
    setNoteForm({ title: '', content: '' });
    setNoteDialogOpen(true);
  };

  const handleEditNote = (note: ProjectNote) => {
    setNoteMode('edit');
    setSelectedNote(note);
    setNoteForm({ title: note.title, content: note.content });
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !user || !e.target.files?.length) return;

    const file = e.target.files[0];
    try {
      setUploadingFile(true);
      await ProjectService.uploadDocument(selectedProject.id, file, user.id);
      toast.success('Documento enviado com sucesso!');
      await loadProject();
    } catch (error: any) {
      console.error('Erro ao enviar documento:', error);
      toast.error(error.message || 'Erro ao enviar documento');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

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
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
            <p className="text-sm text-muted-foreground">
              Cliente: {selectedProject.client.companyName}
            </p>
          </div>
          {getStatusBadge(selectedProject.status)}
        </div>
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">
            Tarefas {selectedProject.tasks?.length ? `(${selectedProject.tasks.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notas {selectedProject.notes?.length ? `(${selectedProject.notes.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documentos {selectedProject.documents?.length ? `(${selectedProject.documents.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedProject.client.companyName}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orçamento</p>
                  <p className="font-semibold">{formatCurrency(selectedProject.budget)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-semibold text-sm">
                    {selectedProject.startDate ? formatDate(selectedProject.startDate) : 'Não definido'}
                    {selectedProject.endDate && ` - ${formatDate(selectedProject.endDate)}`}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {selectedProject.description && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{selectedProject.description}</p>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            {!selectedProject.tasks || selectedProject.tasks.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Nenhuma tarefa vinculada a este projeto.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProject.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.priority}</Badge>
                      </TableCell>
                      <TableCell>{task.assignee?.fullName || 'Não atribuída'}</TableCell>
                      <TableCell>{task.dueDate ? formatDate(task.dueDate) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notas do Projeto</h2>
              <Button onClick={handleCreateNote}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Nota
              </Button>
            </div>
            <div className="p-6">
              {!selectedProject.notes || selectedProject.notes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma nota criada ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProject.notes.map((note) => (
                    <Card key={note.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{note.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditNote(note)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNoteToDelete(note);
                              setDeleteNoteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Por {note.createdBy.fullName} em {formatDate(note.createdAt)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Documentos do Projeto</h2>
              <Button disabled={uploadingFile} onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadingFile ? 'Enviando...' : 'Enviar Documento'}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <div className="overflow-x-auto">
              {!selectedProject.documents || selectedProject.documents.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum documento enviado ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Arquivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Enviado por</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProject.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.originalName}</TableCell>
                        <TableCell>{doc.fileType || 'N/A'}</TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{doc.uploadedBy.fullName}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Baixar documento"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setDeleteDocDialogOpen(true);
                              }}
                              title="Excluir documento"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{selectedProject.name}"? Esta ação não
              pode ser desfeita. Todas as notas e documentos associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noteMode === 'create' ? 'Nova Nota' : 'Editar Nota'}</DialogTitle>
            <DialogDescription>
              {noteMode === 'create'
                ? 'Crie uma nova nota para este projeto.'
                : 'Edite as informações da nota.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Título *</Label>
              <Input
                id="note-title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="Ex: Reunião com cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo *</Label>
              <Textarea
                id="note-content"
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Descreva a nota..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote}>
              {noteMode === 'create' ? 'Criar Nota' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Dialog */}
      <AlertDialog open={deleteNoteDialogOpen} onOpenChange={setDeleteNoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a nota "{noteToDelete?.title}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.originalName}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
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

export default ProjectDetail;
