import React, { useEffect, useState } from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  Mail,
  Users,
  FileText,
  Target,
  TrendingUp,
  TrendingDown,
  Flame,
  Trophy,
  Star,
  Zap,
  MessageSquare,
  Plus,
  BarChart3,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/ui/page-header';
import { KPIGrid, ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { SalesGoalsTab } from '@/components/sales/SalesGoalsTab';
import { SalesAchievementsTab } from '@/components/sales/SalesAchievementsTab';
import { SalesCoachTab } from '@/components/sales/SalesCoachTab';
import { ActivityQuickAdd } from '@/components/sales/ActivityQuickAdd';
import { CheckinModal } from '@/components/sales/CheckinModal';
import { AchievementToast } from '@/components/sales/AchievementToast';
import { getLevelTitle } from '@/types/gamification';

const Commercial: React.FC = () => {
  const { user } = useAuth();
  const {
    todayActivity,
    summary,
    streaks,
    gamification,
    activeGoal,
    newAchievements,
    showCheckinModal,
    checkinType,
    activeTab,
    isLoading,
    loadAll,
    setActiveTab,
    startManualCheckin,
    closeCheckin,
    dismissNewAchievements,
  } = useSalesStore();

  useEffect(() => {
    if (user) {
      loadAll(user.id);
    }
  }, [user, loadAll]);

  // Get current streak
  const prospectingStreak = streaks.find(s => s.streak_type === 'daily_prospecting');
  const currentStreak = prospectingStreak?.current_count || 0;
  const longestStreak = prospectingStreak?.longest_count || 0;

  // Calculate level progress
  const levelProgress = gamification
    ? Math.round((gamification.xp_current / gamification.xp_to_next_level) * 100)
    : 0;

  // Today's stats
  const todayContacts = todayActivity?.contacts_sent || 0;
  const todayCalls = todayActivity?.calls_made || 0;
  const todayMeetings = todayActivity?.meetings_held || 0;
  const todayDeals = todayActivity?.deals_closed || 0;

  // Period stats
  const periodContacts = summary?.totals.contacts || 0;
  const periodCalls = summary?.totals.calls || 0;
  const periodMeetings = summary?.totals.meetings || 0;
  const periodDeals = summary?.totals.deals || 0;
  const periodRevenue = summary?.totals.revenue || 0;
  const conversionRate = summary?.averages.conversion_rate || 0;

  if (isLoading) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="Comercial" description="Carregando..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Centro Comercial"
        description="Gerencie suas atividades de vendas e prospecao"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startManualCheckin}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Check-in
            </Button>
          </div>
        }
      />

      {/* Top Bar - Streak, Level & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{currentStreak} dias</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Recorde</p>
                <p className="text-lg font-semibold text-orange-500">{longestStreak}</p>
              </div>
            </div>
            {currentStreak > 0 && currentStreak >= 3 && (
              <Badge className="mt-2 bg-orange-500/20 text-orange-600 border-orange-500/30">
                {currentStreak >= 30 ? 'Imparavel!' : currentStreak >= 7 ? 'Em Chamas!' : 'Comecando!'}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Star className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nivel {gamification?.current_level || 1}</p>
                  <p className="text-lg font-bold">{getLevelTitle(gamification?.current_level || 1)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="text-lg font-semibold text-purple-500">{gamification?.total_points || 0}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP</span>
                <span>{gamification?.xp_current || 0}/{gamification?.xp_to_next_level || 100}</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Quick Stats */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-lg font-bold">Atividades</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-blue-500">{todayContacts}</p>
                <p className="text-xs text-muted-foreground">Contatos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-500">{todayCalls}</p>
                <p className="text-xs text-muted-foreground">Ligacoes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-500">{todayMeetings}</p>
                <p className="text-xs text-muted-foreground">Reunioes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">{todayDeals}</p>
                <p className="text-xs text-muted-foreground">Fechados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Activity Add */}
      <ActivityQuickAdd />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Conquistas</span>
          </TabsTrigger>
          <TabsTrigger value="coach" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Coach IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SalesDashboard />
        </TabsContent>

        <TabsContent value="goals">
          <SalesGoalsTab />
        </TabsContent>

        <TabsContent value="achievements">
          <SalesAchievementsTab />
        </TabsContent>

        <TabsContent value="coach">
          <SalesCoachTab />
        </TabsContent>
      </Tabs>

      {/* Check-in Modal */}
      <CheckinModal
        open={showCheckinModal}
        onClose={closeCheckin}
        type={checkinType}
      />

      {/* Achievement Toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onDismiss={dismissNewAchievements}
        />
      )}
    </PageContainer>
  );
};

export default Commercial;
