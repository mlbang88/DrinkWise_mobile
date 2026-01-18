import { challengeList } from '../utils/data';
import { ExperienceService } from './experienceService';
import { getWeekId, getMonthId } from '../utils/helpers';

export const challengeService = {
    // ✅ Filtrer parties par période
    filterPartiesByPeriod: (parties, period = 'weekly') => {
        const now = new Date();
        const currentWeekId = getWeekId(now);
        const currentMonthId = getMonthId(now);
        
        return parties.filter(party => {
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
    },

    // Vérifier quels challenges sont complétés
    checkCompletedChallenges: (parties, completedChallenges = {}, userProfile = null) => {
        console.log("🎯 checkCompletedChallenges called:", { partiesCount: parties.length, completedChallenges });
        
        const newlyCompleted = [];
        // ✅ Utiliser ExperienceService.calculateRealStats au lieu de calculatePeriodStats
        const weeklyParties = challengeService.filterPartiesByPeriod(parties, 'weekly');
        const monthlyParties = challengeService.filterPartiesByPeriod(parties, 'monthly');
        const weeklyStats = ExperienceService.calculateRealStats(weeklyParties, userProfile);
        const monthlyStats = ExperienceService.calculateRealStats(monthlyParties, userProfile);

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
    getChallengesWithStatus: (parties, completedChallenges = {}, userProfile = null) => {
        // ✅ Utiliser les nouvelles fonctions au lieu de calculatePeriodStats deprecated
        const weeklyParties = challengeService.filterPartiesByPeriod(parties, 'weekly');
        const monthlyParties = challengeService.filterPartiesByPeriod(parties, 'monthly');
        const weeklyStats = ExperienceService.calculateRealStats(weeklyParties, userProfile);
        const monthlyStats = ExperienceService.calculateRealStats(monthlyParties, userProfile);
        
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
