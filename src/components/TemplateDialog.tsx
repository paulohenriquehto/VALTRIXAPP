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
import { Switch } from '@/components/ui/switch';
import type { ServiceTemplate } from '../services/templateService';

// =====================================================
// TYPES
// =====================================================

interface TemplateDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  template?: ServiceTemplate | null;
  onClose: () => void;
  onSave: (template: Partial<ServiceTemplate>) => void;
}

type ServiceType =
  | 'web_development'
  | 'software_development'
  | 'bug_fixing'
  | 'landing_pages'
  | 'microsites'
  | 'web_design'
  | 'ui_ux_design'
  | 'chatbot'
  | 'website_automation'
  | 'n8n_automation'
  | 'defy_automation'
  | 'agno_automation'
  | 'langchain_automation'
  | 'traffic_management'
  | 'seo'
  | 'consulting'
  | 'maintenance'
  | 'other';

// =====================================================
// CONSTANTS
// =====================================================

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  web_development: 'Desenvolvimento Web',
  software_development: 'Desenvolvimento de Software',
  bug_fixing: 'Correção de Bugs',
  landing_pages: 'Landing Pages',
  microsites: 'Microsites',
  web_design: 'Web Design',
  ui_ux_design: 'UI/UX Design',
  chatbot: 'Chatbot',
  website_automation: 'Automação de Sites',
  n8n_automation: 'Automação com n8n',
  defy_automation: 'Automação com DeFy',
  agno_automation: 'Automação com agno',
  langchain_automation: 'Automação com LangChain',
  traffic_management: 'Gestão de Tráfego',
  seo: 'SEO',
  consulting: 'Consultoria',
  maintenance: 'Manutenção',
  other: 'Outro',
};

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'red', label: 'Vermelho' },
  { value: 'purple', label: 'Roxo' },
  { value: 'pink', label: 'Rosa' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'cyan', label: 'Ciano' },
  { value: 'orange', label: 'Laranja' },
  { value: 'gray', label: 'Cinza' },
];

const ICON_OPTIONS = [
  { value: 'FileText', label: 'FileText' },
  { value: 'Code', label: 'Code' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Wrench', label: 'Wrench' },
  { value: 'Zap', label: 'Zap' },
  { value: 'Bot', label: 'Bot' },
  { value: 'Brain', label: 'Brain' },
  { value: 'TrendingUp', label: 'TrendingUp' },
  { value: 'Search', label: 'Search' },
  { value: 'Settings', label: 'Settings' },
  { value: 'LifeBuoy', label: 'LifeBuoy' },
  { value: 'MessageSquare', label: 'MessageSquare' },
];

// =====================================================
// COMPONENT
// =====================================================

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  mode,
  template,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    serviceType: '' as ServiceType | '',
    description: '',
    icon: '',
    color: '',
    isActive: true,
  });

  useEffect(() => {
    if (mode === 'edit' && template) {
      setFormData({
        name: template.name,
        serviceType: template.serviceType as ServiceType,
        description: template.description || '',
        icon: template.icon || '',
        color: template.color || '',
        isActive: template.isActive,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        serviceType: '',
        description: '',
        icon: '',
        color: '',
        isActive: true,
      });
    }
  }, [mode, template, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.serviceType) {
      return;
    }

    const templateData: Partial<ServiceTemplate> = {
      name: formData.name.trim(),
      serviceType: formData.serviceType,
      description: formData.description.trim() || null,
      icon: formData.icon || null,
      color: formData.color || null,
      isActive: formData.isActive,
    };

    if (mode === 'edit' && template) {
      templateData.id = template.id;
    }

    onSave(templateData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Template' : 'Editar Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie um novo template de onboarding para um tipo de serviço.'
              : 'Edite as informações do template.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Desenvolvimento Web Completo"
              required
            />
          </div>

          {/* Tipo de Serviço */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Serviço *</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData({ ...formData, serviceType: value as ServiceType })
              }
              disabled={mode === 'edit'} // Não permitir alterar o tipo em edição
            >
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                O tipo de serviço não pode ser alterado após a criação
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva o propósito e conteúdo deste template..."
              rows={3}
            />
          </div>

          {/* Grid com Icon e Color */}
          <div className="grid grid-cols-2 gap-4">
            {/* Ícone */}
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger id="icon">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="cursor-pointer">
                Template Ativo
              </Label>
              <p className="text-sm text-muted-foreground">
                Templates inativos não serão aplicados em novos clientes
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Criar Template' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
