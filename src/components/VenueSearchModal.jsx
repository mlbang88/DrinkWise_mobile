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

  // Style pour le placeholder
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .venue-search-input::placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
      }
      .venue-search-input:focus {
        ring-color: rgba(139, 92, 246, 0.5) !important;
        border-color: rgba(139, 92, 246, 0.5) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
      
      // Appeler onVenueSelect immédiatement après avoir récupéré les détails
      if (onVenueSelect) {
        onVenueSelect(details);
      }
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
    <div className="w-full space-y-3">
      {/* Search Input avec suggestions intégrées */}
      <div className="relative">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: '#9ca3af' }}>
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom du bar, restaurant, club..."
            className="venue-search-input w-full rounded-xl py-3.5 font-medium focus:outline-none focus:ring-2 transition-all text-center"
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              border: '2px solid rgba(55, 65, 81, 0.5)',
              color: '#ffffff',
              paddingLeft: '48px',
              paddingRight: '48px'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-16 top-1/2 -translate-y-1/2 transition-colors z-10"
              style={{ color: '#9ca3af' }}
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={getUserLocation}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-2 hover:bg-violet-500/20 rounded-lg z-10"
            style={{ color: '#c084fc' }}
            title="Utiliser ma position"
          >
            <Navigation size={18} />
          </button>
        </div>

        {/* Suggestions dropdown - apparaît sous l'input */}
        {(suggestions.length > 0 || isLoading || error) && !selectedVenue && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto"
            style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid rgba(139, 92, 246, 0.4)'
            }}
          >
            {/* Loading */}
            {isLoading && (
              <div className="p-6 text-center" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                <p className="text-sm mt-2 font-medium" style={{ color: '#ffffff' }}>Recherche...</p>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="p-4 border-b" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <>
                <div className="px-4 py-2.5 border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#3a3a3a' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#d1d5db' }}>
                    {suggestions.length} résultat{suggestions.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="divide-y" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(55, 65, 81, 0.5)' }}>
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.placeId}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full p-4 transition-all group text-left hover:bg-violet-600/20"
                      style={{ backgroundColor: '#1a1a1a' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg transition-colors flex-shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}>
                          <MapPin style={{ color: '#c4b5fd' }} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm group-hover:text-violet-200 transition-colors" style={{ color: '#ffffff' }}>
                            {suggestion.mainText}
                          </h3>
                          <p className="text-xs mt-1 truncate" style={{ color: '#d1d5db' }}>
                            {suggestion.secondaryText}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Loading details */}
      {isLoadingDetails && (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '2px solid rgba(139, 92, 246, 0.3)' }}>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
          <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>Chargement des détails...</p>
        </div>
      )}

      {/* Selected Venue Card - affiché en dessous de l'input */}
      {selectedVenue && !isLoadingDetails && (
        <div className="rounded-xl p-5 space-y-4 shadow-xl" style={{ background: 'linear-gradient(to bottom right, rgba(31, 41, 55, 0.9), rgba(31, 41, 55, 0.7))', border: '2px solid rgba(139, 92, 246, 0.4)' }}>
          {/* Header avec bouton supprimer */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin style={{ color: '#c084fc' }} className="flex-shrink-0" size={20} />
                <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>
                  {selectedVenue.name}
                </h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {selectedVenue.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star style={{ color: '#fbbf24' }} size={14} fill="currentColor" />
                    <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                      {selectedVenue.rating.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                      ({selectedVenue.totalRatings})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="transition-colors p-2 hover:bg-gray-700/50 rounded-lg flex-shrink-0"
              style={{ color: '#9ca3af' }}
              title="Changer de lieu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{selectedVenue.address}</p>
          </div>

          {/* Types */}
          {selectedVenue.types && selectedVenue.types.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedVenue.types.slice(0, 3).map((type) => (
                <span
                  key={type}
                  className="px-2.5 py-1 text-xs rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#d8b4fe', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                >
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Success indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="rounded-full p-1" style={{ backgroundColor: '#22c55e' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#ffffff">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: '#4ade80' }}>Lieu sélectionné</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSearchModal;
