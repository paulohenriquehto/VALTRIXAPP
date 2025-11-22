import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Zap,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface PomodoroStats {
  completedToday: number;
  totalMinutes: number;
  currentStreak: number;
  sessionsHistory: { timestamp: Date; duration: number; type: TimerMode }[];
}

const Pomodoro: React.FC = () => {
  // Configurações de tempo (em minutos)
  const [workDuration] = useState(25);
  const [shortBreakDuration] = useState(5);
  const [longBreakDuration] = useState(15);
  const [pomodorosUntilLongBreak] = useState(4);

  // Estado do timer
  const [mode, setMode] = useState<TimerMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // em segundos
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  // Estatísticas
  const [stats, setStats] = useState<PomodoroStats>({
    completedToday: 0,
    totalMinutes: 0,
    currentStreak: 0,
    sessionsHistory: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Duração total baseada no modo
  const getTotalDuration = (timerMode: TimerMode): number => {
    switch (timerMode) {
      case 'work':
        return workDuration * 60;
      case 'shortBreak':
        return shortBreakDuration * 60;
      case 'longBreak':
        return longBreakDuration * 60;
    }
  };

  // Formatar tempo em MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular porcentagem de progresso
  const getProgress = (): number => {
    const total = getTotalDuration(mode);
    return ((total - timeLeft) / total) * 100;
  };

  // Mudar modo do timer
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getTotalDuration(newMode));
    setStatus('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Iniciar timer
  const startTimer = () => {
    setStatus('running');
  };

  // Pausar timer
  const pauseTimer = () => {
    setStatus('paused');
  };

  // Resetar timer
  const resetTimer = () => {
    setStatus('idle');
    setTimeLeft(getTotalDuration(mode));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Completar sessão
  const completeSession = () => {
    // Tocar som de conclusão
    playNotificationSound();

    // Atualizar estatísticas
    if (mode === 'work') {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);

      setStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1,
        totalMinutes: prev.totalMinutes + workDuration,
        currentStreak: prev.currentStreak + 1,
        sessionsHistory: [
          ...prev.sessionsHistory,
          { timestamp: new Date(), duration: workDuration, type: 'work' }
        ],
      }));

      toast.success('Pomodoro completo! Hora de uma pausa.', {
        description: `Você completou ${newCompleted} pomodoro(s) hoje!`,
      });

      // Determinar próxima pausa
      if (newCompleted % pomodorosUntilLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      toast.success('Pausa completa! Pronto para focar novamente?');
      switchMode('work');
    }
  };

  // Tocar som de notificação
  const playNotificationSound = () => {
    // Criar beep simples usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Effect para controlar o timer
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return getTotalDuration(mode);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, mode]);

  // Cor baseada no modo
  const getModeColor = (): string => {
    switch (mode) {
      case 'work':
        return 'from-red-500 to-orange-500';
      case 'shortBreak':
        return 'from-green-500 to-emerald-500';
      case 'longBreak':
        return 'from-blue-500 to-cyan-500';
    }
  };

  // Label do modo
  const getModeLabel = (): string => {
    switch (mode) {
      case 'work':
        return 'Foco';
      case 'shortBreak':
        return 'Pausa Curta';
      case 'longBreak':
        return 'Pausa Longa';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pomodoro Timer</h1>
          <p className="text-muted-foreground mt-1">
            Técnica de produtividade com intervalos focados
          </p>
        </div>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Timer</CardTitle>
              </div>
              <Badge className={`bg-gradient-to-r ${getModeColor()} text-white border-0`}>
                {getModeLabel()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Seletor de Modo */}
            <Tabs value={mode} onValueChange={(value) => switchMode(value as TimerMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="work" disabled={status === 'running'}>
                  <Zap className="h-4 w-4 mr-2" />
                  Foco
                </TabsTrigger>
                <TabsTrigger value="shortBreak" disabled={status === 'running'}>
                  <Coffee className="h-4 w-4 mr-2" />
                  Pausa Curta
                </TabsTrigger>
                <TabsTrigger value="longBreak" disabled={status === 'running'}>
                  <Coffee className="h-4 w-4 mr-2" />
                  Pausa Longa
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Timer Circular */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                {/* Círculo de progresso */}
                <svg className="transform -rotate-90" width="280" height="280">
                  {/* Círculo de fundo */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/20"
                  />
                  {/* Círculo de progresso */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgress() / 100)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={mode === 'work' ? 'stop-red-500' : mode === 'shortBreak' ? 'stop-green-500' : 'stop-blue-500'} />
                      <stop offset="100%" className={mode === 'work' ? 'stop-orange-500' : mode === 'shortBreak' ? 'stop-emerald-500' : 'stop-cyan-500'} />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Tempo no centro */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold tracking-tight">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {status === 'running' ? 'Em andamento...' : status === 'paused' ? 'Pausado' : 'Pronto para começar'}
                  </div>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-3">
              {status === 'running' ? (
                <Button size="lg" onClick={pauseTimer} className="px-8">
                  <Pause className="mr-2 h-5 w-5" />
                  Pausar
                </Button>
              ) : (
                <Button size="lg" onClick={startTimer} className="px-8">
                  <Play className="mr-2 h-5 w-5" />
                  {status === 'paused' ? 'Continuar' : 'Iniciar'}
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={resetTimer}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Resetar
              </Button>
            </div>

            {/* Indicador de Pomodoros */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: pomodorosUntilLongBreak }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all ${
                    i < (completedPomodoros % pomodorosUntilLongBreak)
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 scale-110'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Estatísticas de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pomodoros</span>
                  <span className="text-2xl font-bold">{stats.completedToday}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min((stats.completedToday / 8) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Meta: 8 pomodoros/dia</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tempo Focado</span>
                  <span className="text-xl font-semibold">{stats.totalMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sequência Atual</span>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.currentStreak}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Iniciante</div>
                  <div className="text-xs text-muted-foreground">Complete 5 pomodoros</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.completedToday}/5
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Focado</div>
                  <div className="text-xs text-muted-foreground">Complete 10 pomodoros</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.completedToday}/10
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dicas de Produtividade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas para Máxima Produtividade</CardTitle>
          <CardDescription>
            Aproveite ao máximo a técnica Pomodoro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Elimine Distrações</h4>
                <p className="text-xs text-muted-foreground">
                  Silencie notificações e foque 100% na tarefa
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Coffee className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Respeite as Pausas</h4>
                <p className="text-xs text-muted-foreground">
                  Use as pausas para se afastar da tela
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Uma Tarefa por Vez</h4>
                <p className="text-xs text-muted-foreground">
                  Concentre-se em uma única atividade
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pomodoro;
