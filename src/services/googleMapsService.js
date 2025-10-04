/**
 * Google Maps Service v2
 * Utilise la bibliothèque JavaScript Google Maps (pas d'appel REST direct)
 * Résout les problèmes CORS en utilisant les services côté client
 */

import { logger } from '../utils/logger';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// État de chargement de l'API
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;
let autocompleteService = null;
let placesService = null;
let geocoder = null;

/**
 * Charge l'API Google Maps JavaScript
 */
const loadGoogleMapsAPI = () => {
  if (googleMapsLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      googleMapsLoaded = true;
      initializeServices();
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=fr`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      initializeServices();
      logger.info('✅ Google Maps API chargée');
      resolve();
    };

    script.onerror = () => {
      googleMapsLoadPromise = null;
      logger.error('❌ Erreur chargement Google Maps API');
      reject(new Error('Échec chargement Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

/**
 * Initialise les services Google Maps
 */
const initializeServices = () => {
  if (!window.google?.maps) return;

  // AutocompleteService pour la recherche
  autocompleteService = new window.google.maps.places.AutocompleteService();
  
  // PlacesService pour les détails (nécessite un div container)
  const container = document.createElement('div');
  placesService = new window.google.maps.places.PlacesService(container);
  
  // Geocoder pour le géocodage
  geocoder = new window.google.maps.Geocoder();
  
  logger.info('✅ Services Google Maps initialisés');
};

/**
 * Recherche de lieux avec autocomplete
 * @param {string} query - Texte de recherche
 * @param {Object} options - Options de recherche
 * @returns {Promise<Array>} Liste de suggestions
 */
export const searchPlaces = async (query, options = {}) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    // Charger l'API si nécessaire
    await loadGoogleMapsAPI();

    if (!autocompleteService) {
      throw new Error('AutocompleteService non initialisé');
    }

    const {
      location = null, // { lat, lng }
      radius = 5000,
      types = ['establishment']
    } = options;

    // Construire les options de recherche
    const request = {
      input: query,
      types,
      componentRestrictions: { country: 'fr' }, // Limiter à la France
    };

    // Ajouter location bias si disponible
    if (location) {
      request.location = new window.google.maps.LatLng(location.lat, location.lng);
      request.radius = radius;
    }

    logger.info('🔍 Recherche Google Places', { query, location });

    // Appel à l'AutocompleteService
    return new Promise((resolve, reject) => {
      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const results = predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting?.main_text || prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text || '',
            types: prediction.types || [],
          }));

          logger.info(`✅ ${results.length} résultats trouvés`);
          resolve(results);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          logger.info('ℹ️ Aucun résultat trouvé');
          resolve([]);
        } else {
          logger.error('❌ Erreur searchPlaces', status);
          reject(new Error(`Erreur Places API: ${status}`));
        }
      });
    });
  } catch (error) {
    logger.error('❌ Erreur searchPlaces', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un lieu
 * @param {string} placeId - ID du lieu
 * @returns {Promise<Object>} Détails du lieu
 */
export const getPlaceDetails = async (placeId) => {
  try {
    await loadGoogleMapsAPI();

    if (!placesService) {
      throw new Error('PlacesService non initialisé');
    }

    logger.info('📍 Récupération détails lieu', { placeId });

    return new Promise((resolve, reject) => {
      placesService.getDetails(
        {
          placeId,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'types',
            'place_id',
            'rating',
            'user_ratings_total',
            'photos',
            'opening_hours',
            'formatted_phone_number',
            'website'
          ]
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const details = {
              placeId: place.place_id,
              name: place.name,
              address: place.formatted_address,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              types: place.types || [],
              rating: place.rating || null,
              totalRatings: place.user_ratings_total || 0,
              phoneNumber: place.formatted_phone_number || null,
              website: place.website || null,
              openingHours: place.opening_hours?.weekday_text || null,
              photos: place.photos?.map(photo => ({
                url: photo.getUrl({ maxWidth: 400 })
              })) || []
            };

            logger.info('✅ Détails lieu obtenus', { name: details.name });
            resolve(details);
          } else {
            logger.error('❌ Erreur getPlaceDetails', status);
            reject(new Error(`Erreur Places API: ${status}`));
          }
        }
      );
    });
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
    await loadGoogleMapsAPI();

    if (!geocoder) {
      throw new Error('Geocoder non initialisé');
    }

    logger.info('🗺️ Géocodage adresse', { address });

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng()
          };

          logger.info('✅ Géocodage réussi', coords);
          resolve(coords);
        } else {
          logger.error('❌ Erreur géocodage', status);
          reject(new Error(`Erreur géocodage: ${status}`));
        }
      });
    });
  } catch (error) {
    logger.error('❌ Erreur geocodeAddress', error);
    throw error;
  }
};

/**
 * Géocode inverse (coordonnées -> adresse)
 * @param {Object} coordinates - { lat, lng }
 * @returns {Promise<string>} Adresse formatée
 */
export const reverseGeocode = async (coordinates) => {
  try {
    await loadGoogleMapsAPI();

    if (!geocoder) {
      throw new Error('Geocoder non initialisé');
    }

    logger.info('🗺️ Géocodage inverse', coordinates);

    const latLng = new window.google.maps.LatLng(coordinates.lat, coordinates.lng);

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          const address = results[0].formatted_address;
          logger.info('✅ Géocodage inverse réussi', { address });
          resolve(address);
        } else {
          logger.error('❌ Erreur géocodage inverse', status);
          reject(new Error(`Erreur géocodage inverse: ${status}`));
        }
      });
    });
  } catch (error) {
    logger.error('❌ Erreur reverseGeocode', error);
    throw error;
  }
};

/**
 * Récupère la position actuelle de l'utilisateur
 * @returns {Promise<Object>} Position { lat, lng, accuracy }
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error = new Error('Géolocalisation non supportée');
      logger.error('❌ Géolocalisation non disponible');
      reject(error);
      return;
    }

    logger.info('📍 Demande de géolocalisation');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        logger.info('✅ Position obtenue', result);
        resolve(result);
      },
      (error) => {
        logger.error('❌ Erreur géolocalisation', error.message);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Export par défaut
export default {
  searchPlaces,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
  getCurrentPosition
};
