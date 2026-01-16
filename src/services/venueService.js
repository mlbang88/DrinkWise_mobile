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
    DRINK_MULTIPLIER: 2,               // +2 points par verre consommé
    NEW_VENUE_BONUS: 50,               // Bonus première visite du lieu
    FIRST_CONTROL_BONUS: 100,          // Bonus première prise de contrôle
    TAKEOVER_BONUS: 75,                // Bonus reprise de contrôle
    DEFENSE_BONUS: 25,                 // Bonus défense de territoire
    STREAK_MULTIPLIER: 0.1,            // +10% par visite consécutive
    COMPETITIVE_MODE_BONUS: 20,        // Bonus mode compétitif
    GROUP_MULTIPLIER: 1.5,             // x1.5 si en groupe
    EXPLORER_MODE_BONUS: 30,           // Bonus mode explorateur
    
    // Nouveaux bonus de zone
    STREET_CONTROL_BONUS: 150,         // Bonus contrôle d'une rue
    DISTRICT_CONTROL_BONUS: 500,       // Bonus contrôle d'un quartier
    AREA_DOMINATION_MULTIPLIER: 1.3,   // x1.3 si domination de zone
};

// Configuration du contrôle de zones
export const ZONE_CONTROL_CONFIG = {
    STREET_CONTROL_THRESHOLD: 0.6,     // 60% des lieux d'une rue pour la contrôler
    DISTRICT_CONTROL_THRESHOLD: 15,    // 15 lieux dans un quartier pour le contrôler
    MIN_VENUES_FOR_STREET: 3,          // Minimum de lieux dans une rue pour comptabiliser
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
        drinkCount = 0,               // Nombre de verres consommés
        controlsStreet = false,       // Contrôle la rue
        controlsDistrict = false,     // Contrôle le quartier
        districtDomination = 0,       // Pourcentage de domination du quartier (0-1)
    } = params;

    let breakdown = [];
    let totalPoints = 0;

    // Points de base
    totalPoints += POINTS_CONFIG.BASE_VISIT;
    breakdown.push({ label: 'Visite du lieu', points: POINTS_CONFIG.BASE_VISIT });

    // Bonus nombre de verres
    if (drinkCount > 0) {
        const drinkPoints = drinkCount * POINTS_CONFIG.DRINK_MULTIPLIER;
        totalPoints += drinkPoints;
        breakdown.push({ label: `🍺 ${drinkCount} verre${drinkCount > 1 ? 's' : ''}`, points: drinkPoints });
    }

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

    // Bonus contrôle de rue
    if (controlsStreet) {
        totalPoints += POINTS_CONFIG.STREET_CONTROL_BONUS;
        breakdown.push({ label: '🏘️ Contrôle de la rue', points: POINTS_CONFIG.STREET_CONTROL_BONUS });
    }

    // Bonus contrôle de quartier
    if (controlsDistrict) {
        totalPoints += POINTS_CONFIG.DISTRICT_CONTROL_BONUS;
        breakdown.push({ label: '🏙️ Contrôle du quartier', points: POINTS_CONFIG.DISTRICT_CONTROL_BONUS });
    }

    // Multiplicateur de domination de zone
    if (districtDomination > 0.5) {
        const dominationBonus = Math.floor(totalPoints * (POINTS_CONFIG.AREA_DOMINATION_MULTIPLIER - 1));
        totalPoints += dominationBonus;
        const percentage = Math.round(districtDomination * 100);
        breakdown.push({ label: `🌍 Domination ${percentage}%`, points: dominationBonus });
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
            venueAddress: venue.address,
            coordinates: venue.coordinates,
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
        
        // 🔍 LOG DEBUG: Vérifier si le document est bien créé
        logger.debug('venueService: venueControl créé', {
            docId: `${userId}_${venue.placeId}`,
            userId: controlUpdate.userId,
            placeId: controlUpdate.placeId,
            totalPoints: controlUpdate.totalPoints
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
 * @param {string} placeId - ID du lieu (null pour tous les lieux)
 * @param {number} limitCount - Nombre de résultats (défaut: 10)
 * @returns {Promise<Array>} Liste des contrôleurs
 */
export const getVenueLeaderboard = async (db, appId, placeId, limitCount = 10) => {
    try {
        logger.info('📊 Chargement leaderboard lieu', { placeId, limit: limitCount });

        // Construire la requête selon si on filtre par lieu ou pas
        let controlsQuery;
        if (placeId) {
            // Leaderboard pour un lieu spécifique
            controlsQuery = query(
                collection(db, `artifacts/${appId}/venueControls`),
                where('placeId', '==', placeId),
                orderBy('totalPoints', 'desc'),
                limit(limitCount)
            );
        } else {
            // Leaderboard global (tous les lieux) - Récupérer TOUS les contrôles pour agréger par utilisateur
            controlsQuery = query(
                collection(db, `artifacts/${appId}/venueControls`),
                orderBy('totalPoints', 'desc')
            );
        }

        const snapshot = await getDocs(controlsQuery);
        
        if (placeId) {
            // Pour un lieu spécifique, retourner directement les données
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
                    isCurrentController: index === 0,
                    placeId: data.placeId,
                    venueName: data.venueName,
                    venuesCount: 1 // Pour un lieu spécifique, c'est toujours 1
                };
            });
            return leaderboard;
        } else {
            // Pour le leaderboard global, agréger par utilisateur
            const userMap = new Map();
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                
                if (userMap.has(userId)) {
                    // Utilisateur déjà présent, ajouter les points et incrémenter le nombre de lieux
                    const existing = userMap.get(userId);
                    existing.totalPoints += data.totalPoints;
                    existing.venuesCount += 1;
                    existing.visitCount += data.visitCount || 0;
                } else {
                    // Nouvel utilisateur
                    userMap.set(userId, {
                        userId: data.userId,
                        username: data.username,
                        totalPoints: data.totalPoints,
                        visitCount: data.visitCount || 0,
                        venuesCount: 1,
                        lastVisit: data.lastVisit
                    });
                }
            });

            // Convertir en tableau et trier par totalPoints
            const leaderboard = Array.from(userMap.values())
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .slice(0, limitCount)
                .map((user, index) => ({
                    rank: index + 1,
                    userId: user.userId,
                    username: user.username,
                    totalPoints: user.totalPoints,
                    visitCount: user.visitCount,
                    venuesCount: user.venuesCount,
                    level: getControlLevel(user.totalPoints),
                    lastVisit: user.lastVisit,
                    isCurrentController: index === 0
                }));

            logger.info('✅ Leaderboard global chargé', { count: leaderboard.length });
            return leaderboard;
        }

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
        
        logger.debug('venueService: getUserControlledVenues', {
            userId,
            docsCount: snapshot.docs.length
        });
        
        const venues = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                placeId: data.placeId,
                userId: data.userId,
                username: data.username,
                name: data.venueName,
                address: data.venueAddress,
                coordinates: data.coordinates,
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
 * Récupère les lieux contrôlés par d'autres utilisateurs (rivaux)
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur actuel (à exclure)
 * @param {Object} userLocation - Position de l'utilisateur {lat, lng}
 * @param {number} maxDistance - Distance maximale en mètres (5000, 10000, 50000)
 * @returns {Promise<Array>} Liste des lieux contrôlés par les rivaux
 */
