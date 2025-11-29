import React, { useState } from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Check,
  Clock,
  Trash2,
} from 'lucide-react';
import { PERIOD_LABELS } from '@/types/sales';
import type { SalesGoalInput, SalesPeriodType } from '@/types/sales';

export const SalesGoalsTab: React.FC = () => {
  const { user } = useAuth();
  const { allGoals, activeGoal, summary, createGoal, deleteGoal } = useSalesStore();
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newGoal, setNewGoal] = useState<SalesGoalInput>({
    period_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    title: '',
    contacts_target: 100,
    calls_target: 50,
    meetings_target: 10,
    proposals_target: 5,
    leads_target: 20,
    deals_target: 3,
    revenue_target: 10000,
  });

  const handleCreateGoal = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      await createGoal(user.id, newGoal);
      setDialogOpen(false);
      // Reset form
      setNewGoal({
        period_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: '',
        contacts_target: 100,
        calls_target: 50,
        meetings_target: 10,
        proposals_target: 5,
        leads_target: 20,
        deals_target: 3,
        revenue_target: 10000,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      await deleteGoal(goalId, user.id);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getGoalProgress = (target: number, current: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getStatusBadge = (goal: typeof allGoals[0]) => {
    switch (goal.status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Concluida</Badge>;
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Ativa</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Expirada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Metas de Vendas</h3>
          <p className="text-sm text-muted-foreground">
            Defina e acompanhe suas metas comerciais
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Titulo (opcional)</Label>
                <Input
                  placeholder="Ex: Meta de Janeiro"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Periodo</Label>
                <Select
                  value={newGoal.period_type}
                  onValueChange={(v: SalesPeriodType) => setNewGoal({ ...newGoal, period_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicio</Label>
                  <Input
                    type="date"
                    value={newGoal.start_date}
                    onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newGoal.end_date}
                    onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Contatos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newGoal.contacts_target}
                    onChange={(e) => setNewGoal({ ...newGoal, contacts_target: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Ligacoes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newGoal.calls_target}
                    onChange={(e) => setNewGoal({ ...newGoal, calls_target: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Reunioes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newGoal.meetings_target}
                    onChange={(e) => setNewGoal({ ...newGoal, meetings_target: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Negocios</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newGoal.deals_target}
                    onChange={(e) => setNewGoal({ ...newGoal, deals_target: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Receita (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newGoal.revenue_target}
                  onChange={(e) => setNewGoal({ ...newGoal, revenue_target: parseInt(e.target.value) || 0 })}
                />
              </div>

              <Button
                onClick={handleCreateGoal}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Criando...' : 'Criar Meta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goal Card */}
      {activeGoal && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {activeGoal.title || 'Meta Ativa'}
              </CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/30">
                Em Andamento
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(activeGoal.start_date).toLocaleDateString('pt-BR')} - {new Date(activeGoal.end_date).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Contatos</span>
                  <span className="font-medium">
                    {summary?.totals.contacts || 0}/{activeGoal.contacts_target}
                  </span>
                </div>
                <Progress
                  value={getGoalProgress(activeGoal.contacts_target, summary?.totals.contacts || 0)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ligacoes</span>
                  <span className="font-medium">
                    {summary?.totals.calls || 0}/{activeGoal.calls_target}
                  </span>
                </div>
                <Progress
                  value={getGoalProgress(activeGoal.calls_target, summary?.totals.calls || 0)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reunioes</span>
                  <span className="font-medium">
                    {summary?.totals.meetings || 0}/{activeGoal.meetings_target}
                  </span>
                </div>
                <Progress
                  value={getGoalProgress(activeGoal.meetings_target, summary?.totals.meetings || 0)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negocios</span>
                  <span className="font-medium">
                    {summary?.totals.deals || 0}/{activeGoal.deals_target}
                  </span>
                </div>
                <Progress
                  value={getGoalProgress(activeGoal.deals_target, summary?.totals.deals || 0)}
                  className="h-2"
                />
              </div>
            </div>

            {/* Revenue Progress */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Receita</span>
                <span className="font-medium">
                  R$ {(summary?.totals.revenue || 0).toLocaleString('pt-BR')} / R$ {activeGoal.revenue_target.toLocaleString('pt-BR')}
                </span>
              </div>
              <Progress
                value={getGoalProgress(activeGoal.revenue_target, summary?.totals.revenue || 0)}
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Goals List */}
      <div className="space-y-4">
        <h4 className="font-medium">Historico de Metas</h4>

        {allGoals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta criada ainda</p>
              <p className="text-sm">Crie sua primeira meta para comecar a acompanhar seus resultados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allGoals.map((goal) => (
              <Card key={goal.id} className={goal.id === activeGoal?.id ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        goal.status === 'completed' ? 'bg-green-500/10' :
                        goal.status === 'active' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                      }`}>
                        {goal.status === 'completed' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : goal.status === 'active' ? (
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{goal.title || 'Meta de Vendas'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(goal.start_date).toLocaleDateString('pt-BR')} - {new Date(goal.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(goal)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
