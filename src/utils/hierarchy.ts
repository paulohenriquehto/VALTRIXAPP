import type { TeamMember, OrgChartNode } from '../types';
import { getRoleLevel } from './permissions';

/**
 * Constrói a árvore hierárquica completa a partir dos membros
 * Retorna o nó raiz (CEO)
 */
export function buildOrgChart(members: TeamMember[]): OrgChartNode | null {
  // Encontra o CEO (raiz da árvore)
  const ceo = members.find((m) => m.role === 'ceo');

  if (!ceo) {
    return null;
  }

  return buildNode(ceo, members);
}

/**
 * Constrói recursivamente um nó da árvore hierárquica
 */
function buildNode(member: TeamMember, allMembers: TeamMember[]): OrgChartNode {
  // Encontra todos os subordinados diretos
  const subordinates = allMembers.filter((m) => m.managerId === member.id);

  // Ordena subordinados por nível hierárquico (menor nível primeiro)
  subordinates.sort((a, b) => {
    const levelDiff = getRoleLevel(a.role) - getRoleLevel(b.role);
    if (levelDiff !== 0) return levelDiff;
    // Se mesmo nível, ordena por nome
    return a.user.fullName.localeCompare(b.user.fullName);
  });

  return {
    member,
    children: subordinates.map((sub) => buildNode(sub, allMembers)),
  };
}

/**
 * Obtém o caminho hierárquico de um membro até o CEO
 * Retorna array [CEO, ..., Manager, Membro]
 */
export function getHierarchyPath(
  memberId: string,
  members: TeamMember[]
): TeamMember[] {
  const path: TeamMember[] = [];
  let current = members.find((m) => m.id === memberId);

  while (current) {
    path.unshift(current);
    current = current.managerId
      ? members.find((m) => m.id === current!.managerId)
      : undefined;
  }

  return path;
}

/**
 * Obtém todos os subordinados (diretos e indiretos) de um membro
 */
export function getAllSubordinates(
  memberId: string,
  members: TeamMember[]
): TeamMember[] {
  const result: TeamMember[] = [];
  const member = members.find((m) => m.id === memberId);

  if (!member) return result;

  // Encontra subordinados diretos
  const directSubs = members.filter((m) => m.managerId === memberId);

  for (const sub of directSubs) {
    result.push(sub);
    // Adiciona subordinados indiretos recursivamente
    result.push(...getAllSubordinates(sub.id, members));
  }

  return result;
}

/**
 * Verifica se um membro é subordinado (direto ou indireto) de outro
 */
export function isSubordinate(
  potentialSubordinate: TeamMember,
  potentialManager: TeamMember,
  allMembers: TeamMember[]
): boolean {
  const allSubs = getAllSubordinates(potentialManager.id, allMembers);
  return allSubs.some((sub) => sub.id === potentialSubordinate.id);
}

/**
 * Obtém o gerente direto de um membro
 */
export function getDirectManager(
  memberId: string,
  members: TeamMember[]
): TeamMember | null {
  const member = members.find((m) => m.id === memberId);
  if (!member || !member.managerId) return null;

  return members.find((m) => m.id === member.managerId) || null;
}

/**
 * Obtém todos os subordinados diretos de um membro
 */
export function getDirectSubordinates(
  memberId: string,
  members: TeamMember[]
): TeamMember[] {
  return members.filter((m) => m.managerId === memberId);
}

/**
 * Calcula a profundidade hierárquica de um membro
 * CEO = 0, subordinados diretos do CEO = 1, etc.
 */
export function getHierarchyDepth(
  memberId: string,
  members: TeamMember[]
): number {
  const path = getHierarchyPath(memberId, members);
  return path.length - 1;
}

/**
 * Obtém todos os membros de um departamento
 */
export function getMembersByDepartment(
  department: string,
  members: TeamMember[]
): TeamMember[] {
  return members.filter((m) => m.department === department);
}

/**
 * Obtém todos os membros de um cargo específico
 */
