import React from 'react';
import { useSalesStore } from '@/stores/salesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Lock,
  Flame,
  TrendingUp,
  Target,
  Flag,
  Star,
  Award,
} from 'lucide-react';
import {
  TIER_COLORS,
  TIER_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/types/gamification';
import type { Achievement, AchievementCategory, AchievementTier } from '@/types/gamification';
import { GamificationService } from '@/services/gamificationService';

export const SalesAchievementsTab: React.FC = () => {
  const { achievements, allAchievements, streaks, summary, todayActivity, gamification } = useSalesStore();

  const unlockedIds = new Set(achievements.map(a => a.achievement_id));

  // Group achievements by category
  const achievementsByCategory = allAchievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<AchievementCategory, Achievement[]>);

  // Calculate progress for each achievement
  const getAchievementProgress = (achievement: Achievement): number => {
    const stats = {
      streaks,
      totals: {
        contacts: summary?.totals.contacts || 0,
        calls: summary?.totals.calls || 0,
        meetings: summary?.totals.meetings || 0,
        deals: summary?.totals.deals || 0,
        revenue: summary?.totals.revenue || 0,
      },
      todayActivity: {
        contacts: todayActivity?.contacts_sent || 0,
        calls: todayActivity?.calls_made || 0,
        meetings: todayActivity?.meetings_held || 0,
      },
    };

    return GamificationService.calculateAchievementProgress(achievement, stats);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak': return Flame;
      case 'volume': return TrendingUp;
      case 'conversion': return Target;
      case 'milestone': return Flag;
      case 'special': return Star;
      default: return Award;
    }
  };

  const getTierGradient = (tier: AchievementTier) => {
    switch (tier) {
      case 'bronze': return 'from-orange-500/20 to-orange-600/10';
      case 'silver': return 'from-gray-300/20 to-gray-400/10';
      case 'gold': return 'from-yellow-400/20 to-yellow-500/10';
      case 'platinum': return 'from-cyan-400/20 to-cyan-500/10';
      case 'diamond': return 'from-purple-400/20 to-purple-500/10';
      default: return 'from-gray-500/20 to-gray-600/10';
    }
  };

  // Stats Summary
  const totalAchievements = allAchievements.length;
  const unlockedCount = achievements.length;
  const progressPercent = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{unlockedCount}/{totalAchievements}</p>
            <p className="text-sm text-muted-foreground">Conquistas Desbloqueadas</p>
            <Progress value={progressPercent} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{gamification?.total_points || 0}</p>
            <p className="text-sm text-muted-foreground">Pontos Totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">Nivel {gamification?.current_level || 1}</p>
            <p className="text-sm text-muted-foreground">
              {gamification?.xp_current || 0}/{gamification?.xp_to_next_level || 100} XP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements by Category */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
        const CategoryIcon = getCategoryIcon(category);
        const unlockedInCategory = categoryAchievements.filter(a => unlockedIds.has(a.id)).length;

        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CategoryIcon className="h-5 w-5" />
                  {CATEGORY_LABELS[category as AchievementCategory]}
                </CardTitle>
                <Badge variant="outline">
                  {unlockedInCategory}/{categoryAchievements.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  const progress = getAchievementProgress(achievement);
                  const userAchievement = achievements.find(a => a.achievement_id === achievement.id);

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg border transition-all ${
                        isUnlocked
                          ? `bg-gradient-to-br ${getTierGradient(achievement.tier)} border-${achievement.tier === 'gold' ? 'yellow' : achievement.tier === 'silver' ? 'gray' : 'orange'}-500/30`
                          : 'bg-muted/30 border-muted opacity-60'
                      }`}
                    >
                      {/* Lock overlay for locked achievements */}
                      {!isUnlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Achievement Icon */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`text-2xl ${!isUnlocked ? 'grayscale' : ''}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${isUnlocked ? TIER_COLORS[achievement.tier] : ''}`}
                          >
                            {TIER_LABELS[achievement.tier]}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>

                      {/* Progress or Unlocked Date */}
                      {isUnlocked ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-medium">Desbloqueado!</span>
                          <span className="text-muted-foreground">
                            +{achievement.points} pts
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progresso</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {allAchievements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Conquistas em breve!</p>
            <p className="text-sm">Estamos preparando conquistas incriveis para voce</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
