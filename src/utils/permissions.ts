import type {
  TeamMember,
  TeamRole,
  Permissions,
  ModulePermission,
} from '../types';

/**
 * Obtém o nível numérico de um cargo (1 = CEO, 9 = Intern)
 */
export function getRoleLevel(role: TeamRole): number {
  const levels: Record<TeamRole, number> = {
    ceo: 1,
    c_level: 2,
    director: 3,
    manager: 4,
    team_lead: 5,
    senior: 6,
    mid_level: 7,
    junior: 8,
    intern: 9,
  };
  return levels[role];
}

/**
 * Obtém o label em português de um cargo
 */
export function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    ceo: 'CEO',
    c_level: 'C-Level',
    director: 'Diretor(a)',
    manager: 'Gerente',
    team_lead: 'Tech Lead',
    senior: 'Sênior',
    mid_level: 'Pleno',
    junior: 'Júnior',
    intern: 'Estagiário(a)',
  };
  return labels[role];
}

/**
 * Obtém o label em português de um departamento
 */
export function getDepartmentLabel(dept: string): string {
  const labels: Record<string, string> = {
    engineering: 'Engenharia',
    product: 'Produto',
    design: 'Design',
    marketing: 'Marketing',
    sales: 'Vendas',
    customer_success: 'Customer Success',
    finance: 'Financeiro',
    hr: 'RH',
    operations: 'Operações',
    other: 'Outro',
  };
  return labels[dept] || dept;
}

/**
 * Verifica se um membro tem permissão em um módulo específico
 */
export function hasModulePermission(
  member: TeamMember,
  module: keyof Permissions['modules'],
  action: keyof ModulePermission
): boolean {
  return member.permissions.modules[module][action];
}

/**
 * Verifica se um membro tem uma permissão administrativa
 */
export function hasAdminPermission(
  member: TeamMember,
  permission: keyof Permissions['admin']
): boolean {
  return member.permissions.admin[permission];
}

/**
 * Verifica se o usuário atual pode gerenciar outro membro
 * CEO pode gerenciar todos
 * Gerentes podem gerenciar apenas subordinados diretos de nível inferior
 */
export function canManageMember(
  currentUser: TeamMember,
  targetMember: TeamMember
): boolean {
  // CEO pode gerenciar todos
  if (currentUser.role === 'ceo') {
    return true;
  }

  // Não pode gerenciar a si mesmo
  if (currentUser.id === targetMember.id) {
    return false;
  }

  // Não pode gerenciar superiores ou pares
  const currentLevel = getRoleLevel(currentUser.role);
  const targetLevel = getRoleLevel(targetMember.role);

  if (targetLevel <= currentLevel) {
    return false;
  }

  // Pode gerenciar subordinados diretos
  return currentUser.subordinates.includes(targetMember.id);
}

/**
 * Verifica se o usuário pode modificar permissões
 */
export function canModifyPermissions(member: TeamMember): boolean {
  return member.permissions.admin.managePermissions;
}

/**
 * Verifica se o usuário pode atribuir cargos
 */
export function canAssignRoles(member: TeamMember): boolean {
  return member.permissions.admin.manageRoles;
}

/**
 * Cria um objeto de permissão vazio
 */
export function createEmptyModulePermission(): ModulePermission {
  return {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };
}

/**
 * Cria um objeto de permissão completa
 */
export function createFullModulePermission(): ModulePermission {
  return {
    view: true,
    create: true,
    edit: true,
    delete: true,
  };
}

/**
 * Templates de permissões padrão por cargo
 */
