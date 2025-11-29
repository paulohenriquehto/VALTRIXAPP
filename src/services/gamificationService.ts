import { supabase } from '@/lib/supabase';
import type {
  Achievement,
  UserAchievement,
  UserStreak,
  UserGamification,
} from '@/types/gamification';
import { LEVEL_THRESHOLDS } from '@/types/gamification';

export class GamificationService {
  // ===== STREAKS =====

  static async getStreaks(userId: string): Promise<UserStreak[]> {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async getStreak(userId: string, streakType: string): Promise<UserStreak | null> {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error);
    }
    return data;
  }

  static async updateStreak(
    userId: string,
    streakType: string,
    date: string
  ): Promise<UserStreak> {
    // Buscar streak atual
    const existing = await this.getStreak(userId, streakType);

    if (!existing) {
      // Criar novo streak
      const { data, error } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_type: streakType,
          current_count: 1,
          longest_count: 1,
          last_activity_date: date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Calcular se é consecutivo
    const lastDate = new Date(existing.last_activity_date || date);
    const currentDate = new Date(date);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newCount = existing.current_count;
    if (diffDays === 1) {
      // Dia consecutivo
      newCount = existing.current_count + 1;
    } else if (diffDays > 1) {
      // Quebrou streak
      newCount = 1;
    }
    // Se diffDays === 0, é o mesmo dia, não incrementa
    // Se diffDays < 0, data no passado, ignorar

    if (diffDays < 0) {
      return existing; // Não atualizar para datas passadas
    }

    const newLongest = Math.max(existing.longest_count, newCount);

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_count: newCount,
        longest_count: newLongest,
        last_activity_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resetStreak(userId: string, streakType: string): Promise<UserStreak | null> {
    const existing = await this.getStreak(userId, streakType);
    if (!existing) return null;

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== ACHIEVEMENTS =====

  static async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('points', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('tier', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking achievement:', error);
    }
    return !!data;
  }

  static async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    // Verificar se já tem
    const hasIt = await this.hasAchievement(userId, achievementId);
    if (hasIt) return null;

    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        progress: 100,
      })
      .select('*, achievement:achievements(*)')
      .single();

    if (error) throw error;
    return data;
  }

  static async checkAndUnlockAchievements(
    userId: string,
    stats: {
      streaks: UserStreak[];
      totals: Record<string, number>;
      todayActivity: Record<string, number>;
    }
  ): Promise<UserAchievement[]> {
    const achievements = await this.getAllAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.requirement_type) {
        case 'streak_days':
          const streak = stats.streaks.find(
            (s) => s.streak_type === achievement.requirement_metric
          );
          if (streak && streak.current_count >= achievement.requirement_value) {
            shouldUnlock = true;
          }
          break;

        case 'total_count':
          const total = stats.totals[achievement.requirement_metric || ''] || 0;
          if (total >= achievement.requirement_value) {
            shouldUnlock = true;
          }
          break;

        case 'single_day':
          const today = stats.todayActivity[achievement.requirement_metric || ''] || 0;
          if (today >= achievement.requirement_value) {
            shouldUnlock = true;
          }
          break;

        case 'total_revenue':
          if ((stats.totals.revenue || 0) >= achievement.requirement_value) {
            shouldUnlock = true;
          }
          break;
      }

      if (shouldUnlock) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        if (unlocked) {
          newlyUnlocked.push(unlocked);
          // Adicionar pontos
          await this.addPoints(userId, achievement.points);
        }
      }
    }

    return newlyUnlocked;
  }

  // ===== PONTOS E NÍVEIS =====

  static async getGamification(userId: string): Promise<UserGamification | null> {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching gamification:', error);
    }
    return data;
  }

  static async initializeGamification(userId: string): Promise<UserGamification> {
    const existing = await this.getGamification(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('user_gamification')
      .insert({
        user_id: userId,
        total_points: 0,
        current_level: 1,
        xp_current: 0,
        xp_to_next_level: 100,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addPoints(userId: string, points: number): Promise<UserGamification> {
    let gamification = await this.getGamification(userId);

    if (!gamification) {
      gamification = await this.initializeGamification(userId);
    }

    const newTotalPoints = gamification.total_points + points;
    const newXpCurrent = gamification.xp_current + points;

    const { data, error } = await supabase
      .from('user_gamification')
      .update({
        total_points: newTotalPoints,
        xp_current: newXpCurrent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gamification.id)
      .select()
      .single();

    if (error) throw error;
    return this.checkLevelUp(data);
  }

  static async updateTotals(
    userId: string,
    totals: Partial<{
      total_contacts: number;
      total_calls: number;
      total_meetings: number;
      total_deals: number;
      total_revenue: number;
    }>
  ): Promise<UserGamification> {
    let gamification = await this.getGamification(userId);

    if (!gamification) {
      gamification = await this.initializeGamification(userId);
    }

    const { data, error } = await supabase
      .from('user_gamification')
      .update({
        ...totals,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gamification.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async checkLevelUp(gamification: UserGamification): Promise<UserGamification> {
    let currentLevel = gamification.current_level;
    let xpCurrent = gamification.xp_current;
    let xpToNext = gamification.xp_to_next_level;

    let leveledUp = false;

    // Verificar level up
    while (xpCurrent >= xpToNext && currentLevel < LEVEL_THRESHOLDS.length) {
      xpCurrent -= xpToNext;
      currentLevel++;
      leveledUp = true;

      // Calcular XP para próximo nível
      const currentThreshold = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel);
      const nextThreshold = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);

      if (currentThreshold && nextThreshold) {
        xpToNext = nextThreshold.xp - currentThreshold.xp;
      } else {
        // Além do nível máximo, usar fórmula exponencial
        xpToNext = Math.round(xpToNext * 1.5);
      }
    }

    if (leveledUp) {
      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          current_level: currentLevel,
          xp_current: xpCurrent,
          xp_to_next_level: xpToNext,
        })
        .eq('id', gamification.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return gamification;
  }

  // ===== HELPERS =====

  static calculateAchievementProgress(
    achievement: Achievement,
    stats: {
      streaks: UserStreak[];
      totals: Record<string, number>;
      todayActivity: Record<string, number>;
    }
  ): number {
    let current = 0;

    switch (achievement.requirement_type) {
      case 'streak_days':
        const streak = stats.streaks.find(
          (s) => s.streak_type === achievement.requirement_metric
        );
        current = streak?.current_count || 0;
        break;

      case 'total_count':
        current = stats.totals[achievement.requirement_metric || ''] || 0;
        break;

      case 'single_day':
        current = stats.todayActivity[achievement.requirement_metric || ''] || 0;
        break;

      case 'total_revenue':
        current = stats.totals.revenue || 0;
        break;
    }

    return Math.min(100, Math.round((current / achievement.requirement_value) * 100));
  }
}
