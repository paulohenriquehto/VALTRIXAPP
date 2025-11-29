import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import TagSelector from './TagSelector';
import CategorySelector from './CategorySelector';
import { Briefcase } from 'lucide-react';
import type { Task, Category, Tag, Project } from '../types';

interface TaskDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  task?: Task | null;
  categories: Category[];
  tags: Tag[];
  projects?: Project[];
  preselectedProject?: Project | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  mode,
  task,
  categories,
  tags,
  projects = [],
  preselectedProject,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    category: null as Category | null,
    project: null as Project | null,
    tags: [] as Tag[],
  });

  // Filtrar apenas projetos ativos
  const activeProjects = useMemo(() =>
    projects.filter(p => p.status === 'active' || p.status === 'planning'),
    [projects]
  );

  useEffect(() => {
    if (mode === 'edit' && task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        category: task.category || null,
        project: task.project || null,
        tags: task.tags || [],
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        category: null,
        project: preselectedProject || null,
        tags: [],
      });
    }
  }, [mode, task, open, preselectedProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    const taskData: Partial<Task> = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      category: formData.category || undefined,
      project: formData.project || undefined,
      tags: formData.tags,
    };

    if (mode === 'edit' && task) {
      taskData.id = task.id;
    }

    onSave(taskData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie uma nova tarefa preenchendo os campos abaixo.'
              : 'Edite os detalhes da tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da tarefa"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Digite a descrição da tarefa"
              rows={3}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <CategorySelector
              categories={categories}
              selectedCategory={formData.category}
              onCategoryChange={(category) => setFormData({ ...formData, category })}
            />
          </div>

          {/* Projeto (opcional) */}
          {activeProjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Projeto (opcional)</Label>
              <Select
                value={formData.project?.id || 'none'}
                onValueChange={(value) => {
                  const project = value === 'none' ? null : activeProjects.find(p => p.id === value) || null;
                  setFormData({ ...formData, project });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um projeto (opcional)">
                    {formData.project ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.project.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({formData.project.client?.companyName})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nenhum projeto</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Nenhum projeto (tarefa pessoal)</span>
                  </SelectItem>
                  {activeProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({p.client?.companyName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincule a tarefa a um projeto ou deixe em branco para tarefa pessoal
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagSelector
              tags={tags}
              selectedTags={formData.tags}
              onTagsChange={(tags) => setFormData({ ...formData, tags })}
            />
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as Task['status'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as Task['priority'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                mode === 'create' ? 'Criar Tarefa' : 'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
