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

    // UNIQUE SOURCE: Toujours utiliser les mêmes propriétés
    const stats = {
      totalParties: userProfile?.publicStats?.totalParties ?? 0,
      totalDrinks: userProfile?.publicStats?.totalDrinks ?? 0,
      totalChallenges: userProfile?.publicStats?.challengesCompleted ?? 0,
      totalBadges: userProfile?.unlockedBadges?.length ?? 0,
      totalQuizQuestions: userProfile?.publicStats?.totalQuizQuestions ?? 0
    };

    console.log('🎯 useUserLevel - Stats:', stats);

    // UNIQUE CALCUL: Même formule partout - passer l'objet stats directement
    const xp = ExperienceService.calculateTotalXP(stats);

    const level = ExperienceService.calculateLevel(xp);
    const levelName = ExperienceService.getLevelName(level);
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
    userProfile?.publicStats?.totalParties,
    userProfile?.publicStats?.totalDrinks,
    userProfile?.publicStats?.challengesCompleted,
    userProfile?.publicStats?.totalQuizQuestions,
    userProfile?.unlockedBadges?.length
  ]);
};
