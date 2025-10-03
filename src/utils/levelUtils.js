// Utilitaires pour le système XP et niveaux
// La plupart des fonctions ont été migrées vers ExperienceService
import { ExperienceService } from '../services/experienceService';
import { gameplayConfig } from './data';
import { logger } from './logger.js';

export const levelUtils = {
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
    }
};

// Pour la rétrocompatibilité, on expose les fonctions principales d'ExperienceService
export const calculateLevel = (xp) => ExperienceService.calculateLevel(xp);
export const getLevelInfo = (xp) => {
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
        isMaxLevel: false
    };
};

export const detectLevelUp = (oldXp, newXp) => {
    try {
        if (oldXp === undefined || oldXp === null || newXp === undefined || newXp === null) {
            logger.error('LEVEL', 'XP invalides dans detectLevelUp', { oldXp, newXp });
            return { leveledUp: false, oldLevel: 1, newLevel: 1, levelsGained: 0 };
        }
        
        const safeOldXp = Number(oldXp);
        const safeNewXp = Number(newXp);
        
        if (isNaN(safeOldXp) || isNaN(safeNewXp) || safeOldXp < 0 || safeNewXp < 0) {
            logger.error('LEVEL', 'XP non numériques ou négatifs', { oldXp, newXp });
            return { leveledUp: false, oldLevel: 1, newLevel: 1, levelsGained: 0 };
        }
        
        const oldLevel = ExperienceService.calculateLevel(safeOldXp);
        const newLevel = ExperienceService.calculateLevel(safeNewXp);
        
        if (newLevel > oldLevel) {
            const levelsGained = newLevel - oldLevel;
            logger.info('LEVEL', `Level up détecté ! ${levelsGained} niveau(x) gagné(s) (${oldLevel} → ${newLevel})`);
            
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
        
        return { leveledUp: false, oldLevel, newLevel, levelsGained: 0 };
        
    } catch (error) {
        logger.error('LEVEL', 'Exception dans detectLevelUp', error);
        return { leveledUp: false, oldLevel: 1, newLevel: 1, levelsGained: 0 };
    }
};

