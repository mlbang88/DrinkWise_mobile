// src/services/experienceService.js
import { gameplayConfig, calculateDrinkVolume, badgeList } from '../utils/data';
import { collection, doc, updateDoc, setDoc, getDoc, getDocs } from 'firebase/firestore';

export class ExperienceService {
    
    // === CONSTANTES UNIFIÉES ===
    static get CONFIG() {
        return {
            XP_PER_PARTY: 50,
            XP_PER_DRINK: 5, 
            XP_PER_BADGE: 100,
            XP_PER_CHALLENGE: 25,
            XP_PER_QUIZ_QUESTION: 10,
            
            // Multiplicateurs pour incitations
            BATTLE_ROYALE_MULTIPLIER: 1.5,
            GROUP_ACTIVITY_MULTIPLIER: 1.2,
            WEEKEND_MULTIPLIER: 1.1
        };
    }

    // === CALCUL XP UNIFIÉ ===
    static calculateTotalXP(stats) {
        const { 
            totalParties = 0, 
            totalDrinks = 0, 
            totalBadges = 0, 
            totalChallenges = 0,
            totalQuizQuestions = 0
        } = stats;
        
        const xpBreakdown = {
            parties: totalParties * this.CONFIG.XP_PER_PARTY,
            drinks: totalDrinks * this.CONFIG.XP_PER_DRINK,
            badges: totalBadges * this.CONFIG.XP_PER_BADGE,
            challenges: totalChallenges * this.CONFIG.XP_PER_CHALLENGE,
            quiz: totalQuizQuestions * this.CONFIG.XP_PER_QUIZ_QUESTION
        };
        
        const totalXP = xpBreakdown.parties + xpBreakdown.drinks + xpBreakdown.badges + xpBreakdown.challenges + xpBreakdown.quiz;
        
        // Log détaillé pour debug oscillation
        console.log("⚡ ExperienceService - Calcul XP:", {
            stats,
            breakdown: xpBreakdown,
            total: totalXP,
            timestamp: new Date().getTime()
        });
        
        return totalXP;
    }

    // === NIVEAU BASÉ SUR XP ===  
    static calculateLevel(xp) {
        if (xp <= 0) return 1;
        // Formule progressive: niveau 1=0xp, 2=100xp, 3=250xp, 4=450xp, etc.
        const { baseXp, scalingFactor } = gameplayConfig.levelFormula;
        const level = Math.floor((-baseXp + Math.sqrt(baseXp * baseXp + scalingFactor * xp)) / (baseXp * 2)) + 1;
        return Math.max(1, level);
    }

    // === SYNCHRONISATION STATS ===
    static async syncUserStats(db, appId, userId, userProfile) {
        try {
            // 1. Récupérer toutes les données brutes
            const partiesRef = collection(db, `artifacts/${appId}/users/${userId}/parties`);
            const partiesSnapshot = await getDocs(partiesRef);
            const allParties = partiesSnapshot.docs.map(doc => doc.data());
            
            // 2. Calculer stats réelles
            const realStats = this.calculateRealStats(allParties, userProfile);
            
            // 3. Synchroniser PARTOUT en une fois
            await this.updateAllStatsSources(db, appId, userId, realStats);
            
            return realStats;
        } catch (error) {
            console.error('Erreur sync stats:', error);
            throw error;
        }
    }

