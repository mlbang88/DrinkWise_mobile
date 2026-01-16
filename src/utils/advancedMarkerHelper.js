/**
 * Helper pour créer des AdvancedMarkerElement avec du contenu HTML personnalisé
 * Compatible avec MarkerClusterer et toutes les fonctionnalités existantes
 */

/**
 * Crée un élément div HTML pour un marqueur personnalisé
 * @param {Object} options - Options du marqueur
 * @param {string} options.color - Couleur de fond du marqueur
 * @param {string} options.icon - Emoji ou texte à afficher
 * @param {number} options.size - Taille du marqueur (default: 40)
 * @param {boolean} options.pulse - Animation pulsante (default: false)
 * @returns {HTMLDivElement}
 */
export const createMarkerContent = ({ color = '#8b5cf6', icon = '📍', size = 40, pulse = false }) => {
    const markerDiv = document.createElement('div');
    
    markerDiv.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
        ${pulse ? 'animation: pulse 2s infinite;' : ''}
    `;
    
    markerDiv.innerHTML = icon;
    
    // Effet hover
    markerDiv.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.2)';
    });
    
    markerDiv.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
    });
    
    // Animation pulse si demandée
    if (pulse && !document.getElementById('marker-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'marker-pulse-animation';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
                50% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.6); }
            }
        `;
        document.head.appendChild(style);
    }
    
    return markerDiv;
};

/**
 * Crée un AdvancedMarkerElement pour la position de l'utilisateur
 * @param {Object} position - {lat, lng}
 * @param {google.maps.Map} map - Instance de la carte
 * @returns {google.maps.marker.AdvancedMarkerElement}
 */
export const createUserMarker = (position, map) => {
    const content = createMarkerContent({
        color: '#8b5cf6',
        icon: '👤',
        size: 40,
        pulse: true
    });
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content,
        title: 'Votre position',
        zIndex: 1000,
    });
    
    return marker;
};

/**
 * Crée un AdvancedMarkerElement pour un venue (bar/club)
 * @param {Object} venue - Données du venue
 * @param {google.maps.Map} map - Instance de la carte
 * @param {Function} onClick - Callback au clic
 * @returns {google.maps.marker.AdvancedMarkerElement}
 */
export const createVenueMarker = (venue, map, onClick) => {
    // Déterminer la couleur selon le type de contrôle
    const isUserControlled = venue.isUserControlled || false;
    const isRivalControlled = venue.isRivalControlled || false;
    
    let color = '#6b7280'; // Gris par défaut (neutre)
    let icon = '🏪';
    
    if (isUserControlled) {
        color = '#22c55e'; // Vert pour l'utilisateur
        icon = '👑';
    } else if (isRivalControlled) {
        color = '#ef4444'; // Rouge pour les rivaux
        icon = '⚔️';
    }
    
    const content = createMarkerContent({
        color,
        icon,
        size: 44,
        pulse: isUserControlled
    });
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: venue.coordinates,
        map,
        content,
        title: venue.name,
    });
    
    // Ajouter le listener de clic
    if (onClick) {
        content.addEventListener('click', () => onClick(venue));
    }
    
    return marker;
};

/**
 * Crée un AdvancedMarkerElement pour un rival
 * @param {Object} rival - Données du rival
 * @param {google.maps.Map} map - Instance de la carte
 * @param {Function} onClick - Callback au clic
 * @returns {google.maps.marker.AdvancedMarkerElement}
 */
export const createRivalMarker = (rival, map, onClick) => {
    const content = createMarkerContent({
        color: '#ef4444',
        icon: '🔥',
        size: 38,
        pulse: false
    });
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: rival.coordinates,
        map,
        content,
        title: `Rival: ${rival.name}`,
    });
    
    if (onClick) {
        content.addEventListener('click', () => onClick(rival));
    }
    
    return marker;
};

/**
 * Convertit un AdvancedMarkerElement pour être compatible avec MarkerClusterer
 * @param {google.maps.marker.AdvancedMarkerElement} marker
 * @returns {Object} Marqueur compatible avec le clustering
 */
import { logger } from './logger';

export const makeClusterCompatible = (marker) => {
    // AdvancedMarkerElement est déjà compatible avec MarkerClusterer
    // On s'assure juste que la position est accessible
    if (!marker.position) {
        logger.warn('advancedMarkerHelper: Marker without position for clustering');
    }
    return marker;
};
