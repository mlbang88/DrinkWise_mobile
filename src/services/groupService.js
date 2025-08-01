// src/services/groupService.js
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp 
} from 'firebase/firestore';

export const groupService = {
    /**
     * Créer un nouveau groupe
     */
    async createGroup(db, appId, userId, groupData) {
        try {
            const groupRef = await addDoc(collection(db, `artifacts/${appId}/groups`), {
                name: groupData.name,
                description: groupData.description || '',
                createdBy: userId,
                members: [userId], // Le créateur est automatiquement membre
                admins: [userId], // Le créateur est automatiquement admin
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                goals: [], // Objectifs de groupe
                stats: {
                    totalDrinks: 0,
                    totalParties: 0,
                    totalVolume: 0,
                    totalVomi: 0,
                    totalFights: 0,
                    totalRecal: 0,
                    challengesCompleted: 0,
                    totalBadges: 0
                }
            });

            console.log('✅ Groupe créé:', groupRef.id);
            
            // Calculer et mettre à jour les stats du groupe après création
            await this.calculateGroupStats(db, appId, groupRef.id);
            
            return groupRef.id;
        } catch (error) {
            console.error('❌ Erreur création groupe:', error);
            throw error;
        }
    },

    /**
     * Ajouter un membre au groupe
     */
    async addMemberToGroup(db, appId, groupId, userId) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(userId),
                updatedAt: serverTimestamp()
            });
            console.log('✅ Membre ajouté au groupe:', userId);
            
            // Recalculer les stats du groupe après ajout d'un membre
            await this.calculateGroupStats(db, appId, groupId);
        } catch (error) {
            console.error('❌ Erreur ajout membre:', error);
            throw error;
        }
    },

    /**
     * Inviter un membre au groupe par nom d'utilisateur
     */
    async inviteMemberByUsername(db, appId, groupId, username) {
        try {
            // Rechercher l'utilisateur par nom d'utilisateur
            console.log('🔍 Recherche utilisateur:', username);
            const usersRef = collection(db, `artifacts/${appId}/public_user_stats`);
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Utilisateur non trouvé');
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;

            // Vérifier si l'utilisateur est déjà membre
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) {
                throw new Error('Groupe non trouvé');
            }

            const groupData = groupDoc.data();
            if (groupData.members && groupData.members.includes(userId)) {
                throw new Error('Cet utilisateur est déjà membre du groupe');
            }

            // Ajouter l'utilisateur au groupe
            await this.addMemberToGroup(db, appId, groupId, userId);
            console.log('✅ Utilisateur invité avec succès:', username);
            
            return userId;
        } catch (error) {
            console.error('❌ Erreur invitation par username:', error);
            throw error;
        }
    },

    /**
     * Retirer un membre du groupe
     */
    async removeMemberFromGroup(db, appId, groupId, userId) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            await updateDoc(groupRef, {
                members: arrayRemove(userId),
                admins: arrayRemove(userId), // Le retirer aussi des admins
                updatedAt: serverTimestamp()
            });
            console.log('✅ Membre retiré du groupe:', userId);
            
            // Recalculer les stats du groupe après suppression d'un membre
            await this.calculateGroupStats(db, appId, groupId);
        } catch (error) {
            console.error('❌ Erreur suppression membre:', error);
            throw error;
        }
    },

    /**
     * Supprimer le groupe entier (admin seulement)
     */
    async deleteGroup(db, appId, groupId) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            await deleteDoc(groupRef);
            console.log('✅ Groupe supprimé:', groupId);
        } catch (error) {
            console.error('❌ Erreur suppression groupe:', error);
            throw error;
        }
    },

    /**
     * Vérifier si un utilisateur est admin d'un groupe
     */
    isUserAdmin(groupData, userId) {
        return groupData.admins && groupData.admins.includes(userId);
    },

    /**
     * Calculer les stats cumulées du groupe
     */
    async calculateGroupStats(db, appId, groupId) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) {
                throw new Error('Groupe non trouvé');
            }

            const groupData = groupDoc.data();
            const members = groupData.members || [];

            // Récupérer les stats de tous les membres
            const memberStats = [];
            for (const memberId of members) {
                const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, memberId);
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    memberStats.push(statsDoc.data());
                }
            }

            // Calculer les stats cumulées
            const cumulatedStats = {
                totalDrinks: memberStats.reduce((sum, stats) => sum + (stats.totalDrinks || 0), 0),
                totalParties: memberStats.reduce((sum, stats) => sum + (stats.totalParties || 0), 0),
                totalVolume: memberStats.reduce((sum, stats) => sum + (stats.totalVolume || 0), 0),
                totalVomi: memberStats.reduce((sum, stats) => sum + (stats.totalVomi || 0), 0),
                totalFights: memberStats.reduce((sum, stats) => sum + (stats.totalFights || 0), 0),
                totalRecal: memberStats.reduce((sum, stats) => sum + (stats.totalRecal || 0), 0),
                challengesCompleted: memberStats.reduce((sum, stats) => sum + (stats.challengesCompleted || 0), 0),
                totalBadges: memberStats.reduce((sum, stats) => sum + (stats.unlockedBadges?.length || 0), 0),
                memberCount: members.length,
                lastUpdated: serverTimestamp()
            };

            // Mettre à jour les stats du groupe
            await updateDoc(groupRef, {
                stats: cumulatedStats,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Stats du groupe mises à jour:', cumulatedStats);
            return cumulatedStats;
        } catch (error) {
            console.error('❌ Erreur calcul stats groupe:', error);
            throw error;
        }
    },

    /**
     * Récupérer les groupes d'un utilisateur
     */
    async getUserGroups(db, appId, userId) {
        try {
            const groupsRef = collection(db, `artifacts/${appId}/groups`);
            const q = query(groupsRef, where('members', 'array-contains', userId));
            const snapshot = await getDocs(q);
            
            const groups = [];
            snapshot.forEach(doc => {
                groups.push({ id: doc.id, ...doc.data() });
            });

            return groups;
        } catch (error) {
            console.error('❌ Erreur récupération groupes:', error);
            throw error;
        }
    },

    /**
     * Créer un objectif de groupe
     */
    async createGroupGoal(db, appId, groupId, goal) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const goalWithId = {
                id: Date.now().toString(),
                ...goal,
                createdAt: serverTimestamp(),
                isCompleted: false,
                completedAt: null
            };

            await updateDoc(groupRef, {
                goals: arrayUnion(goalWithId),
                updatedAt: serverTimestamp()
            });

            console.log('✅ Objectif de groupe créé:', goalWithId);
            return goalWithId;
        } catch (error) {
            console.error('❌ Erreur création objectif:', error);
            throw error;
        }
    },

    /**
     * Vérifier et marquer les objectifs complétés
     */
    async checkGroupGoals(db, appId, groupId) {
        try {
            const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) return;

            const groupData = groupDoc.data();
            const goals = groupData.goals || [];
            const stats = groupData.stats || {};

            let hasUpdates = false;
            const updatedGoals = goals.map(goal => {
                if (goal.isCompleted) return goal;

                let isCompleted = false;
                
                // Vérifier selon le type d'objectif
                switch (goal.type) {
                    case 'totalDrinks':
                        isCompleted = stats.totalDrinks >= goal.target;
                        break;
                    case 'totalParties':
                        isCompleted = stats.totalParties >= goal.target;
                        break;
                    case 'totalVolume':
                        isCompleted = stats.totalVolume >= goal.target;
                        break;
                    case 'challengesCompleted':
                        isCompleted = stats.challengesCompleted >= goal.target;
                        break;
                    case 'totalBadges':
                        isCompleted = stats.totalBadges >= goal.target;
                        break;
                }

                if (isCompleted && !goal.isCompleted) {
                    hasUpdates = true;
                    return {
                        ...goal,
                        isCompleted: true,
                        completedAt: serverTimestamp()
                    };
                }

                return goal;
            });

            if (hasUpdates) {
                await updateDoc(groupRef, {
                    goals: updatedGoals,
                    updatedAt: serverTimestamp()
                });
                console.log('✅ Objectifs de groupe mis à jour');
            }

            return updatedGoals;
        } catch (error) {
            console.error('❌ Erreur vérification objectifs:', error);
            throw error;
        }
    }
};
