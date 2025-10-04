import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Users, Trophy, Filter, Target, Navigation2 } from 'lucide-react';
import { auth, appId } from '../firebase';
import googleMapsService from '../services/googleMapsService';
import { getUserControlledVenues, getVenueLeaderboard, getUserControlledZones } from '../services/venueService';
import { logger } from '../utils/logger';
import TerritoryLeaderboard from '../components/TerritoryLeaderboard';
import VenueInfoWindow from '../components/VenueInfoWindow';

/**
 * MapPage - Carte interactive des territoires conquis
 * Affiche tous les lieux avec système de contrôle territorial
 */
const MapPage = ({ setCurrentPage }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [venues, setVenues] = useState([]);
    const [userVenues, setUserVenues] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [controlledZones, setControlledZones] = useState({ streets: [], districts: [], totalZones: 0 });
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [venueLeaderboard, setVenueLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'mine', 'rivals'
    const [radius, setRadius] = useState(5000); // 5km par défaut

    // Écouter les changements d'authentification
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('🔐 Auth state changed:', user ? user.uid : 'null');
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    // Charger la position de l'utilisateur
    useEffect(() => {
        const loadUserLocation = async () => {
            try {
                const position = await googleMapsService.getCurrentPosition();
                setUserLocation(position);
                logger.info('📍 Position utilisateur chargée', position);
            } catch (error) {
                logger.error('❌ Erreur géolocalisation', error);
                // Position par défaut (Paris)
                setUserLocation({ lat: 48.8566, lng: 2.3522 });
            }
        };

        loadUserLocation();
    }, []);

    // Initialiser la carte Google Maps
    useEffect(() => {
        if (!userLocation || !mapRef.current) return;

        const initMap = async () => {
            try {
                await googleMapsService.loadGoogleMapsAPI();
                
                const map = new window.google.maps.Map(mapRef.current, {
                    center: userLocation,
                    zoom: 14,
                    mapTypeId: 'roadmap',
                    styles: getDarkMapStyles(),
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                mapInstanceRef.current = map;
                
                // Marqueur position utilisateur
                new window.google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#8b5cf6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                    title: 'Votre position',
                    zIndex: 1000,
                });

                logger.info('✅ Carte initialisée');
                setIsLoading(false);
                setMapReady(true);
                console.log('✅ Carte prête pour affichage des marqueurs');

            } catch (error) {
                logger.error('❌ Erreur initialisation carte', error);
                setIsLoading(false);
            }
        };

        initMap();
    }, [userLocation]);

    // Charger les données utilisateur et leaderboard
    useEffect(() => {
        if (!currentUser) {
            console.log('⚠️ Pas d\'utilisateur connecté');
            return;
        }

        const loadData = async () => {
            try {
                console.log('🔄 Chargement des données...', { userId: currentUser.uid, appId });
                const db = (await import('../firebase')).db;

                // Charger les lieux de l'utilisateur
                logger.info('🏰 Chargement lieux contrôlés', { userId: currentUser.uid });
                const userVenuesData = await getUserControlledVenues(db, appId, currentUser.uid);
                console.log('✅ Lieux récupérés:', userVenuesData);
                setUserVenues(userVenuesData);

                // Charger le leaderboard global (tous les lieux)
                const leaderboardData = await getVenueLeaderboard(db, appId, null, 5000);
                setLeaderboard(leaderboardData);

                // Charger les zones contrôlées
                const zonesData = await getUserControlledZones(db, appId, currentUser.uid);
                setControlledZones(zonesData);

                logger.info('✅ Données chargées', { 
                    userVenues: userVenuesData.length, 
                    leaderboard: leaderboardData.length,
                    zones: zonesData.totalZones 
                });

            } catch (error) {
                console.error('❌ Erreur chargement:', error);
                logger.error('❌ Erreur chargement données', error);
            }
        };

        loadData();
    }, [currentUser, appId]);

    // Afficher les markers sur la carte
    useEffect(() => {
        console.log('🗺️ useEffect markers:', { 
            mapReady,
            hasMap: !!mapInstanceRef.current, 
            venuesCount: userVenues.length,
            venues: userVenues 
        });

        if (!mapReady || !mapInstanceRef.current || !userVenues.length) {
            console.log('⏭️ Attente: mapReady=' + mapReady + ', hasMap=' + !!mapInstanceRef.current + ', venues=' + userVenues.length);
            return;
        }

        // Nettoyer les anciens markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Créer les nouveaux markers
        userVenues.forEach(venue => {
            if (!venue.coordinates) {
                console.warn('⚠️ Lieu sans coordonnées:', venue.name);
                return;
            }

            console.log('📍 Création marqueur pour:', venue.name, venue.coordinates);
            const marker = createVenueMarker(venue);
            markersRef.current.push(marker);
        });

        console.log(`✅ ${markersRef.current.length} markers affichés`);
        logger.info(`📍 ${markersRef.current.length} markers affichés`);

    }, [userVenues, filter, mapReady]);

    // Créer un marker pour un lieu
    const createVenueMarker = (venue) => {
        // Pour les venues retournées par getUserControlledVenues, ce sont forcément celles de l'utilisateur
        const markerColor = '#22c55e'; // Vert pour les lieux contrôlés

        const marker = new window.google.maps.Marker({
            position: venue.coordinates,
            map: mapInstanceRef.current,
            title: venue.name,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 20, // Augmenté de 12 à 20 pour meilleure visibilité
                fillColor: markerColor,
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 3, // Augmenté de 2 à 3
            },
            animation: window.google.maps.Animation.DROP,
        });

        // Click handler pour ouvrir la fenêtre d'info avec leaderboard
        marker.addListener('click', async () => {
            console.log('🖱️ Marqueur cliqué:', venue.name);
            setSelectedVenue(venue);
            // Charger le leaderboard pour ce lieu spécifique
            try {
                const { db } = await import('../firebase');
                console.log('📊 Chargement leaderboard pour:', venue.placeId);
                const venueLeaders = await getVenueLeaderboard(db, appId, venue.placeId, 5);
                console.log('✅ Leaderboard reçu:', venueLeaders);
                setVenueLeaderboard(venueLeaders);
                logger.info('📊 Leaderboard lieu chargé', { placeId: venue.placeId, count: venueLeaders.length });
            } catch (error) {
                console.error('❌ Erreur leaderboard:', error);
                logger.error('❌ Erreur chargement leaderboard lieu', error);
                setVenueLeaderboard([]);
            }
        });

        return marker;
    };

    // Styles de carte sombre
    const getDarkMapStyles = () => [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
        },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
        },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }],
        },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }],
        },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }],
        },
        {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }],
        },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }],
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }],
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }],
        },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }],
        },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }],
        },
        {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }],
        },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }],
        },
        {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800/95 border-b border-gray-700 sticky top-0 z-50">
                <div className="p-4 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage('battle')}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} style={{ color: '#ffffff' }} />
                    </button>
                    
                    <div className="flex-1 text-center">
                        <h1 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                            🗺️ Carte Territoriale
                        </h1>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                            {userVenues.length} lieu{userVenues.length > 1 ? 'x' : ''} contrôlé{userVenues.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                        <Trophy size={24} style={{ color: '#8b5cf6' }} />
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                    <div className="flex-shrink-0 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                        <div className="flex items-center gap-2">
                            <MapPin size={14} style={{ color: '#22c55e' }} />
                            <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                                Mes lieux: {userVenues.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-shrink-0 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <div className="flex items-center gap-2">
                            <Target size={14} style={{ color: '#8b5cf6' }} />
                            <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
                                Zones: {controlledZones.totalZones}
                            </span>
                        </div>
                    </div>

                    <div className="flex-shrink-0 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <div className="flex items-center gap-2">
                            <Users size={14} style={{ color: '#ef4444' }} />
                            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                                Rivaux: {leaderboard.length - 1}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
                            <p style={{ color: '#ffffff' }}>Chargement de la carte...</p>
                        </div>
                    </div>
                )}
                
                <div 
                    ref={mapRef} 
                    className="w-full h-full"
                    style={{ minHeight: '500px' }}
                />
            </div>

            {/* Swipeable Leaderboard */}
            {showLeaderboard && (
                <TerritoryLeaderboard
                    leaderboard={leaderboard}
                    userVenues={userVenues}
                    controlledZones={controlledZones}
                    currentUserId={currentUser?.uid}
                    onClose={() => setShowLeaderboard(false)}
                />
            )}

            {/* Info Window du lieu sélectionné */}
            {selectedVenue && (
                <VenueInfoWindow
                    venue={selectedVenue}
                    leaderboard={venueLeaderboard}
                    onClose={() => {
                        setSelectedVenue(null);
                        setVenueLeaderboard([]);
                    }}
                />
            )}
        </div>
    );
};

export default MapPage;
