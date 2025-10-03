import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, X, Star, DollarSign, Clock, ExternalLink } from 'lucide-react';
import googleMapsService from '../services/googleMapsService';
import { logger } from '../utils/logger';

/**
 * VenueSearchModal
 * Modal de recherche de lieux avec Google Places API
 * Autocomplete + géolocalisation + détails
 */
const VenueSearchModal = ({ isOpen, onClose, onVenueSelect, initialValue = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus automatique sur l'input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Récupérer la position de l'utilisateur au montage
  useEffect(() => {
    if (isOpen) {
      getUserLocation();
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    // Clear timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Nouveau timeout (debounce 300ms)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, userLocation]);

  const getUserLocation = async () => {
    try {
      const position = await googleMapsService.getCurrentPosition();
      setUserLocation(position);
      logger.info('📍 Position utilisateur obtenue', position);
    } catch (err) {
      logger.warn('⚠️ Impossible d\'obtenir la position', err);
      // Continuer sans géolocalisation
    }
  };

  const performSearch = async (query) => {
    if (!googleMapsService.isConfigured()) {
      setError('Google Maps API non configurée');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const options = userLocation
        ? { location: userLocation, radius: 5000 }
        : {};

      const results = await googleMapsService.searchPlaces(query, options);
      setSuggestions(results);

      if (results.length === 0) {
        setError('Aucun lieu trouvé');
      }
    } catch (err) {
      logger.error('❌ Erreur recherche', err);
      setError('Erreur lors de la recherche');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setIsLoadingDetails(true);
    setError(null);

    try {
      const details = await googleMapsService.getPlaceDetails(suggestion.placeId);
      setSelectedVenue(details);
      setSuggestions([]);
      setSearchQuery(details.name);
    } catch (err) {
      logger.error('❌ Erreur chargement détails', err);
      setError('Impossible de charger les détails du lieu');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirm = () => {
    if (selectedVenue) {
      onVenueSelect(selectedVenue);
      // onClose est maintenant appelé dans onVenueSelect du parent
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedVenue(null);
    setSuggestions([]);
    setError(null);
    inputRef.current?.focus();
  };

  const renderPriceLevel = (level) => {
    if (!level) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: level }).map((_, i) => (
          <DollarSign key={i} size={14} className="text-green-400" />
        ))}
        {Array.from({ length: 4 - level }).map((_, i) => (
          <DollarSign key={i + level} size={14} className="text-gray-600" />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-violet-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <MapPin className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Rechercher un lieu</h2>
              <p className="text-white/80 text-sm">Bars, restaurants, clubs...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom du bar, restaurant, club..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-24 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
            {userLocation && (
              <button
                onClick={getUserLocation}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors p-2 hover:bg-violet-500/10 rounded-lg"
                title="Utiliser ma position"
              >
                <Navigation size={18} />
              </button>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <p className="text-gray-400 mt-2">Recherche en cours...</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && !selectedVenue && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">
                {suggestions.length} résultat{suggestions.length > 1 ? 's' : ''} trouvé{suggestions.length > 1 ? 's' : ''}
              </p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-violet-500/50 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-violet-500/20 p-2 rounded-lg group-hover:bg-violet-500/30 transition-colors">
                      <MapPin className="text-violet-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-violet-300 transition-colors">
                        {suggestion.mainText}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 truncate">
                        {suggestion.secondaryText}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Venue Details */}
          {isLoadingDetails && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <p className="text-gray-400 mt-2">Chargement des détails...</p>
            </div>
          )}

          {selectedVenue && !isLoadingDetails && (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-violet-500/30 rounded-2xl p-6 space-y-4">
              {/* Venue Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedVenue.name}
                  </h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    {selectedVenue.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400" size={16} fill="currentColor" />
                        <span className="text-white font-semibold">
                          {selectedVenue.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({selectedVenue.totalRatings})
                        </span>
                      </div>
                    )}
                    {selectedVenue.priceLevel > 0 && renderPriceLevel(selectedVenue.priceLevel)}
                    {selectedVenue.isOpen !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className={selectedVenue.isOpen ? 'text-green-400' : 'text-red-400'} />
                        <span className={`text-sm ${selectedVenue.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedVenue.isOpen ? 'Ouvert' : 'Fermé'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl">
                <MapPin className="text-violet-400 mt-1 flex-shrink-0" size={18} />
                <p className="text-gray-300 text-sm">{selectedVenue.address}</p>
              </div>

              {/* Types */}
              <div className="flex flex-wrap gap-2">
                {selectedVenue.types.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-full border border-violet-500/30"
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              {/* Website & Phone */}
              {(selectedVenue.website || selectedVenue.phoneNumber) && (
                <div className="flex flex-wrap gap-3">
                  {selectedVenue.website && (
                    <a
                      href={selectedVenue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      <ExternalLink size={14} />
                      Site web
                    </a>
                  )}
                  {selectedVenue.phoneNumber && (
                    <a
                      href={`tel:${selectedVenue.phoneNumber}`}
                      className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      {selectedVenue.phoneNumber}
                    </a>
                  )}
                </div>
              )}

              {/* Coordinates Info */}
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                📍 {selectedVenue.coordinates.lat.toFixed(6)}, {selectedVenue.coordinates.lng.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-800/50 border-t border-gray-700 p-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVenue}
            className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all ${
              selectedVenue
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueSearchModal;
