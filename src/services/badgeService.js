import { collection, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { badgeList, calculateDrinkVolume } from '../utils/data';
import { ExperienceService } from './experienceService';

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

            const publicStats = {
                totalDrinks: cumulativeStats.totalDrinks,
                totalParties: cumulativeStats.totalParties,
                totalFights: cumulativeStats.totalFights,
                totalVomi: cumulativeStats.totalVomi,
                totalVolume: cumulativeStats.totalVolume,
                totalRecal: cumulativeStats.totalRecal,
                challengesCompleted: Object.keys(userProfile.completedChallenges || {}).length,
                unlockedBadges: userProfile.unlockedBadges || [],
                username: userProfile.username || 'Utilisateur',
                username_lowercase: (userProfile.username || 'Utilisateur').toLowerCase(),
                isPublic: true // Forcer public pour le développement
            };

            // Mettre à jour le profil privé
            await updateDoc(userProfileRef, { publicStats });

            // Mettre à jour les stats publiques pour les amis
            const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            await setDoc(publicStatsRef, publicStats, { merge: true });
            
            console.log("📊 Stats publiques mises à jour:", cumulativeStats);
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