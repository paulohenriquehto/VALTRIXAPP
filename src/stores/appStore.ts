import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  User,
  Task,
  TaskFilters,
  UserPreferences,
  Notification,
  Client,
  Payment,
  MRRMetrics,
  TeamMember,
  TeamInvite,
  Permissions,
  OrgChartNode,
  Project,
} from '../types';
import { buildOrgChart, getAllSubordinates } from '../utils/hierarchy';
import { calculateROI } from '../services/clientService';

// Interface do estado global
interface AppState {
  // Estado de autenticação
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Estado de tarefas
  tasks: Task[];
  selectedTask: Task | null;
  taskFilters: TaskFilters;
  isLoadingTasks: boolean;

  // Estado de UI
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: Notification[];

  // Estado de equipe
  teamMembers: TeamMember[];
  teamInvites: TeamInvite[];
  selectedMember: TeamMember | null;

  // Estado de projetos
  projects: Project[];
  selectedProject: Project | null;
  isLoadingProjects: boolean;

  // Preferências do usuário
  preferences: UserPreferences;

  // Ações de autenticação
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearAuth: () => void;

  // Ações de tarefas
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setTaskFilters: (filters: TaskFilters) => void;
  setIsLoadingTasks: (isLoading: boolean) => void;

  // Ações de UI
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;

  // Ações de preferências
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Ações de clientes
  clients: Client[];
  payments: Payment[];
  selectedClient: Client | null;
  setClients: (clients: Client[]) => void;
  setPayments: (payments: Payment[]) => void;
  addClient: (client: Client) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  deleteClient: (clientId: string) => void;
  setSelectedClient: (client: Client | null) => void;

  // Ações de pagamentos
  addPayment: (payment: Payment) => void;
  updatePaymentStatus: (paymentId: string, status: import('../types').PaymentStatus, paidDate?: string) => void;

  // Computed metrics
  getMRRMetrics: () => MRRMetrics;

  // Ações de equipe - Membros
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (memberId: string) => void;
  setSelectedMember: (member: TeamMember | null) => void;
  updateMemberPermissions: (memberId: string, permissions: Permissions) => void;

  // Ações de equipe - Convites
  setTeamInvites: (invites: TeamInvite[]) => void;
  sendInvite: (invite: TeamInvite) => void;
  cancelInvite: (inviteId: string) => void;
  updateInviteStatus: (inviteId: string, status: 'accepted' | 'rejected' | 'expired') => void;

  // Getters de equipe
  getOrgChart: () => OrgChartNode | null;
  getMembersByDepartment: (department: string) => TeamMember[];
  getMembersByRole: (role: string) => TeamMember[];
  getSubordinates: (managerId: string) => TeamMember[];
  getActiveMembers: () => TeamMember[];

  // Ações de projetos
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setSelectedProject: (project: Project | null) => void;
  setIsLoadingProjects: (isLoading: boolean) => void;

  // Ações gerais
  resetState: () => void;
}

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,

  tasks: [],
  selectedTask: null,
  taskFilters: {},
  isLoadingTasks: false,

  sidebarCollapsed: false,
  theme: 'light' as const,
  notifications: [],

  clients: [],
  payments: [],
  selectedClient: null,

  teamMembers: [],
  teamInvites: [],
  selectedMember: null,

  projects: [],
  selectedProject: null,
  isLoadingProjects: false,

  preferences: {
    theme: 'light' as const,
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h' as const,
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      deadlineAlerts: true,
    },
    pomodoro: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStart: false,
      soundEnabled: true,
    },
  },
};

