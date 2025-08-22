// Utilitaires pour le système XP et niveaux
import { gameplayConfig } from '../utils/data';

export const levelUtils = {
    // Calculer le niveau basé sur l'XP
    calculateLevel: (xp) => {
        const levels = gameplayConfig.levels;
        let currentLevel = 1;
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (xp >= levels[i].xp) {
                currentLevel = i + 1;
                break;
            }
        }
        
        return currentLevel;
    },

    // Obtenir les infos du niveau actuel
    getLevelInfo: (xp) => {
        const level = levelUtils.calculateLevel(xp);
        const levelIndex = level - 1;
        const currentLevelData = gameplayConfig.levels[levelIndex];
        const nextLevelData = gameplayConfig.levels[levelIndex + 1];
        
        return {
            level,
            name: currentLevelData.name,
            currentXp: xp,
            levelXp: currentLevelData.xp,
            nextLevelXp: nextLevelData ? nextLevelData.xp : null,
            xpToNext: nextLevelData ? nextLevelData.xp - xp : 0,
            isMaxLevel: !nextLevelData
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

    // Détecter toutes les montées de niveau entre deux points XP
    detectAllLevelUps: (oldXp, newXp) => {
        const oldLevel = levelUtils.calculateLevel(oldXp);
        const newLevel = levelUtils.calculateLevel(newXp);
        
        if (newLevel <= oldLevel) {
            return [];
        }
        
        const levelUps = [];
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            const levelInfo = levelUtils.getLevelInfo(gameplayConfig.levels[level - 1].xp);
            levelUps.push({
                level,
                levelInfo,
                name: gameplayConfig.levels[level - 1].name
            });
        }
        
        return levelUps;
    },

    // Détecter si un niveau a été franchi
    detectLevelUp: (oldXp, newXp) => {
        const oldLevel = levelUtils.calculateLevel(oldXp);
        const newLevel = levelUtils.calculateLevel(newXp);
        
        console.log("🎯 detectLevelUp:", { oldXp, newXp, oldLevel, newLevel });
        
        if (newLevel > oldLevel) {
            const levelsGained = newLevel - oldLevel;
            console.log(`✅ LEVEL UP DÉTECTÉ ! Niveaux gagnés: ${levelsGained} (${oldLevel} → ${newLevel})`);
            return {
                leveledUp: true,
                oldLevel,
                newLevel,
                levelsGained,
                newLevelInfo: levelUtils.getLevelInfo(newXp)
            };
        }
        
        console.log("❌ Pas de level up");
        return { leveledUp: false };
    }
};
