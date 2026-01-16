/**
 * Battle Service
 * Gestion du système de bataille en temps réel
 * Détection de rivaux, scoring, et classements
 */

import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    Timestamp,
    increment,
    deleteDoc
} from 'firebase/firestore';
import { logger } from '../utils/logger';

// Configuration des batailles
export const BATTLE_CONFIG = {
    DETECTION_WINDOW: 30 * 60 * 1000,      // 30 minutes en millisecondes
    MIN_PARTICIPANTS: 2,                    // Minimum 2 joueurs
    MAX_PARTICIPANTS: 10,                   // Maximum 10 joueurs
    WIN_SCORE: 500,                         // Score pour gagner automatiquement
    INACTIVITY_TIMEOUT: 30 * 60 * 1000,    // 30 min d'inactivité = fin
    
    // Points de bataille
    POINTS: {
        DRINK: 50,                          // 50 pts par verre
        SPEED_BONUS_MAX: 50,                // Bonus vitesse maximum
        COMBO_MULTIPLIER: 20,               // +20 pts par drink consécutif
        DEFENSE_BONUS: 100,                 // Défendre son territoire
        CONQUEST_BONUS: 75,                 // Conquérir un nouveau lieu
        VICTORY_BONUS: 50,                  // Bonus de victoire
        PARTICIPATION_BONUS: 10              // Bonus de participation
    }
};

/**
 * Détecte les rivaux actifs à un lieu
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} placeId - ID du lieu Google
 * @param {string} currentUserId - ID de l'utilisateur actuel
 * @returns {Promise<Array>} Liste des rivaux détectés
 */
export const detectRivalsAtVenue = async (db, appId, placeId, currentUserId) => {
    try {
        const now = Date.now();
        const detectionThreshold = now - BATTLE_CONFIG.DETECTION_WINDOW;

        logger.info('🔍 Détection rivaux', { placeId, currentUserId });

        // Récupérer les check-ins récents à ce lieu
        const checksQuery = query(
            collection(db, `artifacts/${appId}/recentCheckins`),
            where('placeId', '==', placeId),
            where('timestamp', '>=', Timestamp.fromMillis(detectionThreshold)),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(checksQuery);
        
        const rivals = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toMillis()
            }))
            .filter(checkin => 
                checkin.userId !== currentUserId &&
                checkin.isCompetitive === true &&
                (now - checkin.timestamp) < BATTLE_CONFIG.DETECTION_WINDOW
            );

        logger.info('✅ Rivaux détectés', { count: rivals.length });
        return rivals;

    } catch (error) {
        logger.error('❌ Erreur détection rivaux', error);
        return [];
    }
};

/**
 * Démarre une nouvelle bataille
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} placeId - ID du lieu
 * @param {string} venueName - Nom du lieu
 * @param {Array} participants - Liste des participants {userId, username}
 * @returns {Promise<string>} ID de la bataille créée
 */
export const startBattle = async (db, appId, placeId, venueName, participants) => {
    try {
        if (participants.length < BATTLE_CONFIG.MIN_PARTICIPANTS) {
            throw new Error(`Minimum ${BATTLE_CONFIG.MIN_PARTICIPANTS} participants requis`);
        }

        const battleId = `battle_${placeId}_${Date.now()}`;
        const battleRef = doc(db, `artifacts/${appId}/battles`, battleId);

        const initialScores = {};
        participants.forEach(p => {
            initialScores[p.userId] = {
                score: 0,
                drinks: 0,
                combo: 0,
                lastDrinkTime: null
            };
        });

        const battleData = {
            battleId,
            placeId,
            venueName,
            participants: participants.map(p => ({
                userId: p.userId,
                username: p.username,
                avatar: p.avatar || null
            })),
            scores: initialScores,
            status: 'active',
            startedAt: Timestamp.now(),
            lastActivity: Timestamp.now(),
            winner: null,
            endedAt: null,
            createdAt: Timestamp.now()
        };

        await setDoc(battleRef, battleData);
        
        logger.info('🔥 Bataille démarrée', { battleId, participants: participants.length });
        return battleId;

    } catch (error) {
        logger.error('❌ Erreur démarrage bataille', error);
        throw error;
    }
};

/**
 * Met à jour le score d'un participant
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} battleId - ID de la bataille
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} action - Action effectuée {type, value}
 * @returns {Promise<Object>} Nouveau score
 */