export const getRivalControlledVenues = async (db, appId, userId, userLocation, maxDistance = 10000) => {
    try {
        logger.info('⚔️ Chargement lieux rivaux', { userId, maxDistance });

        // Récupérer tous les contrôles sauf ceux de l'utilisateur actuel
        const controlsQuery = query(
            collection(db, `artifacts/${appId}/venueControls`),
            orderBy('totalPoints', 'desc'),
            limit(200) // Limite pour performance
        );

        const snapshot = await getDocs(controlsQuery);
        
        const rivalVenues = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    placeId: data.placeId,
                    userId: data.userId,
                    username: data.username,
                    name: data.venueName,
                    address: data.venueAddress,
                    coordinates: data.coordinates,
                    totalPoints: data.totalPoints,
                    visitCount: data.visitCount,
                    visitStreak: data.visitStreak,
                    level: getControlLevel(data.totalPoints),
                    lastVisit: data.lastVisit,
                    controlledSince: data.controlledSince
                };
            })
            .filter(venue => {
                // Exclure les venues de l'utilisateur actuel
                if (venue.userId === userId) return false;
                
                // Filtrer par distance si une position utilisateur est fournie
                if (userLocation && venue.coordinates) {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        venue.coordinates.lat,
                        venue.coordinates.lng
                    );
                    return distance <= maxDistance;
                }
                
                return true;
            });

        logger.info('✅ Lieux rivaux chargés', { count: rivalVenues.length });
        return rivalVenues;

    } catch (error) {
        logger.error('❌ Erreur chargement lieux rivaux', error);
        return [];
    }
};

/**
 * Calcule la distance entre deux coordonnées (formule Haversine)
 * @param {number} lat1 - Latitude point 1
 * @param {number} lng1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lng2 - Longitude point 2
 * @returns {number} Distance en mètres
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
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

/**
 * Extrait le nom de la rue d'une adresse
 * @param {string} address - Adresse complète
 * @returns {string} Nom de la rue
 */
export const extractStreetName = (address) => {
    if (!address) return '';
    
    // Extraire la partie rue de l'adresse (avant la virgule ou le code postal)
    const parts = address.split(',')[0].trim();
    
    // Supprimer le numéro de rue s'il existe
    const streetName = parts.replace(/^\d+\s*/, '').trim();
    
    return streetName;
};

/**
 * Extrait le quartier/code postal d'une adresse
 * @param {string} address - Adresse complète
 * @returns {string} Quartier ou code postal
 */
export const extractDistrict = (address) => {
    if (!address) return '';
    
    // Chercher un code postal français (5 chiffres)
    const postalCodeMatch = address.match(/\b(\d{5})\b/);
    if (postalCodeMatch) {
        return postalCodeMatch[1];
    }
    
    // Sinon, prendre la ville (dernière partie)
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
};

