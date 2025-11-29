import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, Sparkles } from 'lucide-react';
import type { UserAchievement } from '@/types/gamification';
import { TIER_COLORS, TIER_LABELS } from '@/types/gamification';

interface AchievementToastProps {
  achievements: UserAchievement[];
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievements,
  onDismiss,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentAchievement = achievements[currentIndex];

  useEffect(() => {
    // Auto-advance through achievements
    if (achievements.length > 1) {
      const timer = setTimeout(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex(i => i + 1);
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, achievements.length]);

  // Auto-dismiss after last achievement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex === achievements.length - 1) {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, achievements.length, onDismiss]);

  if (!currentAchievement || !isVisible) return null;

  const achievement = currentAchievement.achievement;
  if (!achievement) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <Card className="w-80 border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 shadow-xl">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              <span className="text-sm font-medium text-yellow-600">Conquista Desbloqueada!</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Achievement Info */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{achievement.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold">{achievement.name}</h4>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={TIER_COLORS[achievement.tier]}
                >
                  {TIER_LABELS[achievement.tier]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  +{achievement.points} pontos
                </span>
              </div>
            </div>
          </div>

          {/* Progress indicator for multiple achievements */}
          {achievements.length > 1 && (
            <div className="flex justify-center gap-1 mt-4">
              {achievements.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-yellow-500'
                      : index < currentIndex
                      ? 'bg-yellow-500/50'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