export const permissionTemplates: Record<TeamRole, Permissions> = {
  // CEO - Acesso total a tudo
  ceo: {
    modules: {
      dashboard: createFullModulePermission(),
      tasks: createFullModulePermission(),
      clients: createFullModulePermission(),
      calendar: createFullModulePermission(),
      team: createFullModulePermission(),
      analytics: createFullModulePermission(),
      tags: createFullModulePermission(),
      settings: createFullModulePermission(),
    },
    admin: {
      manageUsers: true,
      manageRoles: true,
      managePermissions: true,
      viewReports: true,
      exportData: true,
      manageBilling: true,
    },
    dataScope: 'all',
  },

  // C-Level - Quase acesso total, sem gerenciar permissões
  c_level: {
    modules: {
      dashboard: createFullModulePermission(),
      tasks: createFullModulePermission(),
      clients: createFullModulePermission(),
      calendar: createFullModulePermission(),
      team: { view: true, create: true, edit: true, delete: false },
      analytics: createFullModulePermission(),
      tags: createFullModulePermission(),
      settings: { view: true, create: false, edit: true, delete: false },
    },
    admin: {
      manageUsers: true,
      manageRoles: true,
      managePermissions: false,
      viewReports: true,
      exportData: true,
      manageBilling: true,
    },
    dataScope: 'all',
  },

  // Director - Acesso amplo, sem billing
  director: {
    modules: {
      dashboard: createFullModulePermission(),
      tasks: createFullModulePermission(),
      clients: createFullModulePermission(),
      calendar: createFullModulePermission(),
      team: { view: true, create: true, edit: true, delete: false },
      analytics: { view: true, create: false, edit: false, delete: false },
      tags: createFullModulePermission(),
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: true,
      manageRoles: false,
      managePermissions: false,
      viewReports: true,
      exportData: true,
      manageBilling: false,
    },
    dataScope: 'all',
  },

  // Manager - Gerencia equipe e tarefas
  manager: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: createFullModulePermission(),
      clients: { view: true, create: true, edit: true, delete: false },
      calendar: createFullModulePermission(),
      team: { view: true, create: false, edit: true, delete: false },
      analytics: { view: true, create: false, edit: false, delete: false },
      tags: { view: true, create: true, edit: true, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: true,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'team',
  },

  // Team Lead - Líder técnico, sem gerenciar pessoas
  team_lead: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: createFullModulePermission(),
      clients: { view: true, create: false, edit: true, delete: false },
      calendar: createFullModulePermission(),
      team: { view: true, create: false, edit: false, delete: false },
      analytics: { view: true, create: false, edit: false, delete: false },
      tags: { view: true, create: true, edit: true, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: false,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'team',
  },

  // Senior - Colaborador sênior
  senior: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: true },
      clients: { view: true, create: false, edit: false, delete: false },
      calendar: { view: true, create: true, edit: true, delete: true },
      team: { view: true, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      tags: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: false,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'own',
  },

  // Mid-Level - Colaborador pleno
  mid_level: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      clients: { view: true, create: false, edit: false, delete: false },
      calendar: { view: true, create: true, edit: true, delete: true },
      team: { view: true, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      tags: { view: true, create: true, edit: false, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: false,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'own',
  },

  // Junior - Colaborador júnior
  junior: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      clients: { view: false, create: false, edit: false, delete: false },
      calendar: { view: true, create: true, edit: true, delete: false },
      team: { view: true, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      tags: { view: true, create: false, edit: false, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: false,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'own',
  },

  // Intern - Estagiário (acesso muito limitado)
  intern: {
    modules: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: false, delete: false },
      clients: { view: false, create: false, edit: false, delete: false },
      calendar: { view: true, create: true, edit: false, delete: false },
      team: { view: true, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      tags: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
    admin: {
      manageUsers: false,
      manageRoles: false,
      managePermissions: false,
      viewReports: false,
      exportData: false,
      manageBilling: false,
    },
    dataScope: 'own',
  },
};

/**
 * Obtém as permissões padrão de um cargo
 */
export function getDefaultPermissions(role: TeamRole): Permissions {
  return JSON.parse(JSON.stringify(permissionTemplates[role]));
}

/**
 * Compara duas permissões e retorna se são iguais
 */
export function arePermissionsEqual(p1: Permissions, p2: Permissions): boolean {
  return JSON.stringify(p1) === JSON.stringify(p2);
}
