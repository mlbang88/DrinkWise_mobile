import { collection, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { badgeList } from '../utils/data';
import { ExperienceService } from './experienceService';

const normalizeValue = (value) => {
    if (!value && value !== 0) return value;

    if (Array.isArray(value)) {
        return value.map((item) => normalizeValue(item)).sort((a, b) => {
            const first = typeof a === 'object' ? JSON.stringify(a) : a;
            const second = typeof b === 'object' ? JSON.stringify(b) : b;
            if (first < second) return -1;
            if (first > second) return 1;
            return 0;
        });
    }

    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value && typeof value === 'object') {
        const entries = Object.keys(value)
            .sort()
            .map((key) => [key, normalizeValue(value[key])]);
        return Object.fromEntries(entries);
    }

    return value;
};

const isDeepEqual = (a, b) => {
    const normalizedA = normalizeValue(a);
    const normalizedB = normalizeValue(b);
    return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
};

export const badgeService = {
    // DEPRECATED: Utiliser ExperienceService.calculateRealStats à la place
    calculateGlobalStats: (parties, userProfile = null) => {
        console.warn('⚠️ DEPRECATED: badgeService.calculateGlobalStats - Utiliser ExperienceService.calculateRealStats');
        return ExperienceService.calculateRealStats(parties, userProfile);
    },

    // Fonction pour mettre à jour les stats publiques (peut être appelée indépendamment)
    updatePublicStats: async (db, user, appId, userProfile = null) => {
        if (!user) return;

        const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');

        try {
            // Si userProfile n'est pas fourni, on le récupère
            if (!userProfile) {
                const userProfileDoc = await getDoc(userProfileRef);
                userProfile = userProfileDoc.exists() ? userProfileDoc.data() : {};
            }

            const partiesSnapshot = await getDocs(userPartiesRef);
            const allParties = partiesSnapshot.docs.map(doc => doc.data());
            const cumulativeStats = ExperienceService.calculateRealStats(allParties, userProfile);

            // Calculer stats de tournois
            const tournamentsRef = collection(db, `artifacts/${appId}/tournaments`);
            const tournamentsSnapshot = await getDocs(tournamentsRef);
            const allTournaments = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filtrer les tournois auxquels l'utilisateur participe
            const userTournaments = allTournaments.filter(t => 
                t.participants?.includes(user.uid)
            );
            
            // Calculer stats de tournois
            let totalTournamentPoints = 0;
            let tournamentsWon = 0;
            const modeUsage = { moderation: 0, explorer: 0, social: 0, balanced: 0, party: 0 };
            
            userTournaments.forEach(tournament => {
                const userScore = tournament.scores?.[user.uid] || 0;
                totalTournamentPoints += userScore;
                
                // Compter les victoires (si le tournoi est terminé)
                if (tournament.status === 'completed') {
                    const scores = tournament.scores || {};
                    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
                    if (sortedScores.length > 0 && sortedScores[0][0] === user.uid) {
                        tournamentsWon++;
                    }
                }
            });
            
            // Calculer mode favori depuis les soirées
            allParties.forEach(party => {
                const mode = party.battleMode || 'balanced';
                if (modeUsage[mode] !== undefined) {
                    modeUsage[mode]++;
                }
            });
            
            const favoriteMode = Object.entries(modeUsage)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

            const newPublicStats = {
                totalDrinks: cumulativeStats.totalDrinks || 0,
                totalParties: cumulativeStats.totalParties || 0,
                totalFights: cumulativeStats.totalFights || 0,
                totalVomi: cumulativeStats.totalVomi || 0,
                totalVolume: cumulativeStats.totalVolume || 0,
                totalRecal: cumulativeStats.totalRecal || 0,
                totalXP: cumulativeStats.totalXP || 0,
                level: cumulativeStats.level || 1,
                levelName: cumulativeStats.levelName || 'Bronze Novice',
                xpToNextLevel: cumulativeStats.xpToNextLevel || 0,
                progressToNextLevel: Math.round(cumulativeStats.progressToNextLevel || 0),
                mostConsumedDrink: cumulativeStats.mostConsumedDrink || {},
                unlockedBadges: userProfile.unlockedBadges || [],
                challengesCompleted: Object.keys(userProfile.completedChallenges || {}).length,
                totalQuizQuestions: cumulativeStats.totalQuizQuestions || 0,
                username: userProfile.username || 'Utilisateur',
                username_lowercase: (userProfile.username || 'Utilisateur').toLowerCase(),
                isPublic: true,
                // Stats de tournois Battle Royale
                tournamentStats: {
                    totalPoints: totalTournamentPoints,
                    tournamentsParticipated: userTournaments.length,
                    tournamentsWon: tournamentsWon,
                    favoriteMode: favoriteMode,
                    winRate: userTournaments.length > 0 ? Math.round((tournamentsWon / userTournaments.length) * 100) : 0
                }
            };

            const existingPublicStats = userProfile.publicStats || {};

            const { updatedAt: _existingUpdatedAt, ...existingComparable } = existingPublicStats;
            const publicStatsChanged = !isDeepEqual(existingComparable, newPublicStats);

            const profileUpdates = {};

            // publicStats est la source unique de vérité
            // userProfile.xp et userProfile.level sont dépréciés et ne doivent plus être synchronisés

            if ((userProfile.levelName || '') !== cumulativeStats.levelName) {
                profileUpdates.levelName = cumulativeStats.levelName;
            }

            const summaryFields = ['totalParties', 'totalDrinks', 'totalFights', 'totalVomi', 'totalVolume', 'totalRecal'];
            summaryFields.forEach((field) => {
                if ((userProfile[field] || 0) !== cumulativeStats[field]) {
                    profileUpdates[field] = cumulativeStats[field];
                }
            });

            if (publicStatsChanged) {
                profileUpdates.publicStats = {
                    ...newPublicStats,
                    updatedAt: new Date()
                };
            }

            if (Object.keys(profileUpdates).length > 0) {
                await updateDoc(userProfileRef, profileUpdates);
            }

            if (publicStatsChanged) {
                const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
                await setDoc(publicStatsRef, {
                    ...newPublicStats,
                    updatedAt: new Date()
                }, { merge: true });

                console.log("📊 Stats publiques mises à jour:", cumulativeStats);
            }

            return cumulativeStats;
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour des stats publiques:", error);
            return null;
        }
    },

    checkAndAwardBadges: async (db, user, userProfile, appId, newPartyData, setMessageBox) => {
        console.log("🎖️ Début checkAndAwardBadges", { user: !!user, userProfile: !!userProfile, appId, newPartyData });
        
        if (!user || !userProfile) {
            console.log("❌ Pas d'utilisateur ou de profil");
            return { newBadgesCount: 0 };
        }

        const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');

        try {
            const partiesSnapshot = await getDocs(userPartiesRef);
            const allParties = partiesSnapshot.docs.map(doc => doc.data());
            console.log("📊 Parties récupérées:", allParties.length);

            const cumulativeStats = ExperienceService.calculateRealStats(allParties, userProfile);
            console.log("📈 Stats cumulatives:", cumulativeStats);
            
            let updatedBadges = [...(userProfile.unlockedBadges || [])];
            let newBadgesAwarded = [];
            console.log("🏅 Badges actuels:", updatedBadges);

            for (const badgeId in badgeList) {
                const badge = badgeList[badgeId];
                const isAlreadyUnlocked = updatedBadges.includes(badgeId);
                const meetsCriteria = badge.criteria(cumulativeStats, newPartyData);
                
                console.log(`🔍 Badge ${badgeId}: déjà débloqué=${isAlreadyUnlocked}, critères remplis=${meetsCriteria}`);
                
                if (!isAlreadyUnlocked && meetsCriteria) {
                    updatedBadges.push(badgeId);
                    newBadgesAwarded.push(badgeId); // Stocker l'ID au lieu du nom
                    console.log(`✅ Nouveau badge débloqué: ${badge.name}`);
                }
            }

            if (newBadgesAwarded.length > 0) {
                console.log("💾 Sauvegarde des nouveaux badges:", newBadgesAwarded);
                
                const publicStats = {
                    totalDrinks: cumulativeStats.totalDrinks,
                    totalParties: cumulativeStats.totalParties,
                    totalFights: cumulativeStats.totalFights,
                    totalVomi: cumulativeStats.totalVomi,
                    totalVolume: cumulativeStats.totalVolume,
                    unlockedBadges: updatedBadges,
                    username: userProfile.username || 'Utilisateur',
                    username_lowercase: (userProfile.username || 'Utilisateur').toLowerCase(),
                    isPublic: true // Forcer public pour le développement
                };

                await updateDoc(userProfileRef, { 
                    unlockedBadges: updatedBadges,
                    publicStats
                });

                // Mettre à jour les stats publiques pour les amis
                const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
                await setDoc(publicStatsRef, publicStats, { merge: true });

                const badgeNames = newBadgesAwarded.map(id => badgeList[id]?.name).filter(Boolean);
                setMessageBox({ message: `Nouveaux badges débloqués : ${badgeNames.join(', ')}`, type: 'success' });
                return { newBadgesCount: newBadgesAwarded.length, newBadges: newBadgesAwarded };
            } else {
                // Même sans nouveaux badges, mettre à jour les stats publiques
                const publicStats = {
                    ...cumulativeStats,  // Inclut automatiquement XP, level, etc.
                    unlockedBadges: userProfile.unlockedBadges || [],
                    username: userProfile.username || 'Utilisateur',
                    username_lowercase: (userProfile.username || 'Utilisateur').toLowerCase(),
                    isPublic: true // Forcer public pour le développement
                };

                await updateDoc(userProfileRef, { publicStats });

                // Mettre à jour les stats publiques pour les amis
                const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
                await setDoc(publicStatsRef, publicStats, { merge: true });
                
                // Mettre à jour les stats des groupes auxquels l'utilisateur appartient
                await badgeService.updateUserGroupsStats(db, appId, user.uid);
            }
            console.log("📝 Aucun nouveau badge");
            return { newBadgesCount: 0, newBadges: [] };
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des badges:", error);
            setMessageBox({ message: "Erreur lors de la mise à jour des badges.", type: "error" });
            return { newBadgesCount: 0, newBadges: [] };
        }
    },

    /**
     * Met à jour les stats de tous les groupes auxquels appartient un utilisateur
     */
    async updateUserGroupsStats(db, appId, userId) {
        try {
            // Importer dynamiquement pour éviter les dépendances circulaires
            const { groupService } = await import('./groupService');
            
            // Récupérer tous les groupes de l'utilisateur
            const userGroups = await groupService.getUserGroups(db, appId, userId);
            
            // Mettre à jour les stats de chaque groupe
            for (const group of userGroups) {
                await groupService.calculateGroupStats(db, appId, group.id);
                
                // Vérifier et marquer les objectifs complétés
                await groupService.checkGroupGoals(db, appId, group.id);
            }
            
            console.log(`✅ Stats mises à jour pour ${userGroups.length} groupes`);
        } catch (error) {
            console.error('❌ Erreur mise à jour groupes:', error);
        }
    },

    // Obtenir les informations d'un badge
    getBadgeInfo: (badgeId) => {
        return badgeList[badgeId] || {
            name: 'Badge Inconnu',
            description: 'Badge non trouvé',
            icon: '❓',
            tier: 'bronze'
        };
    }
};