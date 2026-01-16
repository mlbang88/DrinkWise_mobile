import React, { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Composant pour afficher les zones contrôlées sur Google Maps
 * Affiche des polygones colorés pour les rues et quartiers dominés
 */
const ZoneOverlay = ({ map, zones, userVenues, isVisible = true }) => {
    const polygonsRef = useRef([]);
    const circlesRef = useRef([]);

    useEffect(() => {
        if (!map || !isVisible) {
            // Nettoyer les overlays si le composant n'est pas visible
            clearOverlays();
            return;
        }

        // Nettoyer les anciens overlays
        clearOverlays();

        // Créer les nouveaux overlays
        createZoneOverlays();

    }, [map, zones, userVenues, isVisible]);

    const clearOverlays = () => {
        polygonsRef.current.forEach(polygon => polygon.setMap(null));
        circlesRef.current.forEach(circle => circle.setMap(null));
        polygonsRef.current = [];
        circlesRef.current = [];
    };

    const createZoneOverlays = () => {
        if (!map || !window.google) return;
        if (!userVenues || userVenues.length === 0) return;

        // Créer des cercles autour de chaque venue pour simuler le contrôle de zone
        userVenues.forEach((venue, index) => {
            if (!venue.coordinates) return;

            // Couleur basée sur le niveau de contrôle
            const level = venue.level || 'Bronze';
            const colors = {
                Platine: { fill: 'rgba(14, 165, 233, 0.15)', stroke: '#0ea5e9' },
                Or: { fill: 'rgba(251, 191, 36, 0.15)', stroke: '#fbbf24' },
                Argent: { fill: 'rgba(156, 163, 175, 0.15)', stroke: '#9ca3af' },
                Bronze: { fill: 'rgba(194, 120, 3, 0.15)', stroke: '#c27803' }
            };

            const color = colors[level] || colors.Bronze;

            // Créer un cercle de 200m de rayon autour du venue
            const circle = new window.google.maps.Circle({
                strokeColor: color.stroke,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: color.fill,
                fillOpacity: 0.35,
                map: map,
                center: venue.coordinates,
                radius: 200, // 200 mètres
                clickable: false,
                zIndex: 1
            });

            circlesRef.current.push(circle);

            // Animation subtile au survol (pulsation)
            circle.addListener('mouseover', () => {
                circle.setOptions({
                    fillOpacity: 0.5,
                    strokeWeight: 3
                });
            });

            circle.addListener('mouseout', () => {
                circle.setOptions({
                    fillOpacity: 0.35,
                    strokeWeight: 2
                });
            });
        });

        // Créer des polygones pour les zones de rue contrôlées
        zones.streets?.forEach(street => {
            // Trouver tous les venues de cette rue
            const streetVenues = userVenues.filter(v => 
                v.address && extractStreetName(v.address) === street.name
            );

            if (streetVenues.length < 2) return; // Besoin d'au moins 2 points pour un polygone

            // Créer un polygone convexe autour des venues de cette rue
            const polygon = createConvexHull(streetVenues.map(v => v.coordinates));

            if (polygon && polygon.length > 0) {
                const mapPolygon = new window.google.maps.Polygon({
                    paths: polygon,
                    strokeColor: '#8b5cf6',
                    strokeOpacity: 0.9,
                    strokeWeight: 3,
                    fillColor: '#8b5cf6',
                    fillOpacity: 0.2,
                    map: map,
                    clickable: true,
                    zIndex: 2
                });

                // Ajouter un InfoWindow pour afficher le nom de la rue
                mapPolygon.addListener('click', (event) => {
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 12px; font-family: -apple-system, sans-serif;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                        👑
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; font-size: 14px; color: #1f2937;">Roi de ${street.name}</div>
                                        <div style="font-size: 12px; color: #6b7280;">Contrôle de rue</div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 16px; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                                    <div>
                                        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Lieux</div>
                                        <div style="font-size: 16px; font-weight: 700; color: #8b5cf6;">${street.controlled}/${street.total}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Contrôle</div>
                                        <div style="font-size: 16px; font-weight: 700; color: #22c55e;">${Math.round(street.percentage * 100)}%</div>
                                    </div>
                                </div>
                            </div>
                        `,
                        position: event.latLng
                    });

                    infoWindow.open(map);
                });

                polygonsRef.current.push(mapPolygon);
            }
        });

        logger.info('✅ Zone overlays créés', { 
            circles: circlesRef.current.length,
            polygons: polygonsRef.current.length 
        });
    };

    /**
     * Extrait le nom de rue d'une adresse
     */
    const extractStreetName = (address) => {
        if (!address) return '';
        const parts = address.split(',');
        if (parts.length > 0) {
            return parts[0].trim();
        }
        return '';
    };

    /**
     * Crée une enveloppe convexe (convex hull) autour de points
     * Algorithme de Graham scan simplifié
     */
    const createConvexHull = (points) => {
        if (!points || points.length < 3) return [];

        // Convertir en format Google Maps LatLng
        const coords = points.filter(p => p && p.lat && p.lng);
        if (coords.length < 3) return [];

        // Trouver le point le plus bas (ou le plus à gauche si égalité)
        let start = coords[0];
        for (let i = 1; i < coords.length; i++) {
            if (coords[i].lat < start.lat || 
                (coords[i].lat === start.lat && coords[i].lng < start.lng)) {
                start = coords[i];
            }
        }

        // Trier les points par angle polaire par rapport au point de départ
        const sorted = coords.filter(p => p !== start).sort((a, b) => {
            const angleA = Math.atan2(a.lat - start.lat, a.lng - start.lng);
            const angleB = Math.atan2(b.lat - start.lat, b.lng - start.lng);
            return angleA - angleB;
        });

        // Construire l'enveloppe convexe
        const hull = [start];
        
        for (let i = 0; i < sorted.length; i++) {
            while (hull.length > 1 && 
                   crossProduct(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
                hull.pop();
            }
            hull.push(sorted[i]);
        }

        // Ajouter une marge autour du polygone (expansion de 100m)
        return expandPolygon(hull, 0.001); // ~100m en degrés
    };

    /**
     * Produit vectoriel pour déterminer l'orientation
     */
    const crossProduct = (o, a, b) => {
        return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
    };

    /**
     * Agrandit un polygone en déplaçant chaque point vers l'extérieur
     */
    const expandPolygon = (polygon, margin) => {
        if (polygon.length < 3) return polygon;

        const center = {
            lat: polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length,
            lng: polygon.reduce((sum, p) => sum + p.lng, 0) / polygon.length
        };

        return polygon.map(point => {
            const dx = point.lng - center.lng;
            const dy = point.lat - center.lat;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) return point;

            return {
                lat: point.lat + (dy / dist) * margin,
                lng: point.lng + (dx / dist) * margin
            };
        });
    };

    // Nettoyer lors du démontage
    useEffect(() => {
        return () => {
            clearOverlays();
        };
    }, []);

    // Ce composant ne rend rien (les overlays sont ajoutés directement à la carte)
    return null;
};

export default ZoneOverlay;
