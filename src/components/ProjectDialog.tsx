import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project, Client, ProjectStatus } from '../types';

interface ProjectDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  project?: Project | null;
  clients: Client[];
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
}

const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  mode,
  project,
  clients,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    status: 'planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    budget: '',
    deadline: '',
    notifyDaysBefore: '3',
  });

  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        clientId: project.client.id,
        status: project.status,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split('T')[0]
          : '',
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split('T')[0]
          : '',
        budget: project.budget.toString(),
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().split('T')[0]
          : '',
        notifyDaysBefore: (project.notifyDaysBefore ?? 3).toString(),
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        clientId: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        budget: '0',
        deadline: '',
        notifyDaysBefore: '3',
      });
    }
  }, [mode, project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.clientId) {
      return;
    }

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    if (!selectedClient) return;

    const projectData: Partial<Project> = {
      name: formData.name,
      description: formData.description || undefined,
      client: selectedClient,
      status: formData.status,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      budget: parseFloat(formData.budget) || 0,
      deadline: formData.deadline || undefined,
      notifyDaysBefore: parseInt(formData.notifyDaysBefore) || 3,
    };

    if (mode === 'edit' && project) {
      projectData.id = project.id;
    }

    onSave(projectData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Projeto' : 'Editar Projeto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie um novo projeto vinculado a um cliente.'
              : 'Edite as informações do projeto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Desenvolvimento de Sistema de Gestão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o projeto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ProjectStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="on_hold">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento (R$)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Campos de Prazo de Entrega */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Prazo de Entrega</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Data Limite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifyDaysBefore">Notificar (dias antes)</Label>
                <Select
                  value={formData.notifyDaysBefore}
                  onValueChange={(value) => setFormData({ ...formData, notifyDaysBefore: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="2">2 dias antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="5">5 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                    <SelectItem value="14">14 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Criar Projeto' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDialog;
