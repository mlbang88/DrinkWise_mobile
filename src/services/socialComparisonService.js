// src/services/socialComparisonService.js
import { ExperienceService } from './experienceService';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export class SocialComparisonService {
    
    // === SYNCHRONISATION STATS UTILISATEUR ACTUEL ===
    static async syncCurrentUserStats(db, appId, userId) {
        try {
            // Vérifier que ExperienceService est disponible
            if (!ExperienceService || typeof ExperienceService.syncUserStats !== 'function') {
                console.warn('⚠️ ExperienceService.syncUserStats non disponible');
                return;
            }

            // Récupérer le profil utilisateur
            const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const profileDoc = await getDoc(profileRef);
            const userProfile = profileDoc.exists() ? profileDoc.data() : {};
            
            // Synchroniser les stats via ExperienceService
            await ExperienceService.syncUserStats(db, appId, userId, userProfile);
            console.log("✅ Stats utilisateur synchronisées pour leaderboard");
            
        } catch (error) {
            console.error('❌ Erreur sync stats utilisateur:', error);
            throw error;
        }
    }
    
    // === CLASSEMENT AMIS PAR CATÉGORIE ===
    static async getFriendsLeaderboard(db, appId, userId, category = 'level') {
        try {
            // 1. Récupérer liste d'amis
            const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
            const userDoc = await getDoc(userStatsRef);
            const friends = userDoc.data()?.friends || [];
            
            if (friends.length === 0) return [];
            
            // 2. Récupérer stats de tous les amis + utilisateur
            const allUserIds = [...friends, userId];
            const statsPromises = allUserIds.map(async (id) => {
                const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, id);
                const statsDoc = await getDoc(statsRef);
                return statsDoc.exists() ? { id, ...statsDoc.data() } : null;
            });
            
            const allStats = (await Promise.all(statsPromises)).filter(Boolean);
            
            // 3. Trier selon catégorie
            return this.sortByCategory(allStats, category, userId);
            
        } catch (error) {
            console.error('Erreur leaderboard amis:', error);
            return [];
        }
    }

    // === TRI DYNAMIQUE ===
    static sortByCategory(statsArray, category, currentUserId) {
        const sortFields = {
            'level': (a, b) => (b.level || 0) - (a.level || 0),
            'xp': (a, b) => (b.totalXP || 0) - (a.totalXP || 0),
            'parties': (a, b) => (b.totalParties || 0) - (a.totalParties || 0),
            'badges': (a, b) => (b.totalBadges || 0) - (a.totalBadges || 0),
            'challenges': (a, b) => (b.totalChallenges || 0) - (a.totalChallenges || 0),
            'drinks': (a, b) => (b.totalDrinks || 0) - (a.totalDrinks || 0)
        };

        const sorted = statsArray.sort(sortFields[category] || sortFields.level);
        
        return sorted.map((user, index) => ({
            ...user,
            rank: index + 1,
            isCurrentUser: user.id === currentUserId,
            gap: index > 0 ? this.calculateGap(sorted[index-1], user, category) : 0
        }));
    }

    // === ÉCART AVEC POSITION SUPÉRIEURE ===
    static calculateGap(higher, lower, category) {
        const field = {
            'level': 'level', 
            'xp': 'totalXP',
            'parties': 'totalParties', 
            'badges': 'totalBadges',
            'challenges': 'totalChallenges',
            'drinks': 'totalDrinks'
        }[category] || 'level';
        
        return (higher[field] || 0) - (lower[field] || 0);
    }

    // === COMPARAISON DIRECTE 1v1 ===
    static async compareWithFriend(db, appId, userId, friendId) {
        try {
            const [userStats, friendStats] = await Promise.all([
                this.getUserStats(db, appId, userId),
                this.getUserStats(db, appId, friendId)
            ]);

            return {
                user: this.enrichStatsWithComparison(userStats, friendStats),
                friend: this.enrichStatsWithComparison(friendStats, userStats),
                categories: this.generateComparisonCategories(userStats, friendStats)
            };
        } catch (error) {
            console.error('Erreur comparaison 1v1:', error);
            return null;
        }
    }

    // === STATS UTILISATEUR COMPLÈTES ===
    static async getUserStats(db, appId, userId) {
        const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
        const statsDoc = await getDoc(statsRef);
        return statsDoc.exists() ? statsDoc.data() : {};
    }

    // === ENRICHISSEMENT AVEC COMPARAISON ===
    static enrichStatsWithComparison(userStats, otherStats) {
        const categories = ['level', 'totalXP', 'totalParties', 'totalBadges', 'totalChallenges', 'totalDrinks'];
        
        const comparison = {};
        categories.forEach(cat => {
            const userVal = userStats[cat] || 0;
            const otherVal = otherStats[cat] || 0;
            const diff = userVal - otherVal;
            
            comparison[cat] = {
                value: userVal,
                difference: diff,
                isHigher: diff > 0,
                isEqual: diff === 0,
                percentage: otherVal > 0 ? Math.round((diff / otherVal) * 100) : 0
            };
        });

        return {
            ...userStats,
            comparison
        };
    }

    // === CATÉGORIES DE COMPARAISON ===
    static generateComparisonCategories(userStats, friendStats) {
        return [
            {
                id: 'progression',
                name: 'Progression',
                icon: '📈',
                items: [
                    { key: 'level', name: 'Niveau', user: userStats.level || 0, friend: friendStats.level || 0 },
                    { key: 'totalXP', name: 'Expérience', user: userStats.totalXP || 0, friend: friendStats.totalXP || 0 }
                ]
            },
            {
                id: 'activite',
                name: 'Activité',
                icon: '🎉',
                items: [
                    { key: 'totalParties', name: 'Soirées', user: userStats.totalParties || 0, friend: friendStats.totalParties || 0 },
                    { key: 'totalDrinks', name: 'Verres', user: userStats.totalDrinks || 0, friend: friendStats.totalDrinks || 0 }
                ]
            },
            {
                id: 'accomplissements',
                name: 'Accomplissements',
                icon: '🏆',
                items: [
                    { key: 'totalBadges', name: 'Badges', user: userStats.totalBadges || 0, friend: friendStats.totalBadges || 0 },
                    { key: 'totalChallenges', name: 'Défis', user: userStats.totalChallenges || 0, friend: friendStats.totalChallenges || 0 }
                ]
            }
        ];
    }

    // === DÉFIS ENTRE AMIS ===
    static async createFriendChallenge(db, appId, challengerId, targetId, challengeType, duration = 7) {
        const challengeRef = doc(collection(db, `artifacts/${appId}/friend_challenges`));
        
        const challenge = {
            id: challengeRef.id,
            challengerId,
            targetId,
            type: challengeType, // 'parties_count', 'xp_gain', 'badges_unlock', etc.
            status: 'pending',
            duration, // jours
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
            startStats: {
                challenger: await this.getUserStats(db, appId, challengerId),
                target: await this.getUserStats(db, appId, targetId)
            }
        };

        await setDoc(challengeRef, challenge);
        return challenge.id;
    }

    // === GROUPES : CLASSEMENT INTERNE ===
    static async getGroupLeaderboard(db, appId, groupId, category = 'level') {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const groupDoc = await getDoc(groupRef);
            const members = groupDoc.data()?.members || [];
            
            if (members.length === 0) return [];
            
            const statsPromises = members.map(async (memberId) => {
                const stats = await this.getUserStats(db, appId, memberId);
                return { id: memberId, ...stats };
            });
            
            const allStats = await Promise.all(statsPromises);
            return this.sortByCategory(allStats, category);
            
        } catch (error) {
            console.error('Erreur leaderboard groupe:', error);
            return [];
        }
    }
}