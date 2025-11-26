import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/appStore';
import { TemplateService, type ServiceTemplate } from '../services/templateService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Loader2,
  Search,
  Eye,
  Pencil,
  Trash2,
  FileText,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { TemplatePreview } from '../components/TemplatePreview';
import TemplateDialog from '../components/TemplateDialog';
import TemplateEditor from '../components/TemplateEditor';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados principais
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('active');

  // Estados de dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ServiceTemplate | null>(null);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<ServiceTemplate | null>(null);
  const [editorSheetOpen, setEditorSheetOpen] = useState(false);
  const [selectedTemplateForEditor, setSelectedTemplateForEditor] = useState<string | null>(null);

  // Carregar templates na inicialização
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await TemplateService.getAllServiceTemplates();
      setTemplates(data);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
      toast.error(error.message || 'Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filtro por status (tabs)
    if (activeTab === 'active') {
      filtered = filtered.filter(t => t.isActive);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(t => !t.isActive);
    }

    // Filtro por busca
    if (searchText.trim() !== '') {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.serviceType.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [templates, activeTab, searchText]);

  // Handlers
  const handleCreateTemplate = () => {
    setTemplateDialogMode('create');
    setSelectedTemplateForEdit(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: ServiceTemplate) => {
    setTemplateDialogMode('edit');
    setSelectedTemplateForEdit(template);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async (templateData: Partial<ServiceTemplate>) => {
    try {
      if (templateDialogMode === 'create') {
        await TemplateService.createServiceTemplate(templateData);
        toast.success('Template criado com sucesso');
      } else {
        if (!selectedTemplateForEdit) return;
        await TemplateService.updateServiceTemplate(
          selectedTemplateForEdit.id,
          templateData
        );
        toast.success('Template atualizado com sucesso');
      }
      await loadTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await TemplateService.deleteServiceTemplate(templateToDelete.id);
      toast.success('Template excluído com sucesso');
      await loadTemplates();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast.error(error.message || 'Erro ao excluir template');
    }
  };

  const handleToggleActive = async (template: ServiceTemplate) => {
    try {
      await TemplateService.updateServiceTemplate(template.id, {
        isActive: !template.isActive,
      });
      toast.success(
        template.isActive ? 'Template desativado' : 'Template ativado'
      );
      await loadTemplates();
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error);
      toast.error(error.message || 'Erro ao atualizar template');
    }
  };

  const openDeleteDialog = (template: ServiceTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const openPreviewSheet = (templateId: string) => {
    setSelectedTemplateForPreview(templateId);
    setPreviewSheetOpen(true);
  };

  const openEditorSheet = (templateId: string) => {
    setSelectedTemplateForEditor(templateId);
    setEditorSheetOpen(true);
  };

  // Componente de loading skeleton
  const SkeletonCard = () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-16 ml-4" />
        </div>
      </CardHeader>
    </Card>
  );

  // Componente de card de template
  const TemplateCard: React.FC<{ template: ServiceTemplate }> = ({ template }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {!template.isActive && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Inativo
                  </Badge>
                )}
              </div>
              {template.description && (
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {template.serviceType}
                </Badge>
                {template.icon && (
                  <Badge variant="outline" className="text-xs">
                    {template.icon}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPreviewSheet(template.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditTemplate(template)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Info
              </Button>
              <Button
                size="sm"
                onClick={() => openEditorSheet(template.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Editar Fases
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(template)}
                title={template.isActive ? 'Desativar' : 'Ativar'}
              >
                {template.isActive ? (
                  <ToggleRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(template)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Templates de Onboarding
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os templates de onboarding para diferentes tipos de serviços
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <Separator />
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates por nome, descrição ou tipo..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="active">
              Ativos ({templates.filter(t => t.isActive).length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inativos ({templates.filter(t => !t.isActive).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Todos ({templates.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchText.trim() !== ''
                ? 'Nenhum template encontrado'
                : 'Nenhum template disponível'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchText.trim() !== ''
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro template de onboarding'}
            </p>
            {searchText.trim() === '' && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Dialog de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              <br />
              <br />
              <strong className="text-red-600">
                Atenção: Isso irá excluir permanentemente todos os projetos e tarefas
                associados a este template.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet de preview */}
      <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Visualizar Template</SheetTitle>
            <SheetDescription>
              Pre-visualizacao da estrutura completa do template
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedTemplateForPreview && (
              <TemplatePreview
                templateId={selectedTemplateForPreview}
                showActions={false}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de editor de fases/tarefas */}
      <Sheet open={editorSheetOpen} onOpenChange={setEditorSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Fases e Tarefas</SheetTitle>
            <SheetDescription>
              Gerencie as fases e tarefas do template de onboarding
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedTemplateForEditor && (
              <TemplateEditor
                templateId={selectedTemplateForEditor}
                onClose={() => setEditorSheetOpen(false)}
                onSaved={loadTemplates}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de criar/editar template */}
      <TemplateDialog
        open={templateDialogOpen}
        mode={templateDialogMode}
        template={selectedTemplateForEdit}
        onClose={() => setTemplateDialogOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default Templates;