export function getMembersByRole(
  role: string,
  members: TeamMember[]
): TeamMember[] {
  return members.filter((m) => m.role === role);
}

/**
 * Obtém todos os membros ativos
 */
export function getActiveMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((m) => m.status === 'active');
}

/**
 * Valida se uma atribuição de gerente é válida
 * Evita ciclos e mantém hierarquia consistente
 */
export function isValidManagerAssignment(
  memberId: string,
  newManagerId: string,
  members: TeamMember[]
): { valid: boolean; reason?: string } {
  // Não pode ser gerente de si mesmo
  if (memberId === newManagerId) {
    return { valid: false, reason: 'Um membro não pode ser gerente de si mesmo' };
  }

  const member = members.find((m) => m.id === memberId);
  const newManager = members.find((m) => m.id === newManagerId);

  if (!member || !newManager) {
    return { valid: false, reason: 'Membro ou gerente não encontrado' };
  }

  // Verifica se o novo gerente não é subordinado do membro
  // Isso evitaria um ciclo na hierarquia
  const memberSubordinates = getAllSubordinates(memberId, members);
  if (memberSubordinates.some((sub) => sub.id === newManagerId)) {
    return {
      valid: false,
      reason: 'Não é possível atribuir um subordinado como gerente (criaria um ciclo)',
    };
  }

  // Verifica se o cargo do gerente é apropriado
  const memberLevel = getRoleLevel(member.role);
  const managerLevel = getRoleLevel(newManager.role);

  if (managerLevel >= memberLevel) {
    return {
      valid: false,
      reason: 'O gerente deve ter um cargo superior ao do membro',
    };
  }

  return { valid: true };
}

/**
 * Conta quantos membros estão em cada nível hierárquico
 */
export function getHierarchyDistribution(
  members: TeamMember[]
): Record<number, number> {
  const distribution: Record<number, number> = {};

  for (const member of members) {
    const depth = getHierarchyDepth(member.id, members);
    distribution[depth] = (distribution[depth] || 0) + 1;
  }

  return distribution;
}

/**
 * Obtém estatísticas da hierarquia
 */
export function getHierarchyStats(members: TeamMember[]) {
  const activeMembers = getActiveMembers(members);
  const distribution = getHierarchyDistribution(activeMembers);
  const maxDepth = Math.max(...Object.keys(distribution).map(Number), 0);

  return {
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    maxDepth,
    distribution,
    hasCEO: members.some((m) => m.role === 'ceo'),
  };
}

/**
 * Busca membros por nome ou email
 */
export function searchMembers(
  query: string,
  members: TeamMember[]
): TeamMember[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return members;

  return members.filter(
    (m) =>
      m.user.fullName.toLowerCase().includes(lowerQuery) ||
      m.user.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Agrupa membros por departamento
 */
export function groupByDepartment(
  members: TeamMember[]
): Record<string, TeamMember[]> {
  const groups: Record<string, TeamMember[]> = {};

  for (const member of members) {
    const dept = member.department;
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(member);
  }

  return groups;
}

/**
 * Agrupa membros por cargo
 */
export function groupByRole(
  members: TeamMember[]
): Record<string, TeamMember[]> {
  const groups: Record<string, TeamMember[]> = {};

  for (const member of members) {
    const role = member.role;
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(member);
  }

  return groups;
}

/**
 * Obtém sugestões de gerentes possíveis para um membro
 * Baseado no cargo e departamento
 */
export function getSuggestedManagers(
  member: TeamMember,
  allMembers: TeamMember[]
): TeamMember[] {
  const memberLevel = getRoleLevel(member.role);

  return allMembers.filter((m) => {
    // Não pode ser si mesmo
    if (m.id === member.id) return false;

    // Deve ter cargo superior
    const managerLevel = getRoleLevel(m.role);
    if (managerLevel >= memberLevel) return false;

    // Preferencialmente do mesmo departamento
    // Mas pode ser de outro departamento se for C-level ou CEO
    if (m.department === member.department) return true;
    if (m.role === 'ceo' || m.role === 'c_level') return true;

    return false;
  });
}