/**
 * Calcule si l'utilisateur contrôle une rue
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @param {string} streetName - Nom de la rue
 * @returns {Promise<Object>} Résultat du contrôle
 */
export const checkStreetControl = async (db, appId, userId, streetName) => {
    try {
        if (!streetName) return { controls: false, percentage: 0, total: 0, controlled: 0 };

        // Récupérer tous les lieux de cette rue
        const venuesQuery = query(
            collection(db, `artifacts/${appId}/venues`),
            where('street', '==', streetName)
        );
        const venuesSnapshot = await getDocs(venuesQuery);
        
        const totalVenues = venuesSnapshot.size;
        
        if (totalVenues < ZONE_CONTROL_CONFIG.MIN_VENUES_FOR_STREET) {
            return { controls: false, percentage: 0, total: totalVenues, controlled: 0 };
        }

        // Compter combien sont contrôlés par l'utilisateur
        let controlledByUser = 0;
        venuesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.currentController?.userId === userId) {
                controlledByUser++;
            }
        });

        const percentage = controlledByUser / totalVenues;
        const controls = percentage >= ZONE_CONTROL_CONFIG.STREET_CONTROL_THRESHOLD;

        return {
            controls,
            percentage,
            total: totalVenues,
            controlled: controlledByUser,
            streetName
        };

    } catch (error) {
        logger.error('❌ Erreur vérification contrôle rue', error);
        return { controls: false, percentage: 0, total: 0, controlled: 0 };
    }
};

/**
 * Calcule si l'utilisateur contrôle un quartier
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @param {string} district - Code postal ou nom du quartier
 * @returns {Promise<Object>} Résultat du contrôle
 */
export const checkDistrictControl = async (db, appId, userId, district) => {
    try {
        if (!district) return { controls: false, percentage: 0, total: 0, controlled: 0 };

        // Récupérer tous les lieux du quartier
        const venuesQuery = query(
            collection(db, `artifacts/${appId}/venues`),
            where('district', '==', district)
        );
        const venuesSnapshot = await getDocs(venuesQuery);
        
        const totalVenues = venuesSnapshot.size;

        // Compter combien sont contrôlés par l'utilisateur
        let controlledByUser = 0;
        venuesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.currentController?.userId === userId) {
                controlledByUser++;
            }
        });

        const percentage = controlledByUser / totalVenues;
        const controls = controlledByUser >= ZONE_CONTROL_CONFIG.DISTRICT_CONTROL_THRESHOLD;

        return {
            controls,
            percentage,
            total: totalVenues,
            controlled: controlledByUser,
            district
        };

    } catch (error) {
        logger.error('❌ Erreur vérification contrôle quartier', error);
        return { controls: false, percentage: 0, total: 0, controlled: 0 };
    }
};

/**
 * Récupère toutes les zones contrôlées par un utilisateur
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Zones contrôlées
 */
export const getUserControlledZones = async (db, appId, userId) => {
    try {
        const venues = await getUserControlledVenues(db, appId, userId);
        
        // Grouper par rue et quartier
        const streetGroups = {};
        const districtGroups = {};

        for (const venue of venues) {
            // Extraire rue et quartier depuis l'adresse
            const street = extractStreetName(venue.address || '');
            const district = extractDistrict(venue.address || '');

            if (street) {
                if (!streetGroups[street]) streetGroups[street] = [];
                streetGroups[street].push(venue);
            }

            if (district) {
                if (!districtGroups[district]) districtGroups[district] = [];
                districtGroups[district].push(venue);
            }
        }

        // Vérifier le contrôle pour chaque rue
        const controlledStreets = [];
        for (const [streetName, venues] of Object.entries(streetGroups)) {
            const control = await checkStreetControl(db, appId, userId, streetName);
            if (control.controls) {
                controlledStreets.push({
                    name: streetName,
                    venues: venues.length,
                    ...control
                });
            }
        }

        // Vérifier le contrôle pour chaque quartier
        const controlledDistricts = [];
        for (const [district, venues] of Object.entries(districtGroups)) {
            const control = await checkDistrictControl(db, appId, userId, district);
            if (control.controls) {
                controlledDistricts.push({
                    name: district,
                    venues: venues.length,
                    ...control
                });
            }
        }

        return {
            streets: controlledStreets,
            districts: controlledDistricts,
            totalZones: controlledStreets.length + controlledDistricts.length
        };

    } catch (error) {
        logger.error('❌ Erreur récupération zones contrôlées', error);
        return { streets: [], districts: [], totalZones: 0 };
    }
};

// Export default pour compatibilité (mais utiliser les exports nommés est préférable)
export default {
    calculateVenueControlPoints,
    updateVenueControl,
    getVenueLeaderboard,
    getUserControlledVenues,
    getRivalControlledVenues,
    getUserTerritoryStats,
    getUserControlledZones,
    checkStreetControl,
    checkDistrictControl,
    extractStreetName,
    extractDistrict,
    getControlLevel,
    CONTROL_LEVELS,
    ZONE_CONTROL_CONFIG,
};
