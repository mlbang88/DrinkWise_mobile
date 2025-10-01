// Utilitaires pour le système XP et niveaux - DEPRECATED
// Utiliser ExperienceService à la place
import { gameplayConfig } from '../utils/data';
import { ExperienceService } from '../services/experienceService';

export const levelUtils = {
    // DEPRECATED: Utiliser ExperienceService.calculateLevel
    calculateLevel: (xp) => {
        console.warn('⚠️ DEPRECATED: levelUtils.calculateLevel - Utiliser ExperienceService.calculateLevel');
        return ExperienceService.calculateLevel(xp);
    },

    // DEPRECATED: Utiliser ExperienceService.getLevelName et getXpForLevel
    getLevelInfo: (xp) => {
        console.warn('⚠️ DEPRECATED: levelUtils.getLevelInfo - Utiliser ExperienceService');
        const level = ExperienceService.calculateLevel(xp);
        const levelName = ExperienceService.getLevelName(level);
        const currentLevelXp = ExperienceService.getXpForLevel(level);
        const nextLevelXp = ExperienceService.getXpForLevel(level + 1);
        
        return {
            level,
            name: levelName,
            currentXp: xp,
            levelXp: currentLevelXp,
            nextLevelXp,
            xpToNext: nextLevelXp - xp,
            isMaxLevel: false // Plus de niveau max avec progression infinie
        };
    },

    // Calculer l'XP total gagné pour une action
    calculateTotalXp: (action, data = {}) => {
        let totalXp = 0;
        
        switch (action) {
            case 'party':
                totalXp += gameplayConfig.xpPerParty;
                // XP bonus pour les questions du quiz
                if (data.questionsAnswered) {
                    totalXp += data.questionsAnswered * 10;
                }
                break;
            
            case 'badge':
                totalXp += gameplayConfig.xpPerBadge * (data.badgeCount || 1);
                break;
            
            case 'challenge':
                totalXp += gameplayConfig.xpPerChallenge * (data.challengeCount || 1);
                break;
                
            default:
                break;
        }
        
        return totalXp;
    },

    // DEPRECATED: Logique à intégrer dans ExperienceService
    detectAllLevelUps: (oldXp, newXp) => {
        console.warn('⚠️ DEPRECATED: levelUtils.detectAllLevelUps - Utiliser ExperienceService');
        const oldLevel = ExperienceService.calculateLevel(oldXp);
        const newLevel = ExperienceService.calculateLevel(newXp);
        
        if (newLevel <= oldLevel) {
            return [];
        }
        
        const levelUps = [];
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            levelUps.push({
                level,
                levelInfo: { level, name: ExperienceService.getLevelName(level) },
                name: ExperienceService.getLevelName(level)
            });
        }
        
        return levelUps;
    },

    // DEPRECATED: Utiliser ExperienceService
    detectLevelUp: (oldXp, newXp) => {
        console.warn('⚠️ DEPRECATED: levelUtils.detectLevelUp - Utiliser ExperienceService');
        const oldLevel = ExperienceService.calculateLevel(oldXp);
        const newLevel = ExperienceService.calculateLevel(newXp);
        
        console.log("🎯 detectLevelUp:", { oldXp, newXp, oldLevel, newLevel });
        
        if (newLevel > oldLevel) {
            const levelsGained = newLevel - oldLevel;
            console.log(`✅ LEVEL UP DÉTECTÉ ! Niveaux gagnés: ${levelsGained} (${oldLevel} → ${newLevel})`);
            return {
                leveledUp: true,
                oldLevel,
                newLevel,
                levelsGained,
                newLevelInfo: { 
                    level: newLevel, 
                    name: ExperienceService.getLevelName(newLevel) 
                }
            };
        }
        
        console.log("❌ Pas de level up");
        return { leveledUp: false };
    }
};
