import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Users,
  UserCheck,
  Tag,
  MessageSquare,
  Settings,
  Code,
  FileCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TemplateService, type TemplateWithDetails, type TemplateProject, type TemplateTask } from '@/services/templateService';

// =====================================================
// INTERFACES
// =====================================================

interface TemplatePreviewProps {
  templateId: string;
  onApply?: () => void;
  showActions?: boolean;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getCategoryIcon = (category: string | null) => {
  switch (category) {
    case 'communication':
      return <MessageSquare className="h-3 w-3" />;
    case 'setup':
      return <Settings className="h-3 w-3" />;
    case 'technical':
      return <Code className="h-3 w-3" />;
    case 'review':
      return <FileCheck className="h-3 w-3" />;
    default:
      return <Tag className="h-3 w-3" />;
  }
};

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'communication':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'setup':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'technical':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'review':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getRoleIcon = (role: string | null) => {
  switch (role) {
    case 'team':
      return <Users className="h-3 w-3" />;
    case 'client':
      return <User className="h-3 w-3" />;
    case 'both':
      return <UserCheck className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

const getRoleColor = (role: string | null) => {
  switch (role) {
    case 'team':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case 'client':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    case 'both':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case 'team':
      return 'Equipe';
    case 'client':
      return 'Cliente';
    case 'both':
      return 'Ambos';
    default:
      return 'Não definido';
  }
};

const getCategoryLabel = (category: string | null) => {
  switch (category) {
    case 'communication':
      return 'Comunicação';
    case 'setup':
      return 'Configuração';
    case 'technical':
      return 'Técnica';
    case 'review':
      return 'Revisão';
    default:
      return 'Geral';
  }
};

// =====================================================
// TASK COMPONENT
// =====================================================

const TaskItem: React.FC<{ task: TemplateTask; index: number }> = ({ task, index }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm">
              {task.title}
              {task.isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {task.category && (
            <Badge variant="outline" className={`text-xs ${getCategoryColor(task.category)}`}>
              {getCategoryIcon(task.category)}
              <span className="ml-1">{getCategoryLabel(task.category)}</span>
            </Badge>
          )}

          {task.assignedToRole && (
            <Badge variant="outline" className={`text-xs ${getRoleColor(task.assignedToRole)}`}>
              {getRoleIcon(task.assignedToRole)}
              <span className="ml-1">{getRoleLabel(task.assignedToRole)}</span>
            </Badge>
          )}

          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {task.daysAfterStart === 0 ? 'Dia 0' : `+${task.daysAfterStart} dias`}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PROJECT COMPONENT
// =====================================================

const ProjectItem: React.FC<{
  project: TemplateProject & { tasks: TemplateTask[] };
  index: number
}> = ({ project, index }) => {
  const [isOpen, setIsOpen] = useState(index === 0); // Primeiro projeto aberto por padrão

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="text-left">
                  <CardTitle className="text-base">
                    {project.name}
                    {project.isRequired && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="text-sm mt-1">
                      {project.description}
                    </CardDescription>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {project.estimatedDurationDays && (
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {project.estimatedDurationDays} dias
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {project.tasks.length} tarefas
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="space-y-2">
              {project.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tarefa neste projeto
                </p>
              ) : (
                project.tasks.map((task, taskIndex) => (
                  <TaskItem key={task.id} task={task} index={taskIndex} />
                ))
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateId,
  onApply,
  showActions = false,
}) => {
  const [template, setTemplate] = useState<TemplateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TemplateService.getTemplateWithDetails(templateId);
      setTemplate(data);
    } catch (err) {
      console.error('Erro ao carregar template:', err);
      setError('Erro ao carregar template. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const totalProjects = template?.projects.length || 0;
  const totalTasks = template?.projects.reduce((sum, p) => sum + p.tasks.length, 0) || 0;
  const requiredProjects = template?.projects.filter(p => p.isRequired).length || 0;
  const requiredTasks = template?.projects.reduce(
    (sum, p) => sum + p.tasks.filter(t => t.isRequired).length,
    0
  ) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Carregando template...
        </span>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-sm font-medium">{error || 'Template não encontrado'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={loadTemplate}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          {template.description && (
            <p className="text-muted-foreground mt-2">{template.description}</p>
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {totalProjects} {totalProjects === 1 ? 'projeto' : 'projetos'}
            {requiredProjects > 0 && ` (${requiredProjects} obrigatórios)`}
          </Badge>
          <Badge variant="secondary">
            {totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'}
            {requiredTasks > 0 && ` (${requiredTasks} obrigatórias)`}
          </Badge>
          {template.color && (
            <Badge
              variant="outline"
              style={{
                backgroundColor: `var(--${template.color})`,
                opacity: 0.8
              }}
            >
              {template.icon || 'Template'}
            </Badge>
          )}
        </div>

        {showActions && onApply && (
          <div className="flex gap-2">
            <Button onClick={onApply} size="sm">
              Aplicar Template
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Projects List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Projetos e Tarefas</h3>

        {template.projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-sm text-muted-foreground text-center">
                Este template ainda não possui projetos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {template.projects.map((project, index) => (
              <ProjectItem key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
