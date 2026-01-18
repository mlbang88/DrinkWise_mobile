import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Users, Trophy, Filter, Target, Navigation2, History, Globe, Swords } from 'lucide-react';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import { auth, appId, db } from '../firebase';
import googleMapsService from '../services/googleMapsService';
import { getUserControlledVenues, getRivalControlledVenues, getVenueLeaderboard, getUserControlledZones } from '../services/venueService';
import { logger } from '../utils/logger';
import { createUserMarker, createVenueMarker } from '../utils/advancedMarkerHelper';
import TerritoryLeaderboard from '../components/TerritoryLeaderboard';
import VenueInfoWindow from '../components/VenueInfoWindow';
import MapFilters from '../components/MapFilters';
import ZoneOverlay from '../components/ZoneOverlay';
import TerritoryHistory from '../components/TerritoryHistory';
import GlobalLeaderboard from '../components/GlobalLeaderboard';
import BattleArena from '../components/BattleArena';
import FloatingParticles from '../components/FloatingParticles';

/**
 * MapPage - Carte interactive des territoires conquis
 * Affiche tous les lieux avec système de contrôle territorial
 */
const MapPage = ({ setCurrentPage }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerClustererRef = useRef(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [venues, setVenues] = useState([]);
    const [userVenues, setUserVenues] = useState([]);
    const [rivalVenues, setRivalVenues] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [controlledZones, setControlledZones] = useState({ streets: [], districts: [], totalZones: 0 });
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [venueLeaderboard, setVenueLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(false);
    const [showBattleArena, setShowBattleArena] = useState(false);
    const [battleVenue, setBattleVenue] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showZones, setShowZones] = useState(false); // Zones cachées par défaut
    const [showMoreMenu, setShowMoreMenu] = useState(false); // Menu Plus
    const [mapFilter, setMapFilter] = useState({
        distance: 10000,
        showUserVenues: true,
        showRivalVenues: true
    });

    // Écouter les changements d'authentification
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            logger.debug('MapPage: Auth state changed', { userId: user?.uid || 'null' });
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
                    mapId: 'DRINKWISE_MAP_ID', // Requis pour AdvancedMarkerElement
                    // Note: styles ne peut pas être utilisé avec mapId (géré via Cloud Console)
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                mapInstanceRef.current = map;
                
                // Marqueur position utilisateur (AdvancedMarkerElement)
                createUserMarker(userLocation, map);

                logger.info('✅ Carte initialisée avec AdvancedMarkerElement');''
                setIsLoading(false);
                setMapReady(true);
                logger.debug('MapPage: Map ready for markers');

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
            logger.debug('MapPage: No user connected');
            return;
        }

        const loadData = async () => {
            try {
                logger.debug('MapPage: Loading data', { userId: currentUser.uid, appId });
                const db = (await import('../firebase')).db;

                // Charger les lieux de l'utilisateur
                logger.info('🏰 Chargement lieux contrôlés', { userId: currentUser.uid });
                const userVenuesData = await getUserControlledVenues(db, appId, currentUser.uid);
                logger.debug('MapPage: Venues received', { count: userVenuesData.length });
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
                logger.error('MapPage: Data loading error', { error: error.message });
            }
        };

        loadData();
    }, [currentUser, appId]);

    // Afficher les markers sur la carte
    useEffect(() => {
        logger.debug('MapPage: Markers effect triggered', { 
            mapReady,
            hasMap: !!mapInstanceRef.current, 
            venuesCount: userVenues.length
        });

        if (!mapReady || !mapInstanceRef.current || !userVenues.length) {
            logger.debug('MapPage: Waiting for conditions', { 
                mapReady, 
                hasMap: !!mapInstanceRef.current, 
                venuesCount: userVenues.length 
            });
            return;
        }

        // Nettoyer les anciens markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Créer les nouveaux markers
        userVenues.forEach(venue => {
            if (!venue.coordinates) {
                logger.warn('MapPage: Venue without coordinates', { name: venue.name });
                return;
            }

            logger.debug('MapPage: Creating marker', { name: venue.name, coordinates: venue.coordinates });
            const marker = createVenueMarker(venue, mapInstanceRef.current, handleVenueClick);
            markersRef.current.push(marker);
        });

        logger.info('MapPage: Markers displayed', { count: markersRef.current.length });

    }, [userVenues, mapFilter, mapReady]);

    // Créer un marker pour un lieu (AdvancedMarkerElement)
    const handleVenueClick = async (venue) => {
        logger.debug('MapPage: Marker clicked', { name: venue.name });
        setSelectedVenue(venue);
        // Charger le leaderboard pour ce lieu spécifique
        try {
            const { db } = await import('../firebase');
            logger.debug('MapPage: Loading venue leaderboard', { placeId: venue.placeId });
            const venueLeaders = await getVenueLeaderboard(db, appId, venue.placeId, 5);
            logger.debug('MapPage: Leaderboard received', { count: venueLeaders.length });
            setVenueLeaderboard(venueLeaders);
            logger.info('📊 Leaderboard lieu chargé', { placeId: venue.placeId, count: venueLeaders.length });
        } catch (error) {
            logger.error('MapPage: Leaderboard error', { error: error.message });
            setVenueLeaderboard([]);
        }
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

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                            title="Filtres de carte"
                            aria-label="Ouvrir les filtres de carte"
                            aria-pressed={showFilters}
                        >
                            <Filter size={24} style={{ color: showFilters ? '#fbbf24' : '#9ca3af' }} />
                        </button>

                        <button
                            onClick={() => setShowZones(!showZones)}
                            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                            title="Zones de contrôle"
                            aria-label="Afficher les zones de contrôle"
                            aria-pressed={showZones}
                        >
                            <Target size={24} style={{ color: showZones ? '#10b981' : '#9ca3af' }} />
                        </button>

                        {/* Menu Plus */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                                title="Plus d'options"
                                aria-label="Ouvrir le menu d'options"
                                aria-expanded={showMoreMenu}
                                aria-haspopup="menu"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: showMoreMenu ? '#8b5cf6' : '#9ca3af' }}>
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                </svg>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showMoreMenu && (
                                <div 
                                    role="menu"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        backgroundColor: '#1f2937',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        minWidth: '200px',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                                        zIndex: 1001
                                    }}
                                >
                                    <button
                                        role="menuitem"
                                        onClick={() => { setShowBattleArena(true); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                                    >
                                        <Swords size={20} style={{ color: '#ef4444' }} />
                                        <span className="text-white text-sm font-medium">Battle Arena</span>
                                    </button>
                                    
                                    <button
                                        role="menuitem"
                                        onClick={() => { setShowHistory(true); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                                    >
                                        <History size={20} style={{ color: '#22c55e' }} />
                                        <span className="text-white text-sm font-medium">Timeline</span>
                                    </button>
                                    
                                    <button
                                        role="menuitem"
                                        onClick={() => { setShowGlobalLeaderboard(true); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                                    >
                                        <Globe size={20} style={{ color: '#3b82f6' }} />
                                        <span className="text-white text-sm font-medium">Classement mondial</span>
                                    </button>
                                    
                                    <button
                                        role="menuitem"
                                        onClick={() => { setShowLeaderboard(!showLeaderboard); setShowMoreMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                                    >
                                        <Trophy size={20} style={{ color: '#8b5cf6' }} />
                                        <span className="text-white text-sm font-medium">Classement local</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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

            {/* Territory History Modal */}
            {showHistory && currentUser && (
                <TerritoryHistory
                    db={db}
                    appId={appId}
                    userId={currentUser.uid}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {/* Global Leaderboard Modal */}
            {showGlobalLeaderboard && (
                <GlobalLeaderboard
                    db={db}
                    appId={appId}
                    currentUserId={currentUser?.uid}
                    onClose={() => setShowGlobalLeaderboard(false)}
                />
            )}

            {/* Battle Arena Modal */}
            {showBattleArena && battleVenue && currentUser && (
                <BattleArena
                    db={db}
                    appId={appId}
                    currentUser={currentUser}
                    placeId={battleVenue.placeId}
                    venueName={battleVenue.name}
                    onClose={() => {
                        setShowBattleArena(false);
                        setBattleVenue(null);
                    }}
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
                    onStartBattle={() => {
                        setBattleVenue(selectedVenue);
                        setShowBattleArena(true);
                        setSelectedVenue(null);
                    }}
                />
            )}

            {/* Map Filters */}
            {showFilters && (
                <MapFilters
                    currentFilter={mapFilter}
                    onFilterChange={(newFilter) => {
                        setMapFilter(newFilter);
                        setShowFilters(false);
                    }}
                />
            )}

            {/* Zone Overlay */}
            {showZones && mapInstanceRef.current && controlledZones && (
                <ZoneOverlay
                    map={mapInstanceRef.current}
                    zones={controlledZones}
                    userVenues={userVenues}
                    isVisible={showZones}
                />
            )}
        </div>
    );
};

export default MapPage;
