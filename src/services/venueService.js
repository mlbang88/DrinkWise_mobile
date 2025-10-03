/**
 * Venue Service
 * Gestion du système de contrôle territorial des lieux
 * Calcul de points, niveaux, et leaderboards
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
    increment,
    Timestamp 
} from 'firebase/firestore';
import { logger } from '../utils/logger';

// Configuration des niveaux de contrôle
export const CONTROL_LEVELS = {
    BRONZE: { min: 0, max: 99, name: 'Bronze', color: '#CD7F32', multiplier: 1.0 },
    ARGENT: { min: 100, max: 249, name: 'Argent', color: '#C0C0C0', multiplier: 1.2 },
    OR: { min: 250, max: 499, name: 'Or', color: '#FFD700', multiplier: 1.5 },
    PLATINE: { min: 500, max: 999, name: 'Platine', color: '#E5E4E2', multiplier: 2.0 },
    DIAMANT: { min: 1000, max: Infinity, name: 'Diamant', color: '#B9F2FF', multiplier: 3.0 }
};

// Configuration des points
const POINTS_CONFIG = {
    BASE_VISIT: 10,                    // Points de base par visite
    NEW_VENUE_BONUS: 50,               // Bonus première visite du lieu
    FIRST_CONTROL_BONUS: 100,          // Bonus première prise de contrôle
    TAKEOVER_BONUS: 75,                // Bonus reprise de contrôle
    DEFENSE_BONUS: 25,                 // Bonus défense de territoire
    STREAK_MULTIPLIER: 0.1,            // +10% par visite consécutive
    COMPETITIVE_MODE_BONUS: 20,        // Bonus mode compétitif
    GROUP_MULTIPLIER: 1.5,             // x1.5 si en groupe
    EXPLORER_MODE_BONUS: 30,           // Bonus mode explorateur
};

/**
 * Détermine le niveau de contrôle basé sur les points
 * @param {number} points - Points totaux
 * @returns {Object} Niveau de contrôle
 */
export const getControlLevel = (points) => {
    for (const [key, level] of Object.entries(CONTROL_LEVELS)) {
        if (points >= level.min && points <= level.max) {
            return { ...level, key };
        }
    }
    return CONTROL_LEVELS.BRONZE;
};

/**
 * Calcule les points gagnés pour une visite de lieu
 * @param {Object} params - Paramètres de calcul
 * @returns {Object} Détails des points gagnés
 */
export const calculateVenueControlPoints = (params) => {
    const {
        isNewVenue = false,           // Première visite globale du lieu
        isFirstUserVisit = false,     // Première visite de l'utilisateur
        currentControlUserId = null,  // ID du contrôleur actuel
        userId,                        // ID de l'utilisateur
        visitStreak = 0,              // Nombre de visites consécutives
        isCompetitiveMode = false,    // Mode compétitif activé
        hasGroup = false,             // En groupe
        battleMode = 'balanced',      // Mode de jeu Battle Royale
    } = params;

    let breakdown = [];
    let totalPoints = 0;

    // Points de base
    totalPoints += POINTS_CONFIG.BASE_VISIT;
    breakdown.push({ label: 'Visite du lieu', points: POINTS_CONFIG.BASE_VISIT });

    // Bonus nouveau lieu
    if (isNewVenue) {
        totalPoints += POINTS_CONFIG.NEW_VENUE_BONUS;
        breakdown.push({ label: '🆕 Nouveau lieu découvert', points: POINTS_CONFIG.NEW_VENUE_BONUS });
    }

    // Bonus première visite utilisateur
    if (isFirstUserVisit && !currentControlUserId) {
        totalPoints += POINTS_CONFIG.FIRST_CONTROL_BONUS;
        breakdown.push({ label: '👑 Première prise de contrôle', points: POINTS_CONFIG.FIRST_CONTROL_BONUS });
    }

    // Bonus takeover (reprendre le contrôle à quelqu'un)
    if (currentControlUserId && currentControlUserId !== userId) {
        totalPoints += POINTS_CONFIG.TAKEOVER_BONUS;
        breakdown.push({ label: '⚔️ Reprise de territoire', points: POINTS_CONFIG.TAKEOVER_BONUS });
    }

    // Bonus défense (conserver le contrôle)
    if (currentControlUserId === userId) {
        totalPoints += POINTS_CONFIG.DEFENSE_BONUS;
        breakdown.push({ label: '🛡️ Défense du territoire', points: POINTS_CONFIG.DEFENSE_BONUS });
    }

    // Multiplicateur de streak
    if (visitStreak > 1) {
        const streakBonus = Math.floor(totalPoints * POINTS_CONFIG.STREAK_MULTIPLIER * (visitStreak - 1));
        totalPoints += streakBonus;
        breakdown.push({ label: `🔥 Série x${visitStreak}`, points: streakBonus });
    }

    // Bonus mode compétitif
    if (isCompetitiveMode) {
        totalPoints += POINTS_CONFIG.COMPETITIVE_MODE_BONUS;
        breakdown.push({ label: '🏆 Mode compétitif', points: POINTS_CONFIG.COMPETITIVE_MODE_BONUS });
    }

    // Multiplicateur de groupe
    if (hasGroup) {
        const groupBonus = Math.floor(totalPoints * (POINTS_CONFIG.GROUP_MULTIPLIER - 1));
        totalPoints += groupBonus;
        breakdown.push({ label: '👥 En groupe', points: groupBonus });
    }

    // Bonus Battle Mode
    if (battleMode === 'explorer') {
        totalPoints += POINTS_CONFIG.EXPLORER_MODE_BONUS;
        breakdown.push({ label: '🗺️ Mode Explorateur', points: POINTS_CONFIG.EXPLORER_MODE_BONUS });
    }

    return {
        totalPoints: Math.round(totalPoints),
        breakdown,
        level: getControlLevel(totalPoints)
    };
};