    // === STATS RÉELLES DEPUIS DONNÉES ===
    static calculateRealStats(parties, userProfile) {
        const stats = {
            totalParties: parties.length,
            totalDrinks: 0,
            totalVolume: 0,
            totalVomi: 0,
            totalFights: 0,
            totalRecal: 0,
            totalBadges: userProfile?.unlockedBadges?.length || 0,
            totalChallenges: Object.keys(userProfile?.completedChallenges || {}).length,
            totalQuizQuestions: 0,
            uniqueLocations: new Set(),
            drinkTypes: {},
            partyTypes: {}
        };

        parties.forEach(party => {
            // Calcul boissons et volume
            party.drinks?.forEach(drink => {
                stats.totalDrinks += drink.quantity || 0;
                stats.drinkTypes[drink.type] = (stats.drinkTypes[drink.type] || 0) + (drink.quantity || 0);
                
                // Calculer volume avec la fonction existante
                const volume = calculateDrinkVolume(drink.type, party.category, drink.quantity || 0);
                stats.totalVolume += volume;
            });
            
            // Autres stats
            stats.totalVomi += party.vomi || 0;
            stats.totalFights += party.fights || 0; 
            stats.totalRecal += party.recal || 0;
            stats.totalQuizQuestions += party.quizResponses?.length || 0;
            
            // Lieux uniques
            if (party.location) {
                stats.uniqueLocations.add(party.location.toLowerCase());
            }
            
            // Types de soirées
            if (party.category) {
                stats.partyTypes[party.category] = (stats.partyTypes[party.category] || 0) + 1;
            }
        });

        // Calcul de la boisson la plus consommée
        let mostConsumedDrink = { type: 'Aucune', quantity: 0, brand: '' };
        let maxQuantity = 0;
        
        for (const drinkType in stats.drinkTypes) {
            if (stats.drinkTypes[drinkType] > maxQuantity) {
                maxQuantity = stats.drinkTypes[drinkType];
                mostConsumedDrink.type = drinkType;
                mostConsumedDrink.quantity = maxQuantity;
            }
        }
        
        // Trouver la marque la plus populaire pour ce type de boisson
        let mostPopularBrand = '';
        let maxBrandCount = 0;
        const brandCombinations = {};
        
        parties.forEach(party => {
            party.drinks?.forEach(drink => {
                if (drink.type === mostConsumedDrink.type && drink.brand) {
                    const key = `${drink.type} - ${drink.brand}`;
                    brandCombinations[key] = (brandCombinations[key] || 0) + (drink.quantity || 0);
                }
            });
        });
        
        for (const combination in brandCombinations) {
            if (combination.startsWith(mostConsumedDrink.type) && brandCombinations[combination] > maxBrandCount) {
                maxBrandCount = brandCombinations[combination];
                mostPopularBrand = combination.split(' - ')[1];
            }
        }
        
        mostConsumedDrink.brand = mostPopularBrand;
        stats.mostConsumedDrink = mostConsumedDrink;
        
        // Calcul des volumes par type de boisson (pour compatibilité)
        stats.drinkVolumes = {};
        parties.forEach(party => {
            party.drinks?.forEach(drink => {
                const volume = calculateDrinkVolume(drink.type, party.category, drink.quantity || 0);
                stats.drinkVolumes[drink.type] = (stats.drinkVolumes[drink.type] || 0) + volume;
            });
        });

        stats.uniqueLocations = stats.uniqueLocations.size;
        stats.totalXP = this.calculateTotalXP(stats);
        stats.level = this.calculateLevel(stats.totalXP);
        stats.levelName = this.getLevelName(stats.level);
        
        // Calcul XP pour niveau suivant
        const nextLevelXp = this.getXpForLevel(stats.level + 1);
        const currentLevelXp = this.getXpForLevel(stats.level);
        stats.xpToNextLevel = nextLevelXp - stats.totalXP;
        stats.progressToNextLevel = ((stats.totalXP - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
        
        return stats;
    }

    // === NOMS DE NIVEAUX DYNAMIQUES ===
    static getLevelName(level) {
        const names = [
            "Novice", "Apprenti", "Habitué", "Connaisseur", "Expert",
            "Vétéran", "Maître", "Champion", "Légende", "Dieu de la Fête"
        ];
        
        if (level <= 10) return names[Math.min(level - 1, 9)];
        if (level <= 25) return `${names[9]} Niveau ${level}`;
        if (level <= 50) return `Titan Niveau ${level}`;
        return `Déité Niveau ${level}`;
    }

    // === XP REQUIS POUR UN NIVEAU ===
    static getXpForLevel(level) {
        if (level <= 1) return 0;
        const { baseXp, scalingFactor } = gameplayConfig.levelFormula;
        // Formule inverse de calculateLevel: xp = ((level-1) * baseXp * 2)^2 / 4 * scalingFactor / baseXp^2
        // Simplifiée: xp = (level-1)^2 * scalingFactor / 4
        const xp = Math.pow(level - 1, 2) * scalingFactor / 4;
        return Math.floor(xp);
    }

    // === MISE À JOUR TOUTES SOURCES ===
    static async updateAllStatsSources(db, appId, userId, stats) {
        const updatePromises = [];
        
        // Source 1: Profil principal
        const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
        updatePromises.push(updateDoc(userProfileRef, {
            xp: stats.totalXP,
            level: stats.level,
            levelName: stats.levelName,
            totalParties: stats.totalParties,
            totalDrinks: stats.totalDrinks,
            publicStats: stats // ← SYNCHRONISER AUSSI ICI
        }));

        // Source 2: Stats publiques 
        const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
        updatePromises.push(setDoc(publicStatsRef, {
            ...stats,
            userId,
            username: stats.username || 'Utilisateur',
            updatedAt: new Date()
        }, { merge: true }));

        // Exécuter en parallèle
        await Promise.all(updatePromises);
    }
}