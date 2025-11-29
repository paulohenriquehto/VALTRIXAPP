// Types for Gamification System - ValtrixApp

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type AchievementCategory = 'streak' | 'volume' | 'conversion' | 'milestone' | 'special';

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement_type: string;
  requirement_value: number;
  requirement_metric: string | null;
  points: number;
  tier: AchievementTier;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement?: Achievement;
  unlocked_at: string;
  progress: number;
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  xp_current: number;
  xp_to_next_level: number;
  total_contacts: number;
  total_calls: number;
  total_meetings: number;
  total_deals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

// Level info
export interface LevelInfo {
  level: number;
  xp: number;
  title: string;
}

// Níveis e XP
export const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, xp: 0, title: 'Iniciante' },
  { level: 2, xp: 100, title: 'Aprendiz' },
  { level: 3, xp: 300, title: 'Prospector' },
  { level: 4, xp: 600, title: 'Vendedor' },
  { level: 5, xp: 1000, title: 'Especialista' },
  { level: 6, xp: 1500, title: 'Profissional' },
  { level: 7, xp: 2200, title: 'Expert' },
  { level: 8, xp: 3000, title: 'Master' },
  { level: 9, xp: 4000, title: 'Elite' },
  { level: 10, xp: 5500, title: 'Lenda' },
];

// Cores para tiers
export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  silver: 'bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600',
  platinum: 'bg-cyan-100 text-cyan-700 border-cyan-400 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-600',
  diamond: 'bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600',
};

// Cores sólidas para ícones
export const TIER_ICON_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#00CED1',
  diamond: '#9400D3',
};

// Labels para tiers
export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante',
};

// Labels para categorias
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: 'Streaks',
  volume: 'Volume',
  conversion: 'Conversão',
  milestone: 'Marcos',
  special: 'Especiais',
};

// Ícones para categorias
export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  streak: 'flame',
  volume: 'trending-up',
  conversion: 'target',
  milestone: 'flag',
  special: 'star',
};

// Milestones de streak
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

// Helper para obter o título do nível atual
export function getLevelTitle(level: number): string {
  const levelInfo = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return levelInfo?.title || 'Desconhecido';
}

// Helper para calcular XP necessário para próximo nível
export function getXpToNextLevel(currentLevel: number): number {
  const currentThreshold = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);

  if (!currentThreshold || !nextThreshold) {
    return 1000; // Default para níveis além do máximo
  }

  return nextThreshold.xp - currentThreshold.xp;
}

// Helper para calcular progresso percentual do nível
export function getLevelProgress(xpCurrent: number, xpToNextLevel: number): number {
  if (xpToNextLevel === 0) return 100;
  return Math.min(100, Math.round((xpCurrent / xpToNextLevel) * 100));
}

// Helper para obter próximo milestone de streak
export function getNextStreakMilestone(currentStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

// Helper para verificar se é um milestone
export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}