/**
 * Met à jour le contrôle d'un lieu après une visite
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {Object} params - Paramètres de la visite
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export const updateVenueControl = async (db, appId, params) => {
    const {
        venue,          // Données du lieu (placeId, name, address, coordinates)
        userId,         // ID de l'utilisateur
        username,       // Nom de l'utilisateur
        partyData,      // Données de la soirée
        battleMode = 'balanced',
    } = params;

    if (!venue || !venue.placeId) {
        throw new Error('Données de lieu invalides');
    }

    try {
        logger.info('🗺️ Mise à jour contrôle territorial', { placeId: venue.placeId, userId });

        const venueRef = doc(db, `artifacts/${appId}/venues`, venue.placeId);
        const controlRef = doc(db, `artifacts/${appId}/venueControls`, `${userId}_${venue.placeId}`);
        const userControlsRef = collection(db, `artifacts/${appId}/users/${userId}/venueControls`);

        // Récupérer les données existantes
        const [venueSnap, controlSnap] = await Promise.all([
            getDoc(venueRef),
            getDoc(controlRef)
        ]);

        const venueData = venueSnap.data();
        const controlData = controlSnap.data();

        // Déterminer si c'est une nouvelle visite
        const isNewVenue = !venueData;
        const isFirstUserVisit = !controlData;
        const currentControlUserId = venueData?.currentController?.userId || null;
        const visitStreak = (controlData?.visitStreak || 0) + 1;

        // Calculer les points
        const pointsResult = calculateVenueControlPoints({
            isNewVenue,
            isFirstUserVisit,
            currentControlUserId,
            userId,
            visitStreak,
            isCompetitiveMode: partyData.mode === 'competitive',
            hasGroup: partyData.companions?.type !== 'none',
            battleMode,
        });

        const newTotalPoints = (controlData?.totalPoints || 0) + pointsResult.totalPoints;
        const newLevel = getControlLevel(newTotalPoints);

        // Mettre à jour le document venue
        const venueUpdate = {
            placeId: venue.placeId,
            name: venue.name,
            address: venue.address,
            coordinates: venue.coordinates,
            types: venue.types || [],
            rating: venue.rating || 0,
            totalVisits: increment(1),
            uniqueVisitors: increment(isFirstUserVisit ? 1 : 0),
            lastVisit: Timestamp.now(),
            currentController: {
                userId,
                username,
                controlPoints: newTotalPoints,
                level: newLevel.key,
                since: controlData?.controlledSince || Timestamp.now()
            },
            updatedAt: Timestamp.now()
        };

        if (isNewVenue) {
            venueUpdate.createdAt = Timestamp.now();
            venueUpdate.discoveredBy = { userId, username };
        }

        await setDoc(venueRef, venueUpdate, { merge: true });

        // Mettre à jour le contrôle utilisateur
        const controlUpdate = {
            placeId: venue.placeId,
            venueName: venue.name,
            userId,
            username,
            totalPoints: newTotalPoints,
            visitCount: increment(1),
            visitStreak,
            level: newLevel.key,
            controlledSince: controlData?.controlledSince || Timestamp.now(),
            lastVisit: Timestamp.now(),
            pointsHistory: controlData?.pointsHistory || [],
            updatedAt: Timestamp.now()
        };

        // Ajouter à l'historique
        controlUpdate.pointsHistory = [
            ...(controlData?.pointsHistory || []).slice(-9), // Garder les 9 dernières
            {
                timestamp: Timestamp.now(),
                points: pointsResult.totalPoints,
                totalPoints: newTotalPoints,
                breakdown: pointsResult.breakdown
            }
        ];

        if (isFirstUserVisit) {
            controlUpdate.createdAt = Timestamp.now();
        }

        await setDoc(controlRef, controlUpdate, { merge: true });

        // Ajouter aussi dans la sous-collection de l'utilisateur
        const userControlRef = doc(userControlsRef, venue.placeId);
        await setDoc(userControlRef, controlUpdate, { merge: true });

        logger.info('✅ Contrôle territorial mis à jour', {
            venue: venue.name,
            points: pointsResult.totalPoints,
            total: newTotalPoints,
            level: newLevel.name
        });

        return {
            success: true,
            pointsEarned: pointsResult.totalPoints,
            totalPoints: newTotalPoints,
            level: newLevel,
            breakdown: pointsResult.breakdown,
            isTakeover: currentControlUserId && currentControlUserId !== userId,
            isNewControl: isFirstUserVisit,
            isNewVenue,
            visitStreak
        };

    } catch (error) {
        logger.error('❌ Erreur mise à jour contrôle territorial', error);
        throw error;
    }
};

/**
 * Récupère le leaderboard d'un lieu spécifique
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} placeId - ID du lieu
 * @param {number} limitCount - Nombre de résultats (défaut: 10)
 * @returns {Promise<Array>} Liste des contrôleurs
 */
