import { challengeList } from '../utils/data';
import { ExperienceService } from './experienceService';
import { getWeekId, getMonthId } from '../utils/helpers';

export const challengeService = {
    // DEPRECATED: Utiliser ExperienceService.calculateRealStats avec filtre de période
    calculatePeriodStats: (parties, period = 'weekly') => {
        console.warn('⚠️ DEPRECATED: challengeService.calculatePeriodStats - Utiliser ExperienceService.calculateRealStats');
        const now = new Date();
        const currentWeekId = getWeekId(now);
        const currentMonthId = getMonthId(now);
        
        const periodParties = parties.filter(party => {
            const partyDate = party.timestamp?.toDate ? party.timestamp.toDate() : new Date(party.date || party.timestamp);
            const partyWeekId = getWeekId(partyDate);
            const partyMonthId = getMonthId(partyDate);
            
            if (period === 'weekly') {
                return partyWeekId === currentWeekId;
            } else if (period === 'monthly') {
                return partyMonthId === currentMonthId;
            }
            return false;
        });

        const stats = {
            totalParties: periodParties.length,
            totalDrinks: 0,
            totalVomi: 0,
            totalFights: 0,
            totalRecal: 0,
            totalGirlsTalkedTo: 0,
            uniqueLocations: new Set(),
            drinkTypes: {},
            partyTypes: {}
        };

        periodParties.forEach(party => {
            if (party.drinks) {
                party.drinks.forEach(drink => {
                    stats.totalDrinks += drink.quantity || 0;
                    stats.drinkTypes[drink.type] = (stats.drinkTypes[drink.type] || 0) + (drink.quantity || 0);
                });
            }
            
            stats.totalVomi += party.vomi || 0;
            stats.totalFights += party.fights || 0;
            stats.totalRecal += party.recal || 0;
            stats.totalGirlsTalkedTo += party.girlsTalkedTo || 0;
            
            if (party.location) {
                stats.uniqueLocations.add(party.location.toLowerCase());
            }
            if (party.category) {
                stats.partyTypes[party.category] = (stats.partyTypes[party.category] || 0) + 1;
            }
        });

        stats.uniqueLocations = stats.uniqueLocations.size;
        return stats;
    },

    // Vérifier quels challenges sont complétés
    checkCompletedChallenges: (parties, completedChallenges = {}) => {
        console.log("🎯 checkCompletedChallenges called:", { partiesCount: parties.length, completedChallenges });
        
        const newlyCompleted = [];
        const weeklyStats = challengeService.calculatePeriodStats(parties, 'weekly');
        const monthlyStats = challengeService.calculatePeriodStats(parties, 'monthly');

        console.log("📊 Stats calculées:", { weeklyStats, monthlyStats });

        Object.values(challengeList).forEach(challenge => {
            const isAlreadyCompleted = completedChallenges[challenge.id];
            
            if (!isAlreadyCompleted) {
                let stats = challenge.type === 'weekly' ? weeklyStats : monthlyStats;
                
                console.log(`🔍 Vérification challenge ${challenge.id}:`, {
                    title: challenge.title,
                    type: challenge.type,
                    stats: stats,
                    target: challenge.target,
                    field: challenge.field,
                    currentValue: challenge.field ? stats[challenge.field] : 'N/A',
                    meetsCondition: challenge.criteria(stats)
                });
                
                if (challenge.criteria(stats)) {
                    console.log(`✅ Challenge complété: ${challenge.id}`);
                    newlyCompleted.push(challenge.id);
                }
            } else {
                console.log(`⏭️ Challenge déjà complété: ${challenge.id}`);
            }
        });

        console.log("🎖️ Nouveaux challenges complétés:", newlyCompleted);
        return newlyCompleted;
    },

    // Obtenir les infos d'un challenge
    getChallengeInfo: (challengeId) => {
        return challengeList[challengeId] || {
            title: 'Challenge Inconnu',
            description: 'Challenge non trouvé',
            xp: 0,
            icon: '❓'
        };
    },

    // Obtenir le statut de tous les challenges
    getChallengesWithStatus: (parties, completedChallenges = {}) => {
        const weeklyStats = challengeService.calculatePeriodStats(parties, 'weekly');
        const monthlyStats = challengeService.calculatePeriodStats(parties, 'monthly');
        
        return Object.values(challengeList).map(challenge => {
            const stats = challenge.type === 'weekly' ? weeklyStats : monthlyStats;
            const isCompleted = completedChallenges[challenge.id] || false;
            const meetsCondition = challenge.criteria(stats);
            const progress = challengeService.calculateProgress(challenge, stats);
            
            return {
                ...challenge,
                isCompleted,
                meetsCondition,
                progress,
                canComplete: meetsCondition && !isCompleted
            };
        });
    },

    // Calculer le progrès d'un challenge
    calculateProgress: (challenge, stats) => {
        const fieldValue = stats[challenge.field] || 0;
        const target = challenge.target || 1;
        const progress = Math.min(fieldValue, target);
        const percentage = Math.round((progress / target) * 100);
        
        return {
            current: fieldValue,
            target,
            percentage
        };
    }
};
