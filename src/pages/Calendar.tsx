import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks, useAuth } from '../stores/appStore';
import { TaskService } from '../services';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import TaskDialog from '../components/TaskDialog';
import { toast } from 'sonner';
import type { Task } from '../types';

// Estilos CSS inline para indicadores de tarefas
const taskIndicatorStyles = `
  .calendar-task-urgent {
    border-bottom: 3px solid #9333ea !important;
  }
  .calendar-task-high {
    border-bottom: 3px solid #dc2626 !important;
  }
  .calendar-task-medium {
    border-bottom: 3px solid #ca8a04 !important;
  }
  .calendar-task-low {
    border-bottom: 3px solid #16a34a !important;
  }
  @media (prefers-color-scheme: dark) {
    .calendar-task-urgent {
      border-bottom-color: #a855f7 !important;
    }
    .calendar-task-high {
      border-bottom-color: #ef4444 !important;
    }
    .calendar-task-medium {
      border-bottom-color: #eab308 !important;
    }
    .calendar-task-low {
      border-bottom-color: #22c55e !important;
    }
  }
`;

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, addTask, updateTask, setTasks } = useTasks();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user && tasks.length === 0) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await TaskService.getAll(user!.id);
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupar tarefas por data
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        const existing = grouped.get(dateKey) || [];
        grouped.set(dateKey, [...existing, task]);
      }
    });

    return grouped;
  }, [tasks]);

  // Obter tarefas de uma data específica
  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  // Obter tarefas da data selecionada
  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasksByDate]);

  // Verificar se uma data tem tarefas
  const hasTasksOnDate = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.has(dateKey);
  };

  // Obter classe CSS baseada na prioridade mais alta das tarefas do dia
  const getTaskPriorityClass = (date: Date): string => {
    const tasks = getTasksForDate(date);
    if (tasks.length === 0) return '';

    // Verificar prioridade mais alta
    const hasUrgent = tasks.some(t => t.priority === 'urgent');
    const hasHigh = tasks.some(t => t.priority === 'high');
    const hasMedium = tasks.some(t => t.priority === 'medium');

    if (hasUrgent) return 'calendar-task-urgent';
    if (hasHigh) return 'calendar-task-high';
    if (hasMedium) return 'calendar-task-medium';
    return 'calendar-task-low';
  };

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Voltar para hoje
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Criar nova tarefa com data pré-preenchida
  const handleCreateTask = (date?: Date) => {
    setDialogMode('create');
    setSelectedTask(null);

    // Se uma data foi fornecida, vamos usá-la como dueDate padrão
    if (date) {
      setSelectedDate(date);
    }

    setDialogOpen(true);
  };

  // Editar tarefa existente
  const handleEditTask = (task: Task) => {
    setDialogMode('edit');
    setSelectedTask(task);
    setDialogOpen(true);
  };

  // Salvar tarefa (criar ou editar)
  const handleSave = async (taskData: Partial<Task>) => {
    if (!user) return;

    try {
      if (dialogMode === 'create') {
        const newTask = await TaskService.create({
          ...taskData,
          title: taskData.title!,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate || selectedDate.toISOString(),
        }, user.id);

        addTask(newTask);
        toast.success('Tarefa criada com sucesso!');
      } else if (selectedTask) {
        const updatedTask = await TaskService.update(selectedTask.id, taskData);
        updateTask(selectedTask.id, updatedTask);
        toast.success('Tarefa atualizada com sucesso!');
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  // Badges de status e prioridade
  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      in_progress: { label: 'Em Progresso', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      archived: { label: 'Arquivada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants: Record<Task['priority'], { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      high: { label: 'Alta', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      urgent: { label: 'Urgente', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    };
    const variant = variants[priority];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <>
      <div className="space-y-6">
        <style>{taskIndicatorStyles}</style>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendário</h1>
          <Button onClick={() => handleCreateTask()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              className="rounded-md border shadow-sm"
              modifiers={{
                urgent: (date) => getTaskPriorityClass(date) === 'calendar-task-urgent',
                high: (date) => getTaskPriorityClass(date) === 'calendar-task-high',
                medium: (date) => getTaskPriorityClass(date) === 'calendar-task-medium',
                low: (date) => getTaskPriorityClass(date) === 'calendar-task-low',
              }}
              modifiersClassNames={{
                urgent: 'font-semibold calendar-task-urgent',
                high: 'font-semibold calendar-task-high',
                medium: 'font-semibold calendar-task-medium',
                low: 'font-semibold calendar-task-low',
              }}
            />
          </Card>

          {/* Tarefas do dia selecionado */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCreateTask(selectedDate)}
                title="Criar tarefa para este dia"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">
                    Nenhuma tarefa para este dia
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateTask(selectedDate)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Adicionar Tarefa
                  </Button>
                </div>
              ) : (
                selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleEditTask(task)}
                  >
                    <h3 className={`font-medium mb-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <TaskDialog
          open={dialogOpen}
          mode={dialogMode}
          task={selectedTask}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© 2025 TaskFlow Manager</span>
              <span>•</span>
              <span>Feito com</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>por TaskFlow Team</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/taskflow-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <span className="text-sm">v1.0.0</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CalendarPage;