export const updateBattleScore = async (db, appId, battleId, userId, action) => {
    try {
        const battleRef = doc(db, `artifacts/${appId}/battles`, battleId);
        const battleDoc = await getDoc(battleRef);

        if (!battleDoc.exists()) {
            throw new Error('Bataille introuvable');
        }

        const battleData = battleDoc.data();
        if (battleData.status !== 'active') {
            throw new Error('Bataille terminée');
        }

        const userScore = battleData.scores[userId] || { score: 0, drinks: 0, combo: 0 };
        let pointsGained = 0;

        switch (action.type) {
            case 'drink':
                pointsGained += BATTLE_CONFIG.POINTS.DRINK;
                userScore.drinks += 1;
                
                // Bonus combo si drinks consécutifs rapides (< 5 min)
                const now = Date.now();
                if (userScore.lastDrinkTime && (now - userScore.lastDrinkTime) < 300000) {
                    userScore.combo += 1;
                    pointsGained += userScore.combo * BATTLE_CONFIG.POINTS.COMBO_MULTIPLIER;
                } else {
                    userScore.combo = 0;
                }
                userScore.lastDrinkTime = now;
                break;

            case 'defense':
                pointsGained += BATTLE_CONFIG.POINTS.DEFENSE_BONUS;
                break;

            case 'conquest':
                pointsGained += BATTLE_CONFIG.POINTS.CONQUEST_BONUS;
                break;

            case 'speed':
                pointsGained += Math.min(action.value || 0, BATTLE_CONFIG.POINTS.SPEED_BONUS_MAX);
                break;
        }

        userScore.score += pointsGained;

        // Vérifier si victoire automatique
        let winner = null;
        if (userScore.score >= BATTLE_CONFIG.WIN_SCORE) {
            winner = userId;
        }

        await updateDoc(battleRef, {
            [`scores.${userId}`]: userScore,
            lastActivity: Timestamp.now(),
            ...(winner && { status: 'completed', winner, endedAt: Timestamp.now() })
        });

        logger.info('⚔️ Score mis à jour', { battleId, userId, pointsGained, newScore: userScore.score });

        return { ...userScore, pointsGained, isWinner: !!winner };

    } catch (error) {
        logger.error('❌ Erreur mise à jour score', error);
        throw error;
    }
};

/**
 * Termine une bataille
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} battleId - ID de la bataille
 * @returns {Promise<Object>} Résultats de la bataille
 */
export const endBattle = async (db, appId, battleId) => {
    try {
        const battleRef = doc(db, `artifacts/${appId}/battles`, battleId);
        const battleDoc = await getDoc(battleRef);

        if (!battleDoc.exists()) {
            throw new Error('Bataille introuvable');
        }

        const battleData = battleDoc.data();
        
        // Déterminer le gagnant si pas encore défini
        let winner = battleData.winner;
        if (!winner) {
            const scores = Object.entries(battleData.scores);
            if (scores.length > 0) {
                scores.sort((a, b) => b[1].score - a[1].score);
                winner = scores[0][0];
            }
        }

        // Calculer les résultats finaux
        const results = {
            battleId,
            placeId: battleData.placeId,
            venueName: battleData.venueName,
            winner,
            participants: Object.entries(battleData.scores)
                .map(([userId, scoreData]) => ({
                    userId,
                    username: battleData.participants.find(p => p.userId === userId)?.username,
                    score: scoreData.score,
                    drinks: scoreData.drinks,
                    rank: 0 // Sera calculé après tri
                }))
                .sort((a, b) => b.score - a.score)
                .map((p, index) => ({ ...p, rank: index + 1 })),
            duration: battleData.endedAt 
                ? battleData.endedAt.toMillis() - battleData.startedAt.toMillis()
                : Date.now() - battleData.startedAt.toMillis(),
            startedAt: battleData.startedAt.toDate(),
            endedAt: new Date()
        };

        // Mettre à jour le statut
        await updateDoc(battleRef, {
            status: 'completed',
            winner,
            endedAt: Timestamp.now()
        });

        // Mettre à jour les stats des participants
        await updateParticipantsStats(db, appId, results);

        logger.info('🏆 Bataille terminée', { battleId, winner });
        return results;

    } catch (error) {
        logger.error('❌ Erreur fin de bataille', error);
        throw error;
    }
};

/**
 * Met à jour les statistiques de bataille des participants
 */