export const getVenueLeaderboard = async (db, appId, placeId, limitCount = 10) => {
    try {
        logger.info('📊 Chargement leaderboard lieu', { placeId, limit: limitCount });

        const controlsQuery = query(
            collection(db, `artifacts/${appId}/venueControls`),
            where('placeId', '==', placeId),
            orderBy('totalPoints', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(controlsQuery);
        
        const leaderboard = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                rank: index + 1,
                userId: data.userId,
                username: data.username,
                totalPoints: data.totalPoints,
                visitCount: data.visitCount,
                level: getControlLevel(data.totalPoints),
                lastVisit: data.lastVisit,
                isCurrentController: index === 0
            };
        });

        logger.info('✅ Leaderboard chargé', { count: leaderboard.length });
        return leaderboard;

    } catch (error) {
        logger.error('❌ Erreur chargement leaderboard lieu', error);
        return [];
    }
};

/**
 * Récupère tous les lieux contrôlés par un utilisateur
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des lieux contrôlés
 */
export const getUserControlledVenues = async (db, appId, userId) => {
    try {
        logger.info('🏰 Chargement lieux contrôlés', { userId });

        const controlsQuery = query(
            collection(db, `artifacts/${appId}/venueControls`),
            where('userId', '==', userId),
            orderBy('totalPoints', 'desc')
        );

        const snapshot = await getDocs(controlsQuery);
        
        const venues = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                placeId: data.placeId,
                name: data.venueName,
                totalPoints: data.totalPoints,
                visitCount: data.visitCount,
                visitStreak: data.visitStreak,
                level: getControlLevel(data.totalPoints),
                lastVisit: data.lastVisit,
                controlledSince: data.controlledSince
            };
        });

        logger.info('✅ Lieux chargés', { count: venues.length });
        return venues;

    } catch (error) {
        logger.error('❌ Erreur chargement lieux utilisateur', error);
        return [];
    }
};

/**
 * Récupère les statistiques globales de contrôle territorial d'un utilisateur
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Statistiques
 */
export const getUserTerritoryStats = async (db, appId, userId) => {
    try {
        const venues = await getUserControlledVenues(db, appId, userId);
        
        const stats = {
            totalVenues: venues.length,
            totalPoints: venues.reduce((sum, v) => sum + v.totalPoints, 0),
            totalVisits: venues.reduce((sum, v) => sum + v.visitCount, 0),
            levelDistribution: {
                BRONZE: 0,
                ARGENT: 0,
                OR: 0,
                PLATINE: 0,
                DIAMANT: 0
            },
            longestStreak: Math.max(...venues.map(v => v.visitStreak || 0), 0),
            favoriteVenue: venues.length > 0 ? venues[0] : null
        };

        venues.forEach(venue => {
            stats.levelDistribution[venue.level.key]++;
        });

        return stats;

    } catch (error) {
        logger.error('❌ Erreur chargement stats territoriales', error);
        return null;
    }
};

export default {
    calculateVenueControlPoints,
    updateVenueControl,
    getVenueLeaderboard,
    getUserControlledVenues,
    getUserTerritoryStats,
    getControlLevel,
    CONTROL_LEVELS,
};
