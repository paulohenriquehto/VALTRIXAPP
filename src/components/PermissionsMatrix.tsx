import React, { useState } from 'react';
import type { Permissions, ModulePermission, TeamRole } from '../types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDefaultPermissions } from '../utils/permissions';
import {
  Shield,
  Eye,
  Plus,
  Edit,
  Trash2,
  Database,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Tag,
  Calendar as CalendarIcon,
  LayoutDashboard,
} from 'lucide-react';

interface PermissionsMatrixProps {
  permissions: Permissions;
  onChange: (permissions: Permissions) => void;
  editable?: boolean;
  showTemplates?: boolean;
}

const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  permissions,
  onChange,
  editable = true,
  showTemplates = true,
}) => {
  const [localPermissions, setLocalPermissions] = useState<Permissions>(permissions);

  // Atualiza permissões locais e chama callback
  const updatePermissions = (newPermissions: Permissions) => {
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  // Aplica template de permissões
  const applyTemplate = (role: TeamRole) => {
    const template = getDefaultPermissions(role);
    updatePermissions(template);
  };

  // Atualiza permissão de um módulo específico
  const updateModulePermission = (
    module: keyof Permissions['modules'],
    action: keyof ModulePermission,
    value: boolean
  ) => {
    updatePermissions({
      ...localPermissions,
      modules: {
        ...localPermissions.modules,
        [module]: {
          ...localPermissions.modules[module],
          [action]: value,
        },
      },
    });
  };

  // Atualiza permissão administrativa
  const updateAdminPermission = (
    permission: keyof Permissions['admin'],
    value: boolean
  ) => {
    updatePermissions({
      ...localPermissions,
      admin: {
        ...localPermissions.admin,
        [permission]: value,
      },
    });
  };

  // Atualiza escopo de dados
  const updateDataScope = (scope: 'all' | 'team' | 'own') => {
    updatePermissions({
      ...localPermissions,
      dataScope: scope,
    });
  };

  // Define os módulos e seus ícones
  const modules: Array<{
    key: keyof Permissions['modules'];
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'tasks', label: 'Tarefas', icon: <FileText className="h-4 w-4" /> },
    { key: 'clients', label: 'Clientes', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'calendar', label: 'Calendário', icon: <CalendarIcon className="h-4 w-4" /> },
    { key: 'team', label: 'Equipe', icon: <Users className="h-4 w-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'tags', label: 'Tags', icon: <Tag className="h-4 w-4" /> },
    { key: 'settings', label: 'Configurações', icon: <Settings className="h-4 w-4" /> },
  ];

  const actions: Array<{ key: keyof ModulePermission; label: string; icon: React.ReactNode }> = [
    { key: 'view', label: 'Ver', icon: <Eye className="h-4 w-4" /> },
    { key: 'create', label: 'Criar', icon: <Plus className="h-4 w-4" /> },
    { key: 'edit', label: 'Editar', icon: <Edit className="h-4 w-4" /> },
    { key: 'delete', label: 'Deletar', icon: <Trash2 className="h-4 w-4" /> },
  ];

  const adminPermissions: Array<{
    key: keyof Permissions['admin'];
    label: string;
    description: string;
  }> = [
    {
      key: 'manageUsers',
      label: 'Gerenciar Usuários',
      description: 'Adicionar, editar e remover usuários',
    },
    {
      key: 'manageRoles',
      label: 'Gerenciar Cargos',
      description: 'Atribuir e modificar cargos',
    },
    {
      key: 'managePermissions',
      label: 'Gerenciar Permissões',
      description: 'Modificar permissões de outros usuários',
    },
    {
      key: 'viewReports',
      label: 'Ver Relatórios',
      description: 'Acessar relatórios e analytics avançados',
    },
    {
      key: 'exportData',
      label: 'Exportar Dados',
      description: 'Exportar dados do sistema',
    },
    {
      key: 'manageBilling',
      label: 'Gerenciar Cobrança',
      description: 'Acessar e gerenciar informações de pagamento',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Templates de Permissões */}
      {showTemplates && editable && (
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Templates de Permissões</Label>
            <p className="text-xs text-muted-foreground">
              Aplique um template baseado no cargo para configurar rapidamente as permissões.
            </p>
            <Select onValueChange={(value) => applyTemplate(value as TeamRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceo">CEO - Acesso Total</SelectItem>
                <SelectItem value="c_level">C-Level - Executivo</SelectItem>
                <SelectItem value="director">Diretor - Amplo</SelectItem>
                <SelectItem value="manager">Gerente - Equipe</SelectItem>
                <SelectItem value="team_lead">Tech Lead - Técnico</SelectItem>
                <SelectItem value="senior">Sênior - Colaborador</SelectItem>
                <SelectItem value="mid_level">Pleno - Básico</SelectItem>
                <SelectItem value="junior">Júnior - Limitado</SelectItem>
                <SelectItem value="intern">Estagiário - Mínimo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Escopo de Dados */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <Label className="text-sm font-semibold">Escopo de Dados</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Define quais dados o usuário pode visualizar e gerenciar.
          </p>
          <div className="flex gap-2">
            <Button
              variant={localPermissions.dataScope === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateDataScope('all')}
              disabled={!editable}
            >
              Todos
            </Button>
            <Button
              variant={localPermissions.dataScope === 'team' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateDataScope('team')}
              disabled={!editable}
            >
              Equipe
            </Button>
            <Button
              variant={localPermissions.dataScope === 'own' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateDataScope('own')}
              disabled={!editable}
            >
              Próprio
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {localPermissions.dataScope === 'all' && '✓ Pode ver e gerenciar todos os dados'}
            {localPermissions.dataScope === 'team' && '✓ Pode ver e gerenciar dados da equipe'}
            {localPermissions.dataScope === 'own' && '✓ Pode ver e gerenciar apenas próprios dados'}
          </div>
        </div>
      </Card>

      {/* Permissões por Módulo */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <Label className="text-sm font-semibold">Permissões por Módulo</Label>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-5 gap-2 mb-2 pb-2 border-b">
                <div className="font-medium text-xs">Módulo</div>
                {actions.map((action) => (
                  <div key={action.key} className="text-center font-medium text-xs">
                    <div className="flex items-center justify-center gap-1">
                      {action.icon}
                      {action.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Linhas de permissões */}
              {modules.map((module) => (
                <div key={module.key} className="grid grid-cols-5 gap-2 py-3 border-b items-center">
                  <div className="flex items-center gap-2 text-sm">
                    {module.icon}
                    {module.label}
                  </div>
                  {actions.map((action) => (
                    <div key={action.key} className="flex justify-center">
                      <Checkbox
                        checked={localPermissions.modules[module.key][action.key]}
                        onCheckedChange={(checked) =>
                          updateModulePermission(module.key, action.key, checked as boolean)
                        }
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Permissões Administrativas */}
      <Card className="p-4">
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Permissões Administrativas</Label>
          <div className="space-y-3">
            {adminPermissions.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{perm.label}</div>
                  <div className="text-xs text-muted-foreground">{perm.description}</div>
                </div>
                <Switch
                  checked={localPermissions.admin[perm.key]}
                  onCheckedChange={(checked) => updateAdminPermission(perm.key, checked)}
                  disabled={!editable}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PermissionsMatrix;