const updateParticipantsStats = async (db, appId, results) => {
    try {
        const updates = results.participants.map(async (participant) => {
            const statsRef = doc(db, `artifacts/${appId}/battleStats`, participant.userId);
            const statsDoc = await getDoc(statsRef);

            const isWinner = participant.userId === results.winner;
            const currentStreak = statsDoc.exists() ? statsDoc.data().currentStreak || 0 : 0;
            const longestStreak = statsDoc.exists() ? statsDoc.data().longestWinStreak || 0 : 0;

            const newStreak = isWinner ? currentStreak + 1 : 0;

            await setDoc(statsRef, {
                userId: participant.userId,
                totalBattles: increment(1),
                wins: isWinner ? increment(1) : increment(0),
                losses: !isWinner ? increment(1) : increment(0),
                totalBattlePoints: increment(participant.score),
                currentStreak: newStreak,
                longestWinStreak: Math.max(longestStreak, newStreak),
                lastBattle: Timestamp.now(),
                updatedAt: Timestamp.now()
            }, { merge: true });
        });

        await Promise.all(updates);
        logger.info('✅ Stats de bataille mises à jour', { participants: results.participants.length });

    } catch (error) {
        logger.error('❌ Erreur mise à jour stats bataille', error);
    }
};

/**
 * Récupère une bataille active
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Bataille active ou null
 */
export const getActiveBattle = async (db, appId, userId) => {
    try {
        const battlesQuery = query(
            collection(db, `artifacts/${appId}/battles`),
            where('status', '==', 'active'),
            where(`scores.${userId}`, '!=', null),
            orderBy(`scores.${userId}`, 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(battlesQuery);
        
        if (snapshot.empty) {
            return null;
        }

        const battleData = snapshot.docs[0].data();
        return {
            id: snapshot.docs[0].id,
            ...battleData,
            startedAt: battleData.startedAt?.toDate(),
            lastActivity: battleData.lastActivity?.toDate()
        };

    } catch (error) {
        logger.error('❌ Erreur récupération bataille active', error);
        return null;
    }
};

/**
 * Écoute les mises à jour d'une bataille en temps réel
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} battleId - ID de la bataille
 * @param {Function} callback - Fonction appelée à chaque mise à jour
 * @returns {Function} Fonction pour arrêter l'écoute
 */
export const subscribeToBattle = (db, appId, battleId, callback) => {
    const battleRef = doc(db, `artifacts/${appId}/battles`, battleId);
    
    return onSnapshot(battleRef, (snapshot) => {
        if (snapshot.exists()) {
            const battleData = snapshot.data();
            callback({
                id: snapshot.id,
                ...battleData,
                startedAt: battleData.startedAt?.toDate(),
                lastActivity: battleData.lastActivity?.toDate(),
                endedAt: battleData.endedAt?.toDate()
            });
        } else {
            callback(null);
        }
    }, (error) => {
        logger.error('❌ Erreur écoute bataille', error);
        callback(null);
    });
};

/**
 * Récupère les statistiques de bataille d'un utilisateur
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Statistiques de bataille
 */
export const getUserBattleStats = async (db, appId, userId) => {
    try {
        const statsRef = doc(db, `artifacts/${appId}/battleStats`, userId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            return {
                userId,
                totalBattles: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                currentStreak: 0,
                longestWinStreak: 0,
                totalBattlePoints: 0
            };
        }

        const data = statsDoc.data();
        return {
            ...data,
            winRate: data.totalBattles > 0 ? (data.wins / data.totalBattles) * 100 : 0
        };

    } catch (error) {
        logger.error('❌ Erreur récupération stats bataille', error);
        return null;
    }
};

/**
 * Récupère le leaderboard des batailles
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {number} limitCount - Nombre de résultats
 * @returns {Promise<Array>} Classement des batailles
 */
export const getBattleLeaderboard = async (db, appId, limitCount = 20) => {
    try {
        const statsQuery = query(
            collection(db, `artifacts/${appId}/battleStats`),
            orderBy('wins', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(statsQuery);
        
        const leaderboard = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                rank: index + 1,
                userId: data.userId,
                wins: data.wins || 0,
                losses: data.losses || 0,
                totalBattles: data.totalBattles || 0,
                winRate: data.totalBattles > 0 ? (data.wins / data.totalBattles) * 100 : 0,
                currentStreak: data.currentStreak || 0,
                longestWinStreak: data.longestWinStreak || 0,
                totalBattlePoints: data.totalBattlePoints || 0
            };
        });

        logger.info('✅ Leaderboard batailles chargé', { count: leaderboard.length });
        return leaderboard;

    } catch (error) {
        logger.error('❌ Erreur leaderboard batailles', error);
        return [];
    }
};

export default {
    detectRivalsAtVenue,
    startBattle,
    updateBattleScore,
    endBattle,
    getActiveBattle,
    subscribeToBattle,
    getUserBattleStats,
    getBattleLeaderboard,
    BATTLE_CONFIG
};
