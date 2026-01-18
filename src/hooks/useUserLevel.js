import { useMemo } from 'react';
import { ExperienceService } from '../services/experienceService';

/**
 * Hook centralisé pour calculer le niveau d'un utilisateur
 * SOURCE UNIQUE DE VÉRITÉ pour tous les calculs de niveau
 * 
 * @param {Object} userProfile - Profil utilisateur complet
 * @returns {Object} { level, levelName, xp, xpForNextLevel, progress, stats }
 */
export const useUserLevel = (userProfile) => {
  return useMemo(() => {
    if (!userProfile) {
      return {
        level: 1,
        levelName: 'Débutant',
        xp: 0,
        xpForNextLevel: 100,
        progress: 0,
        stats: {
          totalParties: 0,
          totalDrinks: 0,
          totalChallenges: 0,
          totalBadges: 0,
          totalQuizQuestions: 0
        }
      };
    }

    // ✅ SOURCE UNIQUE DE VÉRITÉ: Utiliser publicStats.totalXP qui est déjà calculé et sauvegardé
    // publicStats est mis à jour par badgeService.updatePublicStats qui calcule le vrai XP depuis toutes les parties
    const xp = userProfile?.publicStats?.totalXP ?? 0;
    const level = userProfile?.publicStats?.level ?? ExperienceService.calculateLevel(xp);
    const levelName = userProfile?.publicStats?.levelName ?? ExperienceService.getLevelName(level);

    // Stats pour affichage
    const stats = {
      totalParties: userProfile?.publicStats?.totalParties ?? 0,
      totalDrinks: userProfile?.publicStats?.totalDrinks ?? 0,
      totalChallenges: userProfile?.publicStats?.challengesCompleted ?? 0,
      totalBadges: userProfile?.unlockedBadges?.length ?? 0,
      totalQuizQuestions: userProfile?.publicStats?.totalQuizQuestions ?? 0
    };

    console.log('🎯 useUserLevel - Utilisation publicStats:', { xp, level, levelName });

    const xpForNextLevel = ExperienceService?.getXpForLevel 
      ? ExperienceService.getXpForLevel(level + 1) 
      : 100;
    const xpForCurrentLevel = ExperienceService?.getXpForLevel 
      ? ExperienceService.getXpForLevel(level) 
      : 0;
    const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    console.log('🎯 useUserLevel - Résultat:', { level, levelName, xp, xpForNextLevel });

    return {
      level,
      levelName,
      xp,
      xpForNextLevel,
      progress,
      stats
    };
  }, [
    userProfile?.publicStats?.totalXP,
    userProfile?.publicStats?.level,
    userProfile?.publicStats?.levelName,
    userProfile?.publicStats?.totalParties,
    userProfile?.publicStats?.totalDrinks,
    userProfile?.publicStats?.challengesCompleted,
    userProfile?.publicStats?.totalQuizQuestions,
    userProfile?.unlockedBadges?.length
  ]);
};
