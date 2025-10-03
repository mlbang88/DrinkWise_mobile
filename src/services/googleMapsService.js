/**
 * Google Maps Service
 * Wrapper pour l'API Google Maps (Places, Geocoding, Maps JavaScript)
 * Gère la recherche de lieux, géocodage et détails de lieux
 */

import { logger } from '../utils/logger';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Configuration des endpoints
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode';

// Cache pour réduire les appels API
const searchCache = new Map();
const detailsCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Recherche de lieux avec autocomplete
 * @param {string} query - Texte de recherche
 * @param {Object} options - Options de recherche
 * @returns {Promise<Array>} Liste de suggestions
 */
export const searchPlaces = async (query, options = {}) => {
  try {
    if (!query || query.length < 3) {
      return [];
    }

    // Vérifier le cache
    const cacheKey = `${query}_${JSON.stringify(options)}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info('📦 Résultats depuis le cache', { query });
      return cached.data;
    }

    const {
      location = null, // { lat, lng }
      radius = 5000, // 5km par défaut
      type = 'bar|restaurant|night_club|cafe',
      language = 'fr',
    } = options;

    // Construction de l'URL
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
      language,
      types: 'establishment',
    });

    // Ajouter location bias si disponible
    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
      params.append('radius', radius);
    }

    const url = `${PLACES_API_BASE}/autocomplete/json?${params}`;
    
    logger.info('🔍 Recherche Google Places', { query, location });
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const results = data.predictions || [];

    // Filtrer par type si nécessaire
    const filteredResults = results.map(prediction => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types || [],
    }));

    // Mettre en cache
    searchCache.set(cacheKey, {
      data: filteredResults,
      timestamp: Date.now(),
    });

    logger.success('✅ Résultats trouvés', { count: filteredResults.length });
    
    return filteredResults;

  } catch (error) {
    logger.error('❌ Erreur searchPlaces', error);
    throw error;
  }
};

/**
 * Récupère les détails complets d'un lieu
 * @param {string} placeId - ID du lieu Google
 * @returns {Promise<Object>} Détails du lieu
 */
export const getPlaceDetails = async (placeId) => {
  try {
    // Vérifier le cache
    const cached = detailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info('📦 Détails depuis le cache', { placeId });
      return cached.data;
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,opening_hours,formatted_phone_number,website,photos',
      language: 'fr',
    });

    const url = `${PLACES_API_BASE}/details/json?${params}`;
    
    logger.info('🏢 Récupération détails lieu', { placeId });
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Place Details error: ${data.status}`);
    }

    const result = data.result;
    
    const venueDetails = {
      placeId: result.place_id,
      name: result.name,
      address: result.formatted_address,
      coordinates: {
        lat: result.geometry?.location?.lat || 0,
        lng: result.geometry?.location?.lng || 0,
      },
      types: result.types || [],
      rating: result.rating || 0,
      totalRatings: result.user_ratings_total || 0,
      priceLevel: result.price_level || 0,
      phoneNumber: result.formatted_phone_number || '',
      website: result.website || '',
      openingHours: result.opening_hours?.weekday_text || [],
      isOpen: result.opening_hours?.open_now || false,
      photos: result.photos?.slice(0, 5).map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })) || [],
    };

    // Mettre en cache
    detailsCache.set(placeId, {
      data: venueDetails,
      timestamp: Date.now(),
    });

    logger.success('✅ Détails récupérés', { name: venueDetails.name });
    
    return venueDetails;

  } catch (error) {
    logger.error('❌ Erreur getPlaceDetails', error);
    throw error;
  }
};

/**
 * Géocode une adresse en coordonnées
 * @param {string} address - Adresse à géocoder
 * @returns {Promise<Object>} Coordonnées { lat, lng }
 */
export const geocodeAddress = async (address) => {
  try {
    const params = new URLSearchParams({
      address,
      key: GOOGLE_MAPS_API_KEY,
      language: 'fr',
    });

    const url = `${GEOCODING_API_BASE}/json?${params}`;
    
    logger.info('📍 Géocodage adresse', { address });
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${data.status}`);
    }

    const location = data.results[0]?.geometry?.location;
    
    if (!location) {
      throw new Error('Aucune coordonnée trouvée');
    }

    const coordinates = {
      lat: location.lat,
      lng: location.lng,
    };

    logger.success('✅ Adresse géocodée', coordinates);
    
    return coordinates;

  } catch (error) {
    logger.error('❌ Erreur geocodeAddress', error);
    throw error;
  }
};

/**
 * Géocode inverse : coordonnées vers adresse
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Adresse formatée
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: GOOGLE_MAPS_API_KEY,
      language: 'fr',
    });

    const url = `${GEOCODING_API_BASE}/json?${params}`;
    
    logger.info('📍 Géocodage inverse', { lat, lng });
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Reverse Geocoding error: ${data.status}`);
    }

    const address = data.results[0]?.formatted_address || 'Adresse inconnue';

    logger.success('✅ Adresse trouvée', { address });
    
    return address;

  } catch (error) {
    logger.error('❌ Erreur reverseGeocode', error);
    throw error;
  }
};

/**
 * Récupère l'URL d'une photo de lieu
 * @param {string} photoReference - Référence de la photo
 * @param {number} maxWidth - Largeur maximale (défaut: 400)
 * @returns {string} URL de la photo
 */
export const getPhotoUrl = (photoReference, maxWidth = 400) => {
  if (!photoReference) return '';
  
  const params = new URLSearchParams({
    photo_reference: photoReference,
    maxwidth: maxWidth,
    key: GOOGLE_MAPS_API_KEY,
  });

  return `${PLACES_API_BASE}/photo?${params}`;
};

/**
 * Récupère la position actuelle de l'utilisateur
 * @returns {Promise<Object>} Position { lat, lng }
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }

    logger.info('📍 Demande de géolocalisation');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        logger.success('✅ Position obtenue', coords);
        resolve(coords);
      },
      (error) => {
        logger.error('❌ Erreur géolocalisation', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Calcule la distance entre deux points (en mètres)
 * Utilise la formule de Haversine
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @returns {number} Distance en mètres
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
};

/**
 * Formate une distance en texte lisible
 * @param {number} meters - Distance en mètres
 * @returns {string} Distance formatée
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Nettoie le cache
 */
export const clearCache = () => {
  searchCache.clear();
  detailsCache.clear();
  logger.info('🗑️ Cache Google Maps nettoyé');
};

/**
 * Vérifie si l'API key est configurée
 * @returns {boolean}
 */
export const isConfigured = () => {
  const configured = !!GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== '';
  if (!configured) {
    logger.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY non configurée');
  }
  return configured;
};

export default {
  searchPlaces,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
  getPhotoUrl,
  getCurrentPosition,
  calculateDistance,
  formatDistance,
  clearCache,
  isConfigured,
};
