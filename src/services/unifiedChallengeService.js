// src/services/unifiedChallengeService.js
import { ExperienceService } from './experienceService';
import { collection, doc, addDoc, updateDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export class UnifiedChallengeService {
    
    // === TYPES DE CHALLENGES ===
    static get CHALLENGE_TYPES() {
        return {
            // Challenges individuels
            PERSONAL_WEEKLY: 'personal_weekly',
            PERSONAL_MONTHLY: 'personal_monthly', 
            PERSONAL_MILESTONE: 'personal_milestone',
            
            // Challenges sociaux
            FRIEND_DUEL: 'friend_duel',
            GROUP_COLLECTIVE: 'group_collective',
            GLOBAL_COMMUNITY: 'global_community',
            
            // Challenges Battle Royale
            BATTLE_TOURNAMENT: 'battle_tournament',
            BATTLE_MODE_MASTERY: 'battle_mode_mastery'
        };
    }

    // === GÉNÉRATEUR DE CHALLENGES DYNAMIQUES ===
    static generateWeeklyChallenges(userStats, userProfile) {
        const challenges = [];
        const currentLevel = userStats.level || 1;
        
        // Challenge adapté au niveau
        const partiesTarget = Math.max(2, Math.floor(currentLevel / 5) + 1);
        challenges.push({
            id: 'weekly_parties',
            type: this.CHALLENGE_TYPES.PERSONAL_WEEKLY,
            title: 'Socialisateur Hebdomadaire',
            description: `Participer à ${partiesTarget} soirée${partiesTarget > 1 ? 's' : ''} cette semaine`,
            target: partiesTarget,
            field: 'parties_this_week',
            xp: 50 + (currentLevel * 5),
            icon: '🎉',
            difficulty: currentLevel < 10 ? 'easy' : currentLevel < 25 ? 'medium' : 'hard'
        });

        // Challenge évolutif basé sur historique
        const avgDrinksPerParty = userStats.totalParties > 0 ? 
            Math.ceil(userStats.totalDrinks / userStats.totalParties) : 3;
        challenges.push({
            id: 'weekly_moderation',
            type: this.CHALLENGE_TYPES.PERSONAL_WEEKLY,
            title: 'Maître de la Modération',
            description: `Maintenir une moyenne de ${avgDrinksPerParty} verres par soirée maximum`,
            target: avgDrinksPerParty,
            field: 'avg_drinks_per_party',
            xp: 75,
            icon: '🛡️',
            reverse: true // Challenge de limitation
        });

        // Challenge exploration
        if (userStats.uniqueLocations < 10) {
            challenges.push({
                id: 'weekly_explorer',
                type: this.CHALLENGE_TYPES.PERSONAL_WEEKLY,
                title: 'Explorateur de la Nuit',
                description: 'Visiter 2 nouveaux lieux cette semaine',
                target: 2,
                field: 'new_locations_this_week',
                xp: 100,
                icon: '🗺️'
            }); 
        }

        return challenges;
    }

    // === CHALLENGES ENTRE AMIS ===
    static async createFriendDuel(db, appId, challengerId, targetId, challengeData) {
        try {
            const challengeRef = await addDoc(collection(db, `artifacts/${appId}/friend_challenges`), {
                ...challengeData,
                type: this.CHALLENGE_TYPES.FRIEND_DUEL,
                challengerId,
                targetId,
                status: 'pending',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + (challengeData.duration || 7) * 24 * 60 * 60 * 1000),
                
                // Stats de départ pour comparaison
                startingStats: {
                    challenger: await this.getUserCurrentStats(db, appId, challengerId),
                    target: await this.getUserCurrentStats(db, appId, targetId)
                },
                
                // Progression en temps réel
                progress: {
                    challenger: 0,
                    target: 0
                }
            });

            return challengeRef.id;
        } catch (error) {
            console.error('Erreur création duel ami:', error);
            throw error;
        }
    }

    // === CHALLENGES DE GROUPE COLLABORATIFS ===
    static async createGroupChallenge(db, appId, groupId, challengeData) {
        try {
            // Récupérer membres du groupe
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const groupDoc = await getDoc(groupRef);
            const members = groupDoc.data()?.members || [];

            const challengeRef = await addDoc(collection(db, `artifacts/${appId}/group_challenges`), {
                ...challengeData,
                type: this.CHALLENGE_TYPES.GROUP_COLLECTIVE,
                groupId,
                members,
                status: 'active',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + (challengeData.duration || 14) * 24 * 60 * 60 * 1000),
                
                // Objectif collectif
                collectiveTarget: challengeData.target * members.length,
                collectiveProgress: 0,
                
                // Progression individuelle
                memberProgress: members.reduce((acc, memberId) => {
                    acc[memberId] = 0;
                    return acc;
                }, {})
            });

            return challengeRef.id;
        } catch (error) {
            console.error('Erreur création challenge groupe:', error);
            throw error;
        }
    }

    // === INTÉGRATION BATTLE ROYALE ===
    static generateBattleRoyaleChallenges(userBattleStats) {
        const challenges = [];
        
        // Challenge maîtrise de mode
        const weakestMode = this.findWeakestBattleMode(userBattleStats);
        if (weakestMode) {
            challenges.push({
                id: `battle_master_${weakestMode}`,
                type: this.CHALLENGE_TYPES.BATTLE_MODE_MASTERY,
                title: `Maître ${weakestMode}`,
                description: `Gagner 3 tournois en mode ${weakestMode}`,
                target: 3,
                field: `battle_wins_${weakestMode}`,
                xp: 200,
                icon: '⚔️',
                mode: weakestMode
            });
        }

        // Challenge tournoi hebdomadaire
        challenges.push({
            id: 'battle_weekly_participation',
            type: this.CHALLENGE_TYPES.BATTLE_TOURNAMENT,
            title: 'Guerrier Actif',
            description: 'Participer à 5 tournois cette semaine',
            target: 5,
            field: 'battle_tournaments_this_week',
            xp: 150,
            icon: '🏟️'
        });

        return challenges;
    }

    // === SYSTÈME DE VÉRIFICATION UNIFIÉ ===
    static async checkAllChallenges(db, appId, userId, newActivityData) {
        try {
            const completedChallenges = [];
            
            // 1. Challenges personnels
            const personalChallenges = await this.getUserActiveChallenges(db, appId, userId);
            for (const challenge of personalChallenges) {
                if (await this.checkChallengeCompletion(challenge, newActivityData)) {
                    completedChallenges.push(challenge);
                    await this.completePersönalChallenge(db, appId, userId, challenge);
                }
            }

            // 2. Challenges d'amis
            const friendChallenges = await this.getUserFriendChallenges(db, appId, userId);
            for (const challenge of friendChallenges) {
                await this.updateFriendChallengeProgress(db, appId, challenge, userId, newActivityData);
            }

            // 3. Challenges de groupe
            const groupChallenges = await this.getUserGroupChallenges(db, appId, userId);
            for (const challenge of groupChallenges) {
                await this.updateGroupChallengeProgress(db, appId, challenge, userId, newActivityData);
            }

            return completedChallenges;
        } catch (error) {
            console.error('Erreur vérification challenges:', error);
            return [];
        }
    }

    // === MISE À JOUR TEMPS RÉEL ===
    static setupRealtimeProgressTracking(db, appId, userId, onProgressUpdate) {
        const challenges = [];
        
        // Écouter challenges d'amis
        const friendChallengesQuery = query(
            collection(db, `artifacts/${appId}/friend_challenges`),
            where('participants', 'array-contains', userId),
            where('status', 'in', ['pending', 'active'])
        );
        
        challenges.push(onSnapshot(friendChallengesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    onProgressUpdate('friend_challenge', change.doc.data());
                }
            });
        }));

        // Écouter challenges de groupe
        const groupChallengesQuery = query(
            collection(db, `artifacts/${appId}/group_challenges`),
            where('members', 'array-contains', userId),
            where('status', '==', 'active')
        );
        
        challenges.push(onSnapshot(groupChallengesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    onProgressUpdate('group_challenge', change.doc.data());
                }
            });
        }));

        return () => challenges.forEach(unsub => unsub());
    }

    // === UTILITAIRES ===
    static async getUserCurrentStats(db, appId, userId) {
        return await ExperienceService.syncUserStats(db, appId, userId);
    }

    static findWeakestBattleMode(battleStats) {
        const modes = ['moderation', 'explorer', 'social', 'balanced', 'party'];
        let weakest = null;
        let lowestWins = Infinity;
        
        modes.forEach(mode => {
            const wins = battleStats[`${mode}_wins`] || 0;
            if (wins < lowestWins) {
                lowestWins = wins;
                weakest = mode;
            }
        });
        
        return weakest;
    }
}