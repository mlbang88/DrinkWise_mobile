import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data.jsx';
import { Upload, X, Trash2, PlusCircle, Play, Square, Clock, Trophy, Users, User, Video, MapPin } from 'lucide-react';
import useBattleRoyale from '../hooks/useBattleRoyale.js';
import QuizManagerSimple from './QuizManagerSimple';
import DrinkAnalyzer from './DrinkAnalyzer';
import UserAvatar from './UserAvatar';
import BattlePointsNotification from './BattlePointsNotification';
import VenueSearchModal from './VenueSearchModal';
import PartySuggestions from './PartySuggestions';
import { updateVenueControl } from '../services/venueService';
import { logger } from '../utils/logger';

const CompetitivePartyModal = ({ onClose, onPartySaved, draftData = null }) => {
    const { db, storage, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    const modalRef = useRef(null);
    
    // Initialisation avec brouillon si disponible
    const initializeFromDraft = () => {
        if (draftData) {
            return {
                date: draftData.startTime ? new Date(draftData.startTime.seconds ? draftData.startTime.toDate() : draftData.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                drinks: draftData.drinks || [{ type: 'Bière', brand: '', quantity: 1 }],
                stats: draftData.stats || {
                    newNumbersGot: 0,
                    elleVeut: 0,
                    timeFightsStarted: 0,
                    vomitCount: 0
                },
                location: draftData.location || '',
                category: draftData.category || partyCategories[0],
                companions: draftData.companions || { type: 'none', selectedIds: [], selectedNames: [] }
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            drinks: [{ type: 'Bière', brand: '', quantity: 1 }],
            stats: {
                newNumbersGot: 0,
                elleVeut: 0,
                timeFightsStarted: 0,
                vomitCount: 0
            },
            location: '',
            category: partyCategories[0],
            companions: { type: 'none', selectedIds: [], selectedNames: [] }
        };
    };

    const initialData = initializeFromDraft();
    const [date] = useState(initialData.date);
    const [drinks, setDrinks] = useState(initialData.drinks);
    const [stats, setStats] = useState(initialData.stats);
    const [location, setLocation] = useState(initialData.location);
    const [venue, setVenue] = useState(draftData?.venue || null);
    const [category] = useState(initialData.category);
    const [companions, setCompanions] = useState(initialData.companions);
    const [lastPartyData, setLastPartyData] = useState(null);
    const [lastPartyId, setLastPartyId] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    
    // États pour les médias et compagnons
    const [videoFiles, setVideoFiles] = useState([]);
    const [uploadingVideos, setUploadingVideos] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);
    
    // États pour les données temporelles
    const [partyStartTime, setPartyStartTime] = useState(draftData?.startTime || '');
    const [partyEndTime, setPartyEndTime] = useState(draftData?.endTime || '');
    const [isPartyOngoing, setIsPartyOngoing] = useState(draftData?.isOngoing || false);
    const [realTimeMode, setRealTimeMode] = useState(draftData?.realTimeMode || false);
    
    // Battle Royale integration
    const { userTournaments, processPartyForTournaments, notificationData, setNotificationData } = useBattleRoyale();
    const [selectedBattleMode, setSelectedBattleMode] = useState(draftData?.battleMode || 'balanced');

    // Forcer le scroll en haut à l'ouverture
    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.scrollTop = 0;
        }
    }, []);

    const buildFallbackSummary = useCallback((details) => {
        const safeDetails = details || {};
        const drinksList = Array.isArray(safeDetails.drinks) ? safeDetails.drinks : [];
        const totalDrinks = drinksList.reduce((sum, drink) => sum + (Number(drink?.quantity) || 0), 0);
        const highlightDrink = drinksList.find((drink) => drink?.type)?.type || (drinksList.length > 0 ? 'quelques breuvages surprises' : 'bonne humeur');
        const locationLabel = safeDetails.location && safeDetails.location.trim() ? safeDetails.location.trim() : 'un spot secret';
        const companionsNames = Array.isArray(safeDetails.companions?.selectedNames) ? safeDetails.companions.selectedNames : [];
        const companionsText = companionsNames.length > 0
            ? `avec ${companionsNames.length} pote${companionsNames.length > 1 ? 's' : ''}`
            : 'en mode solo';
        const stats = safeDetails.stats || {};
        const highlights = [];

        if (totalDrinks > 0) {
            highlights.push(`${totalDrinks} verre${totalDrinks > 1 ? 's' : ''}`);
        }

        const newNumbers = Number(stats.newNumbersGot || 0);
        if (newNumbers > 0) {
            highlights.push(`${newNumbers} nouveau${newNumbers > 1 ? 'x' : ''} contact${newNumbers > 1 ? 's' : ''}`);
        }

        const fights = Number(stats.timeFightsStarted || 0);
        if (fights > 0) {
            highlights.push(`${fights} embrouille${fights > 1 ? 's' : ''}`);
        }

        const vibe = highlights.length > 0 ? highlights.join(', ') : 'une ambiance chill';

        return `Soirée à ${locationLabel} ${companionsText}, ${vibe} et ${highlightDrink} en vedette. À raconter autour d'un prochain verre !`;
    }, []);

    // Fonction pour générer le résumé de soirée
    const generatePartySummary = useCallback(async (partyDetails, docId) => {
        if (!functions) {
            logger.warn('CompetitivePartyModal: Fonctions Firebase indisponibles, résumé non généré');
            return;
        }

        if (!partyDetails || !docId) {
            logger.warn('CompetitivePartyModal: Données insuffisantes pour générer le résumé', { hasPartyDetails: !!partyDetails, hasDocId: !!docId });
            return;
        }

        setLoadingSummary(true);

        try {
            const safeDetails = {
                ...partyDetails,
                drinks: Array.isArray(partyDetails.drinks) ? partyDetails.drinks : [],
                stats: partyDetails.stats || {},
                companions: partyDetails.companions || {}
            };

            const prompt = `Génère un résumé de soirée amusant et mémorable (max 3 phrases) basé sur: ${JSON.stringify(safeDetails)}. Sois créatif et humoristique.`;
            const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');

            logger.info('CompetitivePartyModal: Génération du résumé de soirée', { docId });
            const result = await callGeminiAPI({ prompt, partyId: docId });
            
            logger.debug('CompetitivePartyModal: Résultat Cloud Function reçu');
            const aiSummary = (result?.data?.text || result?.data?.summary || '').trim();
            const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);

            if (aiSummary && aiSummary.length > 0) {
                await updateDoc(partyRef, {
                    summary: aiSummary,
                    summarySource: 'gemini',
                    summaryGeneratedAt: new Date()
                });
                logger.info('CompetitivePartyModal: Résumé IA généré et sauvegardé');
            } else {
                const fallbackSummary = buildFallbackSummary(safeDetails);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-empty-response',
                    summaryGeneratedAt: new Date()
                });
                logger.warn('CompetitivePartyModal: Résultat inattendu de callGeminiAPI, fallback appliqué');
                setMessageBox({
                    message: "⚠️ Résumé IA indisponible, un résumé simplifié a été créé.",
                    type: 'warning'
                });
            }
        } catch (error) {
            logger.error('CompetitivePartyModal: Erreur génération résumé via Cloud Function', { error: error.message });

            try {
                const fallbackSummary = buildFallbackSummary(partyDetails);
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-error',
                    summaryGeneratedAt: new Date()
                });
                logger.info('CompetitivePartyModal: Fallback summary saved after AI error', { docId });
                setMessageBox({
                    message: "🛟 L'IA était occupée, on a généré un résumé manuel.",
                    type: 'info'
                });
            } catch (fallbackError) {
                logger.error('CompetitivePartyModal: Impossible de sauvegarder le résumé fallback', { error: fallbackError.message });
                setMessageBox({
                    message: "❌ Résumé indisponible pour cette soirée.",
                    type: 'error'
                });
            }
        } finally {
            setLoadingSummary(false);
        }
    }, [appId, buildFallbackSummary, db, functions, setMessageBox, user]);

    const handleQuizComplete = (partyData) => {
        logger.info('CompetitivePartyModal: Quiz complété', { hasPartyData: !!partyData });
        setShowQuiz(false);
        
        const fallbackPartyId = partyData?.partyId || lastPartyId;
        const fallbackPartyData = partyData || lastPartyData;

        // Générer le résumé de la soirée si nous avons l'ID
        if (fallbackPartyData && fallbackPartyId) {
            logger.info('CompetitivePartyModal: Déclenchement génération résumé', { partyId: fallbackPartyId });
            generatePartySummary(fallbackPartyData, fallbackPartyId);
        } else {
            logger.warn('CompetitivePartyModal: Pas d\'ID de soirée pour générer le résumé', { hasFallbackPartyId: !!fallbackPartyId, hasFallbackPartyData: !!fallbackPartyData });
        }
        
        // Déclencher les événements de sauvegarde et rafraîchissement
        if (onPartySaved) onPartySaved(partyData);
        window.dispatchEvent(new CustomEvent('refreshFeed'));
        
        // S'assurer que les données avec détection IA sont bien préservées
        if ((fallbackPartyData && fallbackPartyData.drinks)) {
            logger.debug('CompetitivePartyModal: Données de boissons préservées', { drinksCount: fallbackPartyData.drinks.length });
        }
        
        onClose();
    };

    const handleStatChange = (field, value) => setStats(prev => ({ ...prev, [field]: Math.max(0, Number(value)) }));
    
    const handleDrinkChange = (index, field, value) => {
        const newDrinks = [...drinks];
        newDrinks[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
        if (field === 'type') newDrinks[index].brand = '';
        
        // Ajouter timestamp si mode temps réel
        if (!newDrinks[index].timestamp && realTimeMode) {
            newDrinks[index].timestamp = new Date().toISOString();
        }
        
        setDrinks(newDrinks);
    };

    const addDrink = () => {
        const newDrink = { 
            type: 'Bière', 
            brand: '', 
            quantity: 1,
            timestamp: realTimeMode ? new Date().toISOString() : null
        };
        setDrinks([...drinks, newDrink]);
    };
    
    const removeDrink = (index) => setDrinks(drinks.filter((_, i) => i !== index));
    
    // Fonctions pour gérer la durée de la soirée
    const handleStartParty = () => {
        const now = new Date().toISOString();
        setPartyStartTime(now);
        setIsPartyOngoing(true);
        setRealTimeMode(true);
    };
    
    const handleEndParty = () => {
        const now = new Date().toISOString();
        setPartyEndTime(now);
        setIsPartyOngoing(false);
    };
    
    const calculatePartyDuration = () => {
        if (!partyStartTime || !partyEndTime) return 0;
        const start = new Date(partyStartTime);
        const end = new Date(partyEndTime);
        return (end - start) / (1000 * 60 * 60); // Durée en heures
    };

    const handlePhotoAdd = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.slice(0, 5 - photoFiles.length);
        setPhotoFiles(prev => [...prev, ...newPhotos]);
    };

    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Gestion des vidéos
    const handleVideoAdd = (e) => {
        const files = Array.from(e.target.files);
        const validVideos = [];
        
        for (const file of files) {
            if (videoFiles.length + validVideos.length >= 3) break;
            
            // Vérifier la taille (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setMessageBox({ 
                    message: `Vidéo "${file.name}" trop lourde (max 50MB)`, 
                    type: "error" 
                });
                continue;
            }
            
            // Vérifier la durée
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                if (video.duration > 20) {
                    setMessageBox({ 
                        message: `Vidéo "${file.name}" trop longue (max 20 secondes)`, 
                        type: "error" 
                    });
                } else {
                    validVideos.push(file);
                    if (validVideos.length > 0 && videoFiles.length + validVideos.length <= 3) {
                        setVideoFiles(prev => [...prev, ...validVideos.slice(0, 3 - prev.length)]);
                    }
                }
                URL.revokeObjectURL(video.src);
            };
            
            video.src = URL.createObjectURL(file);
        }
    };

    const removeVideo = (index) => {
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Fonction pour gérer la détection automatique de boisson
    const handleDrinkDetected = (drinkType, detectedBrand) => {
        logger.info('CompetitivePartyModal: Boisson détectée', { drinkType, detectedBrand });
        
        // Ajouter la boisson détectée
        const newDrink = { 
            type: drinkType, 
            brand: detectedBrand || '', 
            quantity: 1,
            timestamp: realTimeMode ? new Date().toISOString() : null
        };
        
        setDrinks(prev => [...prev, newDrink]);
        setMessageBox({ 
            message: `🤖 Boisson détectée: ${drinkType}${detectedBrand ? ` (${detectedBrand})` : ''}`, 
            type: "success" 
        });
    };

    // Gestion des compagnons
    const toggleCompanionSelection = (type, id, name) => {
        setCompanions(prev => {
            const isSelected = prev.selectedIds.includes(id);
            if (isSelected) {
                return {
                    ...prev,
                    selectedIds: prev.selectedIds.filter(selectedId => selectedId !== id),
                    selectedNames: prev.selectedNames.filter(selectedName => selectedName !== name)
                };
            } else {
                return {
                    ...prev,
                    selectedIds: [...prev.selectedIds, id],
                    selectedNames: [...prev.selectedNames, name]
                };
            }
        });
    };

    // Sauvegarder brouillon
    const saveDraft = async () => {
        if (!user || !db) return;
        
        const draftData = {
            date,
            drinks,
            stats,
            location,
            category,
            companions,
            startTime: partyStartTime,
            endTime: partyEndTime,
            isOngoing: isPartyOngoing,
            realTimeMode,
            battleMode: selectedBattleMode,
            lastSaved: Timestamp.now()
        };
        
        try {
            const draftRef = doc(db, `artifacts/${appId}/users/${user.uid}/draft`, 'party');
            await updateDoc(draftRef, draftData);
            setMessageBox({ message: "Brouillon sauvegardé !", type: "success" });
        } catch (error) {
            logger.error('CompetitivePartyModal: Erreur mise à jour brouillon', { error: error.message });
            // Si le document n'existe pas, le créer
            try {
                await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/draft`), draftData);
                setMessageBox({ message: "Brouillon sauvegardé !", type: "success" });
            } catch (createError) {
                logger.error('CompetitivePartyModal: Erreur sauvegarde brouillon', { error: createError.message });
                setMessageBox({ message: "Erreur sauvegarde brouillon", type: "error" });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user || !db) return setMessageBox({ message: "Connexion requise.", type: "error" });

        const partyDuration = calculatePartyDuration();
        
        const partyData = { 
            date, 
            drinks, 
            ...stats, 
            location, 
            venue: venue ? {
                placeId: venue.placeId,
                name: venue.name,
                address: venue.address,
                coordinates: venue.coordinates,
                rating: venue.rating,
                types: venue.types
            } : null,
            category, 
            companions,
            timestamp: Timestamp.now(), 
            userId: user.uid, 
            username: userProfile?.username || "Anonyme",
            // Données temporelles
            startTime: partyStartTime || null,
            endTime: partyEndTime || null,
            duration: partyDuration || null,
            realTimeTracking: realTimeMode,
            mode: 'competitive', // Marqueur pour identifier le mode
            battleMode: selectedBattleMode // Style de jeu pour calcul XP et tournois
        };
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);
            
            // Calculer les points Battle Royale si l'utilisateur participe à des tournois
            if (userTournaments.length > 0) {
                try {
                    const additionalData = {
                        isNewVenue: location && location.trim() !== '',
                        isOrganizer: companions.type !== 'none',
                        consistencyScore: 85,
                        adaptedToContext: true,
                        isPersonalRecord: drinks.length >= 8,
                        madeOthersDance: stats.newNumbersGot > 1
                    };
                    
                    await processPartyForTournaments(partyData, selectedBattleMode, additionalData);
                } catch (battleError) {
                    logger.error('CompetitivePartyModal: Erreur calcul points Battle Royale', { error: battleError.message });
                }
            }

            // Mettre à jour le contrôle territorial si un lieu est sélectionné
            if (venue) {
                try {
                    logger.info('CompetitivePartyModal: Venue sélectionné', { venueName: venue.name });
                    const territoryResult = await updateVenueControl(db, appId, {
                        venue,
                        userId: user.uid,
                        username: userProfile?.username || "Anonyme",
                        partyData,
                        battleMode: selectedBattleMode
                    });

                    if (territoryResult.success) {
                        logger.info('CompetitivePartyModal: Contrôle territorial', { pointsEarned: territoryResult.pointsEarned, level: territoryResult.level.name });
                        
                        // Afficher notification si takeover ou nouveau contrôle
                        if (territoryResult.isTakeover) {
                            setMessageBox({ 
                                message: `⚔️ Territoire conquis! +${territoryResult.pointsEarned} points`, 
                                type: "success" 
                            });
                        } else if (territoryResult.isNewControl) {
                            setMessageBox({ 
                                message: `👑 Nouveau territoire! +${territoryResult.pointsEarned} points`, 
                                type: "success" 
                            });
                        }
                    }
                } catch (territoryError) {
                    logger.error('CompetitivePartyModal: Erreur mise à jour contrôle territorial', { error: territoryError.message });
                }
            } else {
                logger.debug('CompetitivePartyModal: Aucun lieu sélectionné, contrôle territorial ignoré');
            }
            
            // Préparer et lancer le quiz
            setLastPartyData(partyData);
            setLastPartyId(docRef.id);
            setShowQuiz(true);
            
            // Upload photos en arrière-plan
            if (photoFiles.length > 0) {
                setUploadingPhotos(true);
                try {
                    const photoURLs = [];
                    
                    for (let i = 0; i < photoFiles.length; i++) {
                        const photoFile = photoFiles[i];
                        const storagePath = `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/photo_${i + 1}.jpg`;
                        const storageRefPhoto = ref(storage, storagePath);
                        await uploadBytes(storageRefPhoto, photoFile);
                        const photoURL = await getDownloadURL(storageRefPhoto);
                        photoURLs.push(photoURL);
                    }
                    
                    await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id), { 
                        photoURLs: photoURLs,
                        photosCount: photoURLs.length 
                    });
                } catch (photoError) {
                    logger.error('CompetitivePartyModal: Photo upload error', { error: photoError.message });
                } finally {
                    setUploadingPhotos(false);
                }
            }

            // Upload vidéos en arrière-plan si présentes
            if (videoFiles.length > 0) {
                setUploadingVideos(true);
                try {
                    const videoURLs = [];
                    
                    for (let i = 0; i < videoFiles.length; i++) {
                        const videoFile = videoFiles[i];
                        const storagePath = `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/video_${i + 1}.mp4`;
                        const storageRefVideo = ref(storage, storagePath);
                        await uploadBytes(storageRefVideo, videoFile);
                        const videoURL = await getDownloadURL(storageRefVideo);
                        videoURLs.push(videoURL);
                    }
                    
                    // Mettre à jour avec les URLs des vidéos
                    await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id), { 
                        videoURLs: videoURLs,
                        videosCount: videoURLs.length 
                    });
                } catch (videoError) {
                    logger.error('CompetitivePartyModal: Video upload error', { error: videoError.message });
                } finally {
                    setUploadingVideos(false);
                }
            }
            
        } catch (error) {
            logger.error('CompetitivePartyModal: Save error', { error: error.message });
            setMessageBox({ message: "Erreur lors de la sauvegarde", type: "error" });
        }
    };

    // Charger les amis et groupes au montage du composant
    useEffect(() => {
        const loadCompanionsData = async () => {
            if (!user || !db || !userProfile) return;
            
            setLoadingCompanions(true);
            try {
                // Charger les amis
                if (userProfile.friends && userProfile.friends.length > 0) {
                    const friendsData = [];
                    for (const friendId of userProfile.friends) {
                        try {
                            const friendQuery = query(
                                collection(db, `artifacts/${appId}/public_user_stats`),
                                where('__name__', '==', friendId)
                            );
                            const friendSnapshot = await getDocs(friendQuery);
                            if (!friendSnapshot.empty) {
                                const friendData = friendSnapshot.docs[0].data();
                                friendsData.push({
                                    id: friendId,
                                    username: friendData.username || 'Ami',
                                    displayName: friendData.displayName || friendData.username || 'Ami'
                                });
                            }
                        } catch (error) {
                            logger.error('CompetitivePartyModal: Load friend error', { error: error.message, friendId });
                        }
                    }
                    setFriendsList(friendsData);
                }

                // Charger les groupes
                if (userProfile.groups && userProfile.groups.length > 0) {
                    const groupsData = [];
                    for (const groupId of userProfile.groups) {
                        try {
                            const groupQuery = query(
                                collection(db, `artifacts/${appId}/groups`),
                                where('__name__', '==', groupId)
                            );
                            const groupSnapshot = await getDocs(groupQuery);
                            if (!groupSnapshot.empty) {
                                const groupData = groupSnapshot.docs[0].data();
                                groupsData.push({
                                    id: groupId,
                                    name: groupData.name || 'Groupe',
                                    memberCount: groupData.memberCount || 0
                                });
                            }
                        } catch (error) {
                            logger.error('CompetitivePartyModal: Load group error', { error: error.message, groupId });
                        }
                    }
                    setGroupsList(groupsData);
                }
            } catch (error) {
                logger.error('CompetitivePartyModal: Load companions error', { error: error.message });
            } finally {
                setLoadingCompanions(false);
            }
        };

        loadCompanionsData();
    }, [user, db, userProfile, appId]);

    // Si le quiz est activé, afficher le quiz
    if (showQuiz && lastPartyData && lastPartyId) {
        return (
            <QuizManagerSimple
                partyData={lastPartyData}
                partyId={lastPartyId}
                onQuizComplete={handleQuizComplete}
                uploadingPhotos={uploadingPhotos}
                photosCount={photoFiles.length}
            />
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '5px'
        }}>
            <div 
                ref={modalRef}
                style={{
                backgroundColor: '#1a202c',
                borderRadius: '20px',
                padding: '20px',
                maxWidth: '420px',
                width: '100%',
                maxHeight: '83vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: 0
                    }}>
                        🏆 Mode Compétitif
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={saveDraft}
                            aria-label="Sauvegarder le brouillon"
                            style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: '#22c55e',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            💾 Sauver
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Fermer la modale"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                padding: '8px',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Suggestions contextuelles */}
                <PartySuggestions 
                    partyData={{
                        drinks,
                        venue,
                        companions,
                        battleMode: selectedBattleMode
                    }}
                    userProfile={userProfile}
                />

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Contrôle de soirée temps réel */}
                    <div style={{
                        padding: '16px',
                        background: isPartyOngoing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${isPartyOngoing ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                        }}>
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                                {isPartyOngoing ? '🟢 Soirée en cours' : '🔵 Prêt à commencer'}
                            </span>
                            
                            {!isPartyOngoing && !partyEndTime ? (
                                <button
                                    type="button"
                                    onClick={handleStartParty}
                                    style={{
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Play size={20} />
                                    START
                                </button>
                            ) : isPartyOngoing ? (
                                <button
                                    type="button"
                                    onClick={handleEndParty}
                                    style={{
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Square size={20} />
                                    STOP
                                </button>
                            ) : null}
                        </div>
                        
                        {partyStartTime && (
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                {new Date(partyStartTime).toLocaleTimeString()}
                                {partyEndTime && ` - ${new Date(partyEndTime).toLocaleTimeString()}`}
                                {partyStartTime && partyEndTime && (
                                    <span style={{ color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
                                        ({calculatePartyDuration().toFixed(1)}h)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Boissons - Interface simplifiée */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            marginBottom: '12px'
                        }}>
                            🍻 Boissons ({drinks.length})
                        </label>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {drinks.map((drink, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}>
                                        <select 
                                            value={drink.type} 
                                            onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '16px',
                                                outline: 'none'
                                            }}
                                        >
                                            {drinkOptions.map(opt => (
                                                <option key={opt.type} value={opt.type} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                    {opt.type}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <input 
                                            type="number" 
                                            value={drink.quantity} 
                                            onChange={(e) => handleDrinkChange(index, 'quantity', e.target.value)} 
                                            min="1"
                                            style={{
                                                width: '70px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '16px',
                                                textAlign: 'center',
                                                outline: 'none'
                                            }}
                                        />
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => removeDrink(index)}
                                            style={{
                                                background: '#dc2626',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    
                                    {/* Timestamp si mode temps réel */}
                                    {realTimeMode && drink.timestamp && (
                                        <div style={{
                                            padding: '6px 10px',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: 'rgba(255, 255, 255, 0.8)'
                                        }}>
                                            🕒 {new Date(drink.timestamp).toLocaleTimeString()}
                                            {index > 0 && drinks[index - 1].timestamp && (
                                                <span style={{ color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
                                                    (+{Math.round((new Date(drink.timestamp) - new Date(drinks[index - 1].timestamp)) / (1000 * 60))}min)
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={addDrink}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <PlusCircle size={20} />
                            AJOUTER
                        </button>
                    </div>

                    {/* Détection IA des boissons */}
                    <div style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <div style={{ 
                            color: 'white', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            textAlign: 'center'
                        }}>
                            🤖 IA Détection Boissons
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <DrinkAnalyzer 
                                isDarkMode={true}
                                onDrinkDetected={handleDrinkDetected}
                                compact={true}
                            />
                        </div>
                    </div>

                    {/* Style de Jeu - toujours visible, affecte XP et tournois */}
                    <div style={{
                        padding: '16px',
                        background: userTournaments.length > 0 
                            ? 'linear-gradient(135deg, rgba(139, 69, 255, 0.15), rgba(255, 107, 53, 0.15))'
                            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                        border: userTournaments.length > 0 
                            ? '1px solid rgba(139, 69, 255, 0.3)'
                            : '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            <Trophy size={18} style={{ color: userTournaments.length > 0 ? '#FF6B35' : '#8B5CF6' }} />
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                                {userTournaments.length > 0 ? 'Mode Battle Royale' : 'Style de Jeu'}
                            </span>
                            {userTournaments.length > 0 && (
                                <span style={{ 
                                    color: '#FF6B35', 
                                    fontSize: '11px', 
                                    padding: '2px 6px',
                                    background: 'rgba(255, 107, 53, 0.2)',
                                    borderRadius: '4px',
                                    fontWeight: '700'
                                }}>
                                    {userTournaments.length} tournoi{userTournaments.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                            
                        {!userTournaments.length && (
                            <div style={{
                                fontSize: '12px',
                                color: '#ccc',
                                marginBottom: '10px',
                                lineHeight: '1.4'
                            }}>
                                💡 Ton style influence l'XP gagné. Rejoins des tournois pour gagner des points bonus !
                            </div>
                        )}
                        
                        <select 
                            value={selectedBattleMode} 
                            onChange={(e) => setSelectedBattleMode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: userTournaments.length > 0 
                                    ? 'rgba(255, 107, 53, 0.1)'
                                    : 'rgba(139, 92, 246, 0.1)',
                                border: userTournaments.length > 0 
                                    ? '1px solid rgba(255, 107, 53, 0.3)'
                                    : '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                                <option value="balanced" style={{ backgroundColor: '#2d3748', color: '#F59E0B' }}>
                                    🎯 Balanced Player
                                </option>
                                <option value="moderation" style={{ backgroundColor: '#2d3748', color: '#10B981' }}>
                                    🧠 Modération Master
                                </option>
                                <option value="explorer" style={{ backgroundColor: '#2d3748', color: '#8B5CF6' }}>
                                    ✨ Explorer Pro
                                </option>
                                <option value="social" style={{ backgroundColor: '#2d3748', color: '#EF4444' }}>
                                    ❤️ Social Host
                                </option>
                                <option value="party" style={{ backgroundColor: '#2d3748', color: '#FF6B35' }}>
                                    ⚡ Party Beast
                                </option>
                            </select>
                            
                            {/* Aperçu des points */}
                            {drinks.length > 0 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    background: 'rgba(34, 197, 94, 0.2)',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ 
                                        color: '#22c55e', 
                                        fontSize: '14px', 
                                        fontWeight: '700' 
                                    }}>
                                        ≈ {Math.max(30, Math.min(100, 
                                            50 + 
                                            (selectedBattleMode === 'moderation' ? -drinks.length * 5 + 20 : 0) +
                                            (selectedBattleMode === 'party' ? drinks.length * 8 : 0) +
                                            (selectedBattleMode === 'explorer' ? drinks.length * 5 + (location ? 20 : 0) : 0) +
                                            (selectedBattleMode === 'social' ? companions.selectedNames.length * 10 : 0) +
                                            (calculatePartyDuration() > 0 ? 15 : 0)
                                        ))} points estimés
                                    </span>
                                </div>
                            )}
                    </div>

                    {/* Statistiques compactes */}
                    <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <div style={{ 
                            color: 'white', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '12px' 
                        }}>
                            📊 Stats Express
                        </div>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: '8px' 
                        }}>
                            {/* Bagarres */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Bagarres</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('timeFightsStarted', stats.timeFightsStarted - 1)}
                                        style={{
                                            width: '24px', height: '24px', background: 'rgba(251, 146, 60, 0.2)',
                                            border: 'none', borderRadius: '50%', color: '#fb923c', fontSize: '14px', cursor: 'pointer'
                                        }}
                                    >-</button>
                                    <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                                        {stats.timeFightsStarted}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('timeFightsStarted', stats.timeFightsStarted + 1)}
                                        style={{
                                            width: '24px', height: '24px', background: 'rgba(251, 146, 60, 0.2)',
                                            border: 'none', borderRadius: '50%', color: '#fb923c', fontSize: '14px', cursor: 'pointer'
                                        }}
                                    >+</button>
                                </div>
                            </div>

                            {/* Vomissements */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Vomis</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('vomitCount', stats.vomitCount - 1)}
                                        style={{
                                            width: '24px', height: '24px', background: 'rgba(239, 68, 68, 0.2)',
                                            border: 'none', borderRadius: '50%', color: '#ef4444', fontSize: '14px', cursor: 'pointer'
                                        }}
                                    >-</button>
                                    <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                                        {stats.vomitCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('vomitCount', stats.vomitCount + 1)}
                                        style={{
                                            width: '24px', height: '24px', background: 'rgba(239, 68, 68, 0.2)',
                                            border: 'none', borderRadius: '50%', color: '#ef4444', fontSize: '14px', cursor: 'pointer'
                                        }}
                                    >+</button>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Sélection compagnons express */}
                    <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <div style={{ 
                            color: 'white', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '12px' 
                        }}>
                            👥 Compagnons
                        </div>
                        
                        {/* Boutons rapides type */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'none', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1, padding: '8px', fontSize: '12px',
                                    background: companions.type === 'none' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer'
                                }}
                            >Seul(e)</button>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'friends', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1, padding: '8px', fontSize: '12px',
                                    background: companions.type === 'friends' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer'
                                }}
                            ><User size={12} style={{ marginRight: '4px', display: 'inline' }} />Amis</button>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'groups', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1, padding: '8px', fontSize: '12px',
                                    background: companions.type === 'groups' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer'
                                }}
                            ><Users size={12} style={{ marginRight: '4px', display: 'inline' }} />Groupes</button>
                        </div>

                        {/* Sélection rapide amis */}
                        {companions.type === 'friends' && friendsList.length > 0 && (
                            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                {friendsList.slice(0, 3).map(friend => (
                                    <div
                                        key={friend.id}
                                        onClick={() => toggleCompanionSelection('friends', friend.id, friend.displayName)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px',
                                            background: companions.selectedIds.includes(friend.id) ? 'rgba(139, 69, 255, 0.3)' : 'transparent',
                                            borderRadius: '6px', cursor: 'pointer', marginBottom: '4px'
                                        }}
                                    >
                                        <UserAvatar user={friend} size={24} />
                                        <span style={{ color: 'white', fontSize: '12px' }}>{friend.displayName}</span>
                                        {companions.selectedIds.includes(friend.id) && (
                                            <span style={{ marginLeft: 'auto', color: '#8b45ff' }}>✓</span>
                                        )}
                                    </div>
                                ))}
                                {friendsList.length > 3 && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textAlign: 'center' }}>
                                        +{friendsList.length - 3} autres...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sélection rapide groupes */}
                        {companions.type === 'groups' && (
                            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                {groupsList.length > 0 ? (
                                    groupsList.slice(0, 2).map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => toggleCompanionSelection('groups', group.id, group.name)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px',
                                                background: companions.selectedIds.includes(group.id) ? 'rgba(139, 69, 255, 0.3)' : 'transparent',
                                                borderRadius: '6px', cursor: 'pointer', marginBottom: '4px'
                                            }}
                                        >
                                            <div style={{
                                                width: '24px', height: '24px', background: 'linear-gradient(135deg, #8b45ff, #a855f7)',
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Users size={12} color="white" />
                                            </div>
                                            <span style={{ color: 'white', fontSize: '12px' }}>{group.name}</span>
                                            {companions.selectedIds.includes(group.id) && (
                                                <span style={{ marginLeft: 'auto', color: '#8b45ff' }}>✓</span>
                                            )}
                                        </div>
                                    ))
                                ) : loadingCompanions ? (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textAlign: 'center', padding: '8px' }}>
                                        Chargement des groupes...
                                    </div>
                                ) : (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textAlign: 'center', padding: '8px' }}>
                                        Aucun groupe disponible
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recherche de lieu avec Google Maps */}
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            📍 Rechercher un lieu
                        </label>
                        <VenueSearchModal
                            isOpen={true}
                            onClose={() => {}}
                            onVenueSelect={(selectedVenue) => {
                                setVenue(selectedVenue);
                                setLocation(selectedVenue.name);
                            }}
                            initialValue={location}
                        />
                    </div>

                    {/* Photos rapides */}
                    {photoFiles.length > 0 && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
                                gap: '10px',
                                marginBottom: '12px'
                            }}
                        >
                            {photoFiles.map((file, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.06)'
                                    }}
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Aperçu photo ${index + 1} de la soirée`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '50%',
                                            background: 'rgba(220, 38, 38, 0.9)',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            lineHeight: 1
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {photoFiles.length < 5 && (
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '16px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '2px dashed rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}>
                            <Upload size={20} />
                            📸 Photos ({photoFiles.length}/5)
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoAdd}
                                style={{ display: 'none' }}
                            />
                        </label>
                    )}

                    {/* Vidéos express */}
                    <div>
                        {/* Vidéos express */}
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px'
                        }}>
                            <div style={{ 
                                color: 'white', 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                marginBottom: '8px',
                                textAlign: 'center'
                            }}>
                                🎬 Vidéos ({videoFiles.length}/3)
                            </div>
                            {videoFiles.length < 3 && (
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '8px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px dashed rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                }}>
                                    <Video size={14} />
                                    Ajouter
                                    <input
                                        type="file"
                                        accept="video/*"
                                        multiple
                                        onChange={handleVideoAdd}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            )}
                            {videoFiles.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    marginTop: '8px'
                                }}>
                                    {videoFiles.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px',
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                borderRadius: '8px',
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                fontSize: '11px'
                                            }}
                                        >
                                            <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                marginRight: '8px',
                                                flex: 1
                                            }}>
                                                🎬 {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeVideo(index)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'rgba(220, 38, 38, 0.85)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '11px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Retirer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={uploadingPhotos || uploadingVideos || loadingSummary}
                        style={{
                            width: '100%',
                            padding: '20px',
                            background: (uploadingPhotos || uploadingVideos || loadingSummary)
                                ? '#6b7280'
                                : 'linear-gradient(135deg, #8b45ff, #3b82f6)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '700',
                            cursor: (uploadingPhotos || uploadingVideos || loadingSummary) ? 'not-allowed' : 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        {uploadingPhotos
                            ? '⏳ Upload photos...'
                            : uploadingVideos
                                ? '⏳ Upload vidéos...'
                                : loadingSummary
                                    ? '🤖 Génération résumé...'
                                    : '🎉 TERMINER & QUIZ'}
                    </button>
                </form>
            </div>

            {/* Notification Battle Points */}
            {notificationData && (
                <BattlePointsNotification
                    results={notificationData}
                    onClose={() => setNotificationData(null)}
                />
            )}
        </div>
    );
};

export default CompetitivePartyModal;