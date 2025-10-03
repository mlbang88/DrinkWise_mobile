// src/services/experienceService.js
import { gameplayConfig, calculateDrinkVolume, badgeList } from '../utils/data';
import { collection, doc, updateDoc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import logger from '../utils/logger';

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
            WEEKEND_MULTIPLIER: 1.1,
            
            // Multiplicateurs par style de jeu (battleMode)
            BATTLE_MODE_MULTIPLIERS: {
                'moderation': 1.3,    // 🧠 Bonus pour approche responsable
                'explorer': 1.25,      // ✨ Bonus pour découverte/variété
                'social': 1.2,         // ❤️ Bonus pour organisation sociale
                'balanced': 1.15,      // 🎯 Bonus léger pour équilibre
                'party': 1.1           // ⚡ Bonus minimal (base déjà élevée)
            }
        };
    }

    // === CALCUL XP PAR SOIRÉE (avec battleMode) ===
    static calculatePartyXP(partyData) {
        const { 
            drinks = [], 
            battleMode = 'balanced',
            companions = {},
            location = '',
            duration = 0
        } = partyData;
        
        // XP de base
        let xp = this.CONFIG.XP_PER_PARTY;
        
        // XP des boissons
        xp += drinks.length * this.CONFIG.XP_PER_DRINK;
        
        // Multiplicateur selon le style de jeu
        const modeMultiplier = this.CONFIG.BATTLE_MODE_MULTIPLIERS[battleMode] || 1.0;
        
        // Bonus contextuels selon le mode
        if (battleMode === 'moderation' && drinks.length <= 3) {
            xp += 20; // Bonus modération réelle
        }
        if (battleMode === 'explorer' && location) {
            xp += 15; // Bonus nouveau lieu
        }
        if (battleMode === 'social' && companions?.selectedNames?.length > 0) {
            xp += companions.selectedNames.length * 5; // Bonus compagnons
        }
        if (battleMode === 'party' && drinks.length >= 6) {
            xp += 25; // Bonus endurance
        }
        if (battleMode === 'balanced') {
            // Bonus équilibre si plusieurs aspects présents
            const aspects = [
                drinks.length > 0,
                location !== '',
                companions?.selectedNames?.length > 0,
                duration > 0
            ].filter(Boolean).length;
            xp += aspects * 5;
        }
        
        // Appliquer le multiplicateur du mode
        xp = Math.floor(xp * modeMultiplier);
        
        logger.debug("⚡ XP Soirée calculé:", {
            mode: battleMode,
            baseXP: this.CONFIG.XP_PER_PARTY,
            drinksXP: drinks.length * this.CONFIG.XP_PER_DRINK,
            modeMultiplier,
            totalXP: xp
        });
        
        return xp;
    }

    // === CALCUL XP UNIFIÉ ===
    static calculateTotalXP(stats, multipliers = {}) {
        const { 
            totalParties = 0, 
            totalDrinks = 0, 
            totalBadges = 0, 
            totalChallenges = 0,
            totalQuizQuestions = 0
        } = stats;
        
        // Calcul de base
        const xpBreakdown = {
            parties: totalParties * this.CONFIG.XP_PER_PARTY,
            drinks: totalDrinks * this.CONFIG.XP_PER_DRINK,
            badges: totalBadges * this.CONFIG.XP_PER_BADGE,
            challenges: totalChallenges * this.CONFIG.XP_PER_CHALLENGE,
            quiz: totalQuizQuestions * this.CONFIG.XP_PER_QUIZ_QUESTION
        };
        
        let totalXP = xpBreakdown.parties + xpBreakdown.drinks + xpBreakdown.badges + xpBreakdown.challenges + xpBreakdown.quiz;
        
        // Appliquer les multiplicateurs si présents
        let finalMultiplier = 1.0;
        const appliedMultipliers = [];
        
        if (multipliers.isBattleRoyale) {
            finalMultiplier *= this.CONFIG.BATTLE_ROYALE_MULTIPLIER;
            appliedMultipliers.push(`Battle Royale x${this.CONFIG.BATTLE_ROYALE_MULTIPLIER}`);
        }
        
        if (multipliers.hasCompanions) {
            finalMultiplier *= this.CONFIG.GROUP_ACTIVITY_MULTIPLIER;
            appliedMultipliers.push(`Groupe x${this.CONFIG.GROUP_ACTIVITY_MULTIPLIER}`);
        }
        
        if (multipliers.isWeekend) {
            finalMultiplier *= this.CONFIG.WEEKEND_MULTIPLIER;
            appliedMultipliers.push(`Weekend x${this.CONFIG.WEEKEND_MULTIPLIER}`);
        }
        
        if (finalMultiplier > 1.0) {
            totalXP = Math.floor(totalXP * finalMultiplier);
            logger.debug("⚡ Multiplicateurs XP appliqués:", {
                base: Math.floor(totalXP / finalMultiplier),
                multiplier: finalMultiplier,
                bonus: appliedMultipliers,
                total: totalXP
            });
        }
        
        // Log détaillé pour debug oscillation (seulement en dev)
        logger.debug("⚡ ExperienceService - Calcul XP:", {
            stats,
            breakdown: xpBreakdown,
            multipliers: appliedMultipliers.length > 0 ? appliedMultipliers : 'aucun',
            total: totalXP,
            timestamp: new Date().getTime()
        });
        
        return totalXP;
    }

    // === NIVEAU BASÉ SUR XP ===  
    static calculateLevel(xp) {
        if (xp <= 0 || xp === undefined || xp === null) return 1;
        
        // Vérification de sécurité pour gameplayConfig
        if (!gameplayConfig || !gameplayConfig.levelFormula) {
            logger.warn('⚠️ gameplayConfig.levelFormula manquant, utilisation valeurs par défaut');
            return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
        }
        
        // Formule simplifiée: niveau = floor(sqrt(xp / divisor)) + 1
        // Plus intuitive et facile à comprendre
        const { divisor } = gameplayConfig.levelFormula;
        
        if (!divisor) {
            logger.warn('⚠️ Paramètre divisor manquant, utilisation fallback');
            return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
        }
        
        const level = Math.floor(Math.sqrt(xp / divisor)) + 1;
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
            logger.error('Erreur sync stats:', error);
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
        
        // Calcul XP pour niveau suivant (avec fallback sécurisé)
        const nextLevelXp = this.getXpForLevel(stats.level + 1) || 0;
        const currentLevelXp = this.getXpForLevel(stats.level) || 0;
        stats.xpToNextLevel = Math.max(0, nextLevelXp - stats.totalXP);
        stats.progressToNextLevel = nextLevelXp > currentLevelXp 
            ? Math.round(((stats.totalXP - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
            : 0;
        
        return stats;
    }

    // === NOMS DE NIVEAUX DYNAMIQUES ===
    static getLevelName(level) {
        // Système de tiers pour éviter "Déité Niveau 52"
        const tiers = [
            { max: 10, prefix: 'Bronze', ranks: ['Novice', 'Apprenti', 'Initié', 'Pratiquant', 'Confirmé', 'Expert', 'Maître', 'Vétéran', 'Élite', 'Champion'] },
            { max: 20, prefix: 'Argent', ranks: ['Novice', 'Apprenti', 'Initié', 'Pratiquant', 'Confirmé', 'Expert', 'Maître', 'Vétéran', 'Élite', 'Champion'] },
            { max: 30, prefix: 'Or', ranks: ['Novice', 'Apprenti', 'Initié', 'Pratiquant', 'Confirmé', 'Expert', 'Maître', 'Vétéran', 'Élite', 'Champion'] },
            { max: 40, prefix: 'Platine', ranks: ['Novice', 'Apprenti', 'Initié', 'Pratiquant', 'Confirmé', 'Expert', 'Maître', 'Vétéran', 'Élite', 'Champion'] },
            { max: 50, prefix: 'Diamant', ranks: ['Novice', 'Apprenti', 'Initié', 'Pratiquant', 'Confirmé', 'Expert', 'Maître', 'Vétéran', 'Élite', 'Champion'] },
            { max: Infinity, prefix: 'Légende', ranks: ['Ascendant', 'Transcendant', 'Divin', 'Immortel', 'Éternel', 'Cosmique', 'Omniscient', 'Absolu', 'Infini', 'Déité'] }
        ];
        
        // Trouver le tier approprié
        const tier = tiers.find(t => level <= t.max);
        if (!tier) return `Niveau ${level}`;
        
        // Calculer le rang dans le tier
        const previousTierMax = tiers[tiers.indexOf(tier) - 1]?.max || 0;
        const tierLevel = level - previousTierMax;
        const rankIndex = Math.min(tierLevel - 1, tier.ranks.length - 1);
        const rank = tier.ranks[rankIndex];
        
        // Format: "Bronze Novice" (niveaux 1-10), "Argent Expert" (niveaux 11-20), etc.
        return `${tier.prefix} ${rank}`;
    }

    // === XP REQUIS POUR UN NIVEAU ===
    static getXpForLevel(level) {
        if (level <= 1) return 0;
        
        const divisor = gameplayConfig?.levelFormula?.divisor || 50;
        
        // Formule inverse: xp = (level - 1)^2 * divisor
        // Niveau 1 = 0 XP
        // Niveau 2 = 1^2 * 50 = 50 XP
        // Niveau 3 = 2^2 * 50 = 200 XP
        // Niveau 4 = 3^2 * 50 = 450 XP
        const xp = Math.pow(level - 1, 2) * divisor;
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