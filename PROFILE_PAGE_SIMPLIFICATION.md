// SIMPLIFICATION DU SYSTÈME XP - PATCH POUR ProfilePage.jsx
// 
// PROBLÈME IDENTIFIÉ:
// - frozenStats, stableStats, cachedXP créent une complexité inutile
// - Trois sources de vérité différentes causent des bugs d'oscillation
//
// SOLUTION:
// Supprimer les lignes 25-28 et 30-70 de ProfilePage.jsx
// 
// Remplacer le useMemo stats (lignes 82-117) par:

const stats = useMemo(() => {
    // UNE SEULE SOURCE DE VÉRITÉ: publicStats du profil
    const publicStats = userProfile?.publicStats || {};
    
    return {
        totalParties: publicStats.totalParties || 0,
        totalDrinks: publicStats.totalDrinks || 0,
        totalChallenges: publicStats.totalChallenges || Object.keys(userProfile?.completedChallenges || {}).length,
        totalBadges: publicStats.totalBadges || userProfile?.unlockedBadges?.length || 0,
        totalQuizQuestions: publicStats.totalQuizQuestions || 0
    };
}, [userProfile]);

// Supprimer également les lignes 119-147 (tout le debug logging)
// Remplacer par un simple calcul:

const currentXp = ExperienceService.calculateTotalXP(stats);
const currentLevel = ExperienceService.calculateLevel(currentXp);
const currentLevelName = ExperienceService.getLevelName(currentLevel);
const xpForCurrentLevel = ExperienceService.getXpForLevel(currentLevel);
const xpForNextLevel = ExperienceService.getXpForLevel(currentLevel + 1);

// NETTOYAGE LOCALSTORAGE:
// Ajouter dans un useEffect au montage:
useEffect(() => {
    if (user?.uid) {
        // Nettoyer les anciennes données inutiles
        localStorage.removeItem(`frozenStats_${user.uid}`);
        localStorage.removeItem(`stableStats_${user.uid}`);
    }
}, [user?.uid]);

// Supprimer la fonction unfreezeStats() (ligne 73-79)
