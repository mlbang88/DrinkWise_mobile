// Service de gestion des streaks (séries de jours consécutifs)
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';

export class StreakService {
    /**
     * Calcule et met à jour le streak de l'utilisateur
     * @param {Object} db - Instance Firestore
     * @param {string} userId - ID de l'utilisateur
     * @param {string} appId - ID de l'application
     * @returns {Object} - { currentStreak, longestStreak, streakUpdated }
     */
    static async updateStreak(db, userId, appId) {
        try {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                logger.warn('Profil utilisateur introuvable pour streak', { userId });
                return { currentStreak: 0, longestStreak: 0, streakUpdated: false };
            }

            const userData = userDoc.data();
            const now = new Date();
            const today = this.getDateString(now);
            
            const lastStreakDate = userData.lastStreakDate || null;
            const currentStreak = userData.currentStreak || 0;
            const longestStreak = userData.longestStreak || 0;

            // Si c'est le premier streak ou si on a déjà compté aujourd'hui
            if (!lastStreakDate) {
                const newData = {
                    currentStreak: 1,
                    longestStreak: Math.max(1, longestStreak),
                    lastStreakDate: today,
                    lastStreakUpdate: Timestamp.now()
                };
                
                await updateDoc(userRef, newData);
                logger.info('Premier streak initialisé', { userId });
                return { currentStreak: 1, longestStreak: newData.longestStreak, streakUpdated: true };
            }

            // Si on a déjà compté aujourd'hui, ne rien faire
            if (lastStreakDate === today) {
                return { currentStreak, longestStreak, streakUpdated: false };
            }

            // Calculer la différence en jours
            const lastDate = new Date(lastStreakDate);
            const diffTime = now - lastDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let newStreak;
            
            if (diffDays === 1) {
                // Streak continue (hier → aujourd'hui)
                newStreak = currentStreak + 1;
            } else if (diffDays > 1) {
                // Streak cassé, on recommence
                newStreak = 1;
                logger.info('Streak cassé', { userId, diffDays, oldStreak: currentStreak });
            } else {
                // diffDays === 0 (même jour) ou négatif (erreur d'horloge)
                return { currentStreak, longestStreak, streakUpdated: false };
            }

            const newLongestStreak = Math.max(newStreak, longestStreak);

            const updateData = {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastStreakDate: today,
                lastStreakUpdate: Timestamp.now()
            };

            await updateDoc(userRef, updateData);
            
            logger.info('Streak mis à jour', { 
                userId, 
                newStreak, 
                longestStreak: newLongestStreak,
                wasIncreased: newStreak > currentStreak
            });

            return { 
                currentStreak: newStreak, 
                longestStreak: newLongestStreak, 
                streakUpdated: true,
                streakIncreased: newStreak > currentStreak
            };

        } catch (error) {
            logger.error('Erreur mise à jour streak', { userId, error: error.message });
            return { currentStreak: 0, longestStreak: 0, streakUpdated: false };
        }
    }

    /**
     * Récupère le streak actuel de l'utilisateur
     * @param {Object} db - Instance Firestore
     * @param {string} userId - ID de l'utilisateur
     * @param {string} appId - ID de l'application
     * @returns {Object} - { currentStreak, longestStreak, lastStreakDate }
     */
    static async getStreak(db, userId, appId) {
        try {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
            }

            const userData = userDoc.data();
            return {
                currentStreak: userData.currentStreak || 0,
                longestStreak: userData.longestStreak || 0,
                lastStreakDate: userData.lastStreakDate || null
            };
        } catch (error) {
            logger.error('Erreur récupération streak', { userId, error: error.message });
            return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
        }
    }

    /**
     * Vérifie si le streak est en danger (dernier update hier)
     * @param {string} lastStreakDate - Date du dernier streak (format YYYY-MM-DD)
     * @returns {boolean} - true si le streak expire aujourd'hui
     */
    static isStreakInDanger(lastStreakDate) {
        if (!lastStreakDate) return false;

        const lastDate = new Date(lastStreakDate);
        const today = new Date();
        const diffTime = today - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Si le dernier streak était hier, on est en danger de le perdre
        return diffDays === 1;
    }

    /**
     * Obtient les badges liés au streak
     * @param {number} streak - Nombre de jours consécutifs
     * @returns {Array} - Liste des badges débloqués
     */
    static getStreakBadges(streak) {
        const badges = [];
        
        if (streak >= 3) badges.push({ id: 'streak_3', name: 'Régulier', icon: '🔥', minStreak: 3 });
        if (streak >= 7) badges.push({ id: 'streak_7', name: 'Marathonien', icon: '🏃', minStreak: 7 });
        if (streak >= 14) badges.push({ id: 'streak_14', name: 'Acharné', icon: '💪', minStreak: 14 });
        if (streak >= 30) badges.push({ id: 'streak_30', name: 'Légende', icon: '👑', minStreak: 30 });
        if (streak >= 100) badges.push({ id: 'streak_100', name: 'Immortel', icon: '🌟', minStreak: 100 });
        
        return badges;
    }

    /**
     * Formate une date en string YYYY-MM-DD
     * @param {Date} date - Date à formater
     * @returns {string} - Date au format YYYY-MM-DD
     */
    static getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

export default StreakService;