// Criar o store com middlewares
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Ações de autenticação
        setUser: (user) => set({ user }),
        setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setIsLoading: (isLoading) => set({ isLoading }),
        clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),

        // Ações de tarefas
        setTasks: (tasks) => set({ tasks }),
        addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
        updateTask: (taskId, updates) =>
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? { ...state.selectedTask, ...updates }
                : state.selectedTask,
          })),
        deleteTask: (taskId) =>
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== taskId),
            selectedTask:
              state.selectedTask?.id === taskId ? null : state.selectedTask,
          })),
        setSelectedTask: (selectedTask) => set({ selectedTask }),
        setTaskFilters: (taskFilters) => set({ taskFilters }),
        setIsLoadingTasks: (isLoadingTasks) => set({ isLoadingTasks }),

        // Ações de UI
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setTheme: (theme) => {
          set({ theme });
          // Aplicar tema ao DOM
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            // Auto: detectar preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        },
        addNotification: (notification) =>
          set((state) => ({
            notifications: [notification, ...state.notifications],
          })),
        removeNotification: (notificationId) =>
          set((state) => ({
            notifications: state.notifications.filter(
              (n) => n.id !== notificationId
            ),
          })),
        markNotificationAsRead: (notificationId) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          })),

        // Ações de preferências
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          })),

        // Ações de clientes
        setClients: (clients) => set({ clients }),
        setPayments: (payments) => set({ payments }),
        addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
        updateClient: (clientId, updates) =>
          set((state) => ({
            clients: state.clients.map((client) =>
              client.id === clientId ? { ...client, ...updates } : client
            ),
            selectedClient:
              state.selectedClient?.id === clientId
                ? { ...state.selectedClient, ...updates }
                : state.selectedClient,
          })),
        deleteClient: (clientId) =>
          set((state) => ({
            clients: state.clients.filter((client) => client.id !== clientId),
            selectedClient:
              state.selectedClient?.id === clientId ? null : state.selectedClient,
          })),
        setSelectedClient: (selectedClient) => set({ selectedClient }),

        // Ações de pagamentos
        addPayment: (payment) => set((state) => ({ payments: [payment, ...state.payments] })),
        updatePaymentStatus: (paymentId, status, paidDate) =>
          set((state) => ({
            payments: state.payments.map((payment) =>
              payment.id === paymentId
                ? { ...payment, status, paidDate: paidDate || payment.paidDate }
                : payment
            ),
          })),

        // Computed metrics
        getMRRMetrics: () => {
          const state = get();
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          // SEPARAR clientes recorrentes vs freelance
          const recurringClients = state.clients.filter(c => c.clientType === 'recurring');
          const freelanceClients = state.clients.filter(c => c.clientType === 'freelance');

          // === MÉTRICAS DE CLIENTES RECORRENTES (MRR) ===
          const activeRecurringClients = recurringClients.filter(c => c.status === 'active');
          const activeClients = activeRecurringClients.length;
          const trialClients = recurringClients.filter(c => c.status === 'trial').length;

          const churnedThisMonth = recurringClients.filter(
            c => c.status === 'churned' && new Date(c.updatedAt) >= firstDayOfMonth
          ).length;

          const newThisMonth = recurringClients.filter(
            c => new Date(c.createdAt) >= firstDayOfMonth
          ).length;

          const totalMRR = activeRecurringClients.reduce((sum, c) => sum + c.monthlyValue, 0);
          const avgRevenuePerClient = activeClients > 0 ? totalMRR / activeClients : 0;
          const projectedAnnualRevenue = totalMRR * 12;

          const paymentsPending = activeRecurringClients.filter(
            c => c.paymentStatus === 'pending'
          ).reduce((sum, c) => sum + c.monthlyValue, 0);

          const paymentsOverdue = activeRecurringClients.filter(
            c => c.paymentStatus === 'overdue'
          ).reduce((sum, c) => sum + c.monthlyValue, 0);

          // Receita prevista para os próximos 7 dias (clientes recorrentes)
          const today = now.getDate();
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).getDate();

          const upcomingRevenue7Days = activeRecurringClients.filter(c => {
            const dueDay = c.paymentDueDay;
            if (!dueDay) return false;

            // Se estamos no final do mês e o próximo vencimento é início do próximo mês
            if (sevenDaysFromNow < today) {
              return dueDay >= today || dueDay <= sevenDaysFromNow;
            }
            // Caso normal: próximos 7 dias no mesmo mês
            return dueDay >= today && dueDay <= sevenDaysFromNow;
          }).reduce((sum, c) => sum + c.monthlyValue, 0);

          // Receita prevista para hoje (clientes recorrentes)
          const todayRevenue = activeRecurringClients.filter(c => {
            return c.paymentDueDay === today;
          }).reduce((sum, c) => sum + c.monthlyValue, 0);

          // === MÉTRICAS DE CLIENTES FREELANCE ===
          const activeFreelance = freelanceClients.filter(c => c.status === 'active').length;
          const completedFreelance = freelanceClients.filter(c => c.status === 'completed').length;

          // Receita paga (projetos concluídos + clientes com totalPaid)
          const revenuePaid = freelanceClients
            .filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);

          // Receita pendente (projetos ativos)
          const revenuePending = freelanceClients
            .filter(c => c.status === 'active')
            .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);

          const totalFreelanceRevenue = revenuePaid + revenuePending;

          const totalFreelanceProjects = activeFreelance + completedFreelance;
          const avgProjectValue = totalFreelanceProjects > 0
            ? totalFreelanceRevenue / totalFreelanceProjects
            : 0;

          // Contar quantos pagamentos foram recebidos (projetos concluídos)
          const receivedPaymentsCount = completedFreelance;

          // === MÉTRICAS DE ROI E CAC (TODOS OS CLIENTES) ===
          // Calcular CAC total de todos os clientes
          const totalAcquisitionCost = state.clients.reduce(
            (sum, c) => sum + (c.acquisitionCost || 0),
            0
          );

          // Calcular ROI médio dos clientes recorrentes
          const recurringROIs = activeRecurringClients
            .map(c => {
              const roiData = calculateROI(c);
              return roiData.roi;
            })
            .filter(roi => roi !== null) as number[];

          const avgROI = recurringROIs.length > 0
            ? recurringROIs.reduce((sum, roi) => sum + roi, 0) / recurringROIs.length
            : 0;

          // Calcular receita total (recorrentes + freelance)
          const totalRecurringRevenue = activeRecurringClients.reduce((sum, c) => {
            const roiData = calculateROI(c);
            return sum + roiData.totalRevenue;
          }, 0);

          const totalRevenue = totalRecurringRevenue + revenuePaid;

          // Lucro real = Receita total - CAC total
          const realProfit = totalRevenue - totalAcquisitionCost;

          return {
            // Métricas MRR (apenas recorrentes)
            totalMRR,
            activeClients,
            trialClients,
            churnedThisMonth,
            newThisMonth,
            avgRevenuePerClient,
            projectedAnnualRevenue,
            paymentsPending,
            paymentsOverdue,
            totalClients: recurringClients.length,

            // Previsões de receita (clientes recorrentes)
            upcomingRevenue7Days, // Receita esperada nos próximos 7 dias
            todayRevenue, // Receita esperada para hoje

            // Métricas de ROI e CAC (todos os clientes)
            totalAcquisitionCost,
            avgROI,
            realProfit,

            // Métricas Freelance (separadas)
            freelanceMetrics: {
              totalRevenue: totalFreelanceRevenue,
              revenuePaid,
              revenuePending,
              activeFreelance,
              completedFreelance,
              avgProjectValue,
              receivedPaymentsCount,
            },
          };
        },

        // Ações de equipe - Membros
        setTeamMembers: (members) => set({ teamMembers: members }),
        addTeamMember: (member) =>
          set((state) => ({ teamMembers: [...state.teamMembers, member] })),

        updateTeamMember: (memberId, updates) =>
          set((state) => ({
            teamMembers: state.teamMembers.map((member) =>
              member.id === memberId
                ? { ...member, ...updates, updatedAt: new Date().toISOString() }
                : member
            ),
            selectedMember:
              state.selectedMember?.id === memberId
                ? { ...state.selectedMember, ...updates, updatedAt: new Date().toISOString() }
                : state.selectedMember,
          })),

        removeTeamMember: (memberId) =>
          set((state) => ({
            teamMembers: state.teamMembers.filter((member) => member.id !== memberId),
            selectedMember:
              state.selectedMember?.id === memberId ? null : state.selectedMember,
          })),

        setSelectedMember: (selectedMember) => set({ selectedMember }),

        updateMemberPermissions: (memberId, permissions) =>
          set((state) => ({
            teamMembers: state.teamMembers.map((member) =>
              member.id === memberId
                ? { ...member, permissions, updatedAt: new Date().toISOString() }
                : member
            ),
          })),

        // Ações de equipe - Convites
        setTeamInvites: (invites) => set({ teamInvites: invites }),
        sendInvite: (invite) =>
          set((state) => ({ teamInvites: [...state.teamInvites, invite] })),

        cancelInvite: (inviteId) =>
          set((state) => ({
            teamInvites: state.teamInvites.filter((invite) => invite.id !== inviteId),
          })),

        updateInviteStatus: (inviteId, status) =>
          set((state) => ({
            teamInvites: state.teamInvites.map((invite) =>
              invite.id === inviteId ? { ...invite, status } : invite
            ),
          })),

        // Getters de equipe
        getOrgChart: () => {
          const state = get();
          return buildOrgChart(state.teamMembers);
        },

        getMembersByDepartment: (department) => {
          const state = get();
          return state.teamMembers.filter((m) => m.department === department);
        },

        getMembersByRole: (role) => {
          const state = get();
          return state.teamMembers.filter((m) => m.role === role);
        },

        getSubordinates: (managerId) => {
          const state = get();
          return getAllSubordinates(managerId, state.teamMembers);
        },

        getActiveMembers: () => {
          const state = get();
          return state.teamMembers.filter((m) => m.status === 'active');
        },

        // Ações de projetos
        setProjects: (projects) => set({ projects }),
        addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
        updateProject: (projectId, updates) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId ? { ...project, ...updates } : project
            ),
            selectedProject:
              state.selectedProject?.id === projectId
                ? { ...state.selectedProject, ...updates }
                : state.selectedProject,
          })),
        deleteProject: (projectId) =>
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
            selectedProject:
              state.selectedProject?.id === projectId ? null : state.selectedProject,
          })),
        setSelectedProject: (selectedProject) => set({ selectedProject }),
        setIsLoadingProjects: (isLoadingProjects) => set({ isLoadingProjects }),

        // Ações gerais
        resetState: () => set({ ...initialState }),
      }),
      {
        name: 'taskflow-store', // nome do storage
        partialize: (state) => ({
          // Apenas persistir dados que devem ser salvos
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          preferences: state.preferences,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
);

// Seletores úteis
export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAppStore();
  const { setUser, setIsAuthenticated, setIsLoading, clearAuth } = useAppStore();

  return { user, isAuthenticated, isLoading, setUser, setIsAuthenticated, setIsLoading, clearAuth };
};

export const useTasks = () => {
  const { tasks, selectedTask, taskFilters, isLoadingTasks } = useAppStore();
  const { setTasks, addTask, updateTask, deleteTask, setSelectedTask, setTaskFilters, setIsLoadingTasks } = useAppStore();

  return {
    tasks,
    selectedTask,
    taskFilters,
    isLoadingTasks,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    setSelectedTask,
    setTaskFilters,
    setIsLoadingTasks,
  };
};

export const useUI = () => {
  const { sidebarCollapsed, theme, notifications } = useAppStore();
  const { toggleSidebar, setTheme, addNotification, removeNotification, markNotificationAsRead } = useAppStore();

  return {
    sidebarCollapsed,
    theme,
    notifications,
    toggleSidebar,
    setTheme,
    addNotification,
    removeNotification,
    markNotificationAsRead,
  };
};

export const usePreferences = () => {
  const { preferences } = useAppStore();
  const { updatePreferences } = useAppStore();

  return { preferences, updatePreferences };
};

// Hook para tarefas filtradas
export const useFilteredTasks = () => {
  const { tasks, taskFilters } = useAppStore();

  return tasks.filter((task) => {
    // Filtrar por status
    if (taskFilters.status?.length && !taskFilters.status.includes(task.status)) {
      return false;
    }

    // Filtrar por prioridade
    if (taskFilters.priority?.length && !taskFilters.priority.includes(task.priority)) {
      return false;
    }

    // Filtrar por categoria
    if (taskFilters.category?.length && !taskFilters.category.includes(task.category?.id || '')) {
      return false;
    }

    // Filtrar por responsável
    if (taskFilters.assignee?.length && !taskFilters.assignee.includes(task.assignee?.id || '')) {
      return false;
    }

    // Filtrar por data de vencimento
    if (taskFilters.dueDateFrom && task.dueDate) {
      if (new Date(task.dueDate) < new Date(taskFilters.dueDateFrom)) {
        return false;
      }
    }

    if (taskFilters.dueDateTo && task.dueDate) {
      if (new Date(task.dueDate) > new Date(taskFilters.dueDateTo)) {
        return false;
      }
    }

    // Filtrar por busca textual
    if (taskFilters.search) {
      const searchLower = taskFilters.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description?.toLowerCase().includes(searchLower);

      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    return true;
  });
};

// Hook para estatísticas do dashboard
export const useDashboardStats = () => {
  const { tasks } = useAppStore();

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tasksByPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    tasksByPriority,
    tasksByStatus,
  };
};

// Hook para clientes
export const useClients = () => {
  const { clients, payments, selectedClient } = useAppStore();
  const { setClients, addClient, updateClient, deleteClient, setSelectedClient, addPayment, updatePaymentStatus, getMRRMetrics } = useAppStore();

  return {
    clients,
    payments,
    selectedClient,
    setClients,
    addClient,
    updateClient,
    deleteClient,
    setSelectedClient,
    addPayment,
    updatePaymentStatus,
    getMRRMetrics,
  };
};

// Hook para equipe
export const useTeam = () => {
  const { teamMembers, teamInvites, selectedMember } = useAppStore();
  const {
    setTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    setSelectedMember,
    updateMemberPermissions,
    setTeamInvites,
    sendInvite,
    cancelInvite,
    updateInviteStatus,
    getOrgChart,
    getMembersByDepartment,
    getMembersByRole,
    getSubordinates,
    getActiveMembers,
  } = useAppStore();

  return {
    teamMembers,
    teamInvites,
    selectedMember,
    setTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    setSelectedMember,
    updateMemberPermissions,
    setTeamInvites,
    sendInvite,
    cancelInvite,
    updateInviteStatus,
    getOrgChart,
    getMembersByDepartment,
    getMembersByRole,
    getSubordinates,
    getActiveMembers,
  };
};

// Hook para projetos
export const useProjects = () => {
  const { projects, selectedProject, isLoadingProjects } = useAppStore();
  const {
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setSelectedProject,
    setIsLoadingProjects,
  } = useAppStore();

  return {
    projects,
    selectedProject,
    isLoadingProjects,
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setSelectedProject,
    setIsLoadingProjects,
  };
};
