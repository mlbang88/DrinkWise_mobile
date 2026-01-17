import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data.jsx';
import { Upload, X, Trash2, PlusCircle, Plus, Minus, Users, User, Video, MapPin } from 'lucide-react';
import DrinkAnalyzer from './DrinkAnalyzer';
import UserAvatar from './UserAvatar';
import { logger } from '../utils/logger.js';
import VenueSearchModal from './VenueSearchModal';
import PartySuggestions from './PartySuggestions';
import { updateVenueControl } from '../services/venueService';
import { StreakService } from '../services/streakService';

const BasicPartyModal = ({ onClose, onPartySaved }) => {
    const { db, storage, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    const modalRef = useRef(null);
    
    // États de base
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [drinks, setDrinks] = useState([{ type: 'Bière', brand: '', quantity: 1 }]);
    const [stats, setStats] = useState({
        newNumbersGot: 0,
        elleVeut: 0,
        timeFightsStarted: 0,
        vomitCount: 0
    });
    const [location, setLocation] = useState('');
    const [venue, setVenue] = useState(null);
    const [category, setCategory] = useState(partyCategories[0]);
    const [companions, setCompanions] = useState({ type: 'none', selectedIds: [], selectedNames: [] });
    
    // États pour les médias
    const [photoFiles, setPhotoFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadingVideos, setUploadingVideos] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Forcer le scroll en haut à l'ouverture
    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.scrollTop = 0;
        }
    }, []);

    // États pour la gestion des amis et groupes
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);

    const handleStatChange = (field, value) => setStats(prev => ({ ...prev, [field]: Math.max(0, Number(value)) }));
    
    const handleDrinkChange = (index, field, value) => {
        const newDrinks = [...drinks];
        newDrinks[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
        if (field === 'type') newDrinks[index].brand = '';
        setDrinks(newDrinks);
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

    // Fonction pour gérer la détection automatique de boisson
    const handleDrinkDetected = (drinkType, detectedBrand) => {
        logger.info('BasicPartyModal: Boisson détectée', { drinkType, detectedBrand });
        
        const newDrinks = [...drinks];
        if (newDrinks.length === 0) {
            newDrinks.push({ 
                type: drinkType, 
                brand: detectedBrand || '', 
                quantity: 1 
            });
        } else {
            newDrinks[0] = { 
                ...newDrinks[0], 
                type: drinkType, 
                brand: detectedBrand || newDrinks[0].brand || ''
            };
        }
        setDrinks(newDrinks);
    };

    const addDrink = () => setDrinks([...drinks, { type: 'Bière', brand: '', quantity: 1 }]);
    const removeDrink = (index) => setDrinks(drinks.filter((_, i) => i !== index));

    const handlePhotoAdd = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.slice(0, 5 - photoFiles.length);
        setPhotoFiles(prev => [...prev, ...newPhotos]);
    };

    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Fonctions pour gérer les vidéos
    const handleVideoAdd = (e) => {
        const files = Array.from(e.target.files);
        const validVideos = [];
        
        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                setMessageBox({ 
                    message: `Vidéo "${file.name}" trop volumineuse (max 50MB)`, 
                    type: "error" 
                });
                continue;
            }
            
            const video = document.createElement('video');
            video.onloadedmetadata = function() {
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
                            logger.error('Erreur chargement ami', { error: error.message });
                        }
                    }
                    setFriendsList(friendsData);
                }

                // Charger les groupes
                try {
                    const groupsQuery = query(
                        collection(db, `artifacts/${appId}/groups`),
                        where('members', 'array-contains', user.uid)
                    );
                    const groupsSnapshot = await getDocs(groupsQuery);
                    const groupsData = groupsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || 'Groupe',
                        ...doc.data()
                    }));
                    setGroupsList(groupsData);
                } catch (error) {
                    logger.error('Erreur chargement groupes', { error: error.message });
                }
            } catch (error) {
                logger.error('Erreur chargement compagnons', { error: error.message });
            } finally {
                setLoadingCompanions(false);
            }
        };

        loadCompanionsData();
    }, [user, db, userProfile, appId]);

    const buildFallbackSummary = useCallback((details) => {
        const safeDetails = details || {};
        const drinksList = Array.isArray(safeDetails.drinks) ? safeDetails.drinks : [];
        const totalDrinks = drinksList.reduce((sum, drink) => sum + (Number(drink?.quantity) || 0), 0);
        const highlightDrink = drinksList.find((drink) => drink?.type)?.type || (drinksList.length > 0 ? 'quelques breuvages surprises' : 'une ambiance cozy');
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

        const vibe = highlights.length > 0 ? highlights.join(', ') : 'des ondes positives';

        return `Soirée à ${locationLabel} ${companionsText}, ${vibe} et ${highlightDrink} en tête d'affiche. À noter dans le carnet de fêtes !`;
    }, []);

    // Fonction pour générer le résumé de soirée
    const generatePartySummary = useCallback(async (partyDetails, docId) => {
        if (!functions) {
            logger.warn('PARTY', 'Fonctions Firebase indisponibles, résumé non généré');
            return;
        }

        if (!partyDetails || !docId) {
            logger.warn('PARTY', 'Données insuffisantes pour générer le résumé', { partyDetails, docId });
            return;
        }

        setLoadingSummary(true);
        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const safeDetails = {
            ...partyDetails,
            drinks: Array.isArray(partyDetails.drinks) ? partyDetails.drinks : [],
            stats: partyDetails.stats || {},
            companions: partyDetails.companions || {}
        };
        
        // Prompt ULTRA SIMPLIFIÉ - demande directe de continuer
        const prompt = `Tu dois écrire un résumé de soirée LONG ET DÉTAILLÉ.

DONNÉES:
📍 Lieu: ${safeDetails.location || 'lieu non précisé'}
🍺 Boissons: ${safeDetails.drinks?.map(d => d.type).join(', ') || 'aucune'}
👥 Avec: ${safeDetails.companions?.type === 'friends' ? safeDetails.companions.selectedNames?.join(', ') || 'seul' : safeDetails.companions?.type === 'group' ? safeDetails.companions.selectedNames?.[0] || 'un groupe' : 'seul'}
📊 ${safeDetails.stats?.newNumbersGot || 0} rencontres, ${safeDetails.stats?.timeFightsStarted || 0} bagarres

INSTRUCTIONS:
Écris 3 phrases. CHAQUE phrase doit faire MINIMUM 30 mots.
Ne t'arrête PAS avant d'avoir écrit 3 phrases COMPLÈTES de 30+ mots chacune.
Total attendu: 90-120 mots minimum.

COMMENCE MAINTENANT - Phrase 1 (30+ mots sur l'ambiance et le lieu):`;

        try {
            logger.info('PARTY', 'Génération du résumé de soirée...');
            const result = await callGeminiAPI({ prompt, partyId: docId });
            logger.info('PARTY', 'Réponse brute callGeminiAPI', result);
            
            const aiSummary = (result?.data?.text || result?.data?.summary || '').trim();
            logger.info('PARTY', 'Résumé extrait', { 
                length: aiSummary.length, 
                text: aiSummary,
                firstChars: aiSummary.substring(0, 100)
            });
            
            const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);

            if (aiSummary) {
                await updateDoc(partyRef, {
                    summary: aiSummary,
                    summarySource: 'gemini',
                    summaryGeneratedAt: new Date()
                });
                logger.info('PARTY', 'Résumé sauvegardé en Firestore', { 
                    length: aiSummary.length,
                    preview: aiSummary.substring(0, 150) + (aiSummary.length > 150 ? '...' : '')
                });
            } else {
                const fallbackSummary = buildFallbackSummary(safeDetails);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-empty-response',
                    summaryGeneratedAt: new Date()
                });
                logger.warn('PARTY', 'Résultat inattendu de callGeminiAPI, fallback utilisé', result);
                setMessageBox({
                    message: "⚠️ Résumé IA indisponible, on a rédigé un retour manuel.",
                    type: 'warning'
                });
            }
        } catch (error) {
            logger.error('PARTY', 'Erreur génération résumé via Cloud Function', error);

            try {
                const fallbackSummary = buildFallbackSummary(partyDetails);
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-error',
                    summaryGeneratedAt: new Date()
                });
                logger.info('PARTY', 'Résumé fallback sauvegardé après erreur IA', fallbackSummary);
                setMessageBox({
                    message: "🛟 Résumé généré manuellement suite à une erreur IA.",
                    type: 'info'
                });
            } catch (fallbackError) {
                logger.error('PARTY', 'Impossible de sauvegarder le résumé fallback', fallbackError);
                setMessageBox({
                    message: "❌ Résumé indisponible pour cette soirée.",
                    type: 'error'
                });
            }
        } finally {
            setLoadingSummary(false);
        }
    }, [appId, buildFallbackSummary, db, functions, setMessageBox, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user || !db) return setMessageBox({ message: "Connexion requise.", type: "error" });

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
            mode: 'basic' // Marqueur pour identifier le mode
        };
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);

            // Mettre à jour le contrôle territorial si un lieu est sélectionné
            if (venue) {
                try {
                    const territoryResult = await updateVenueControl(db, appId, {
                        venue,
                        userId: user.uid,
                        username: userProfile?.username || "Anonyme",
                        partyData,
                        battleMode: 'balanced' // Mode par défaut pour soirée basique
                    });

                    if (territoryResult.success) {
                        logger.info('Contrôle territorial mis à jour', { pointsEarned: territoryResult.pointsEarned, level: territoryResult.level.name });
                        
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
                    logger.error('Erreur mise à jour contrôle territorial', { error: territoryError.message });
                }
            }
            
            // Upload photos en arrière-plan si présentes
            if (photoFiles.length > 0) {
                setUploadingPhotos(true);
                try {
                    // Vérifier que storage est bien défini
                    if (!storage) {
                        throw new Error('Storage non disponible - vérifier FirebaseContext');
                    }
                    
                    const photoURLs = [];
                    
                    for (let i = 0; i < photoFiles.length; i++) {
                        const photoFile = photoFiles[i];
                        const storagePath = `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/photo_${i + 1}.jpg`;
                        const storageRefPhoto = ref(storage, storagePath);
                        await uploadBytes(storageRefPhoto, photoFile);
                        const photoURL = await getDownloadURL(storageRefPhoto);
                        photoURLs.push(photoURL);
                    }
                    
                    // Mettre à jour avec les URLs des photos
                    await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id), { 
                        photoURLs: photoURLs,
                        photosCount: photoURLs.length 
                    });
                } catch (photoError) {
                    logger.error('Erreur upload photos', { error: photoError.message, storageAvailable: !!storage });
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
                    logger.error('Erreur upload vidéos', { error: videoError.message });
                } finally {
                    setUploadingVideos(false);
                }
            }

            setMessageBox({ message: "Soirée enregistrée avec succès !", type: "success" });
            
            // Mettre à jour le streak
            const streakResult = await StreakService.updateStreak(db, user.uid, appId);
            if (streakResult.streakUpdated && streakResult.streakIncreased) {
                setMessageBox({ 
                    message: `🔥 Série de ${streakResult.currentStreak} jours !`, 
                    type: "success" 
                });
            }
            
            // Générer le résumé de la soirée EN ARRIÈRE-PLAN aussi
            generatePartySummary(partyData, docRef.id);
            
            // Déclencher rafraîchissement du feed
            window.dispatchEvent(new CustomEvent('refreshFeed'));
            
            if (onPartySaved) onPartySaved();
            onClose();
            
        } catch (error) {
            logger.error('Erreur sauvegarde soirée', { error: error.message });
            setMessageBox({ message: "Erreur lors de la sauvegarde", type: "error" });
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                padding: '24px',
                maxWidth: '500px',
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
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: 0
                    }}>
                        📝 Nouvelle Soirée
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '8px',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Suggestions contextuelles */}
                <PartySuggestions 
                    partyData={{
                        drinks,
                        venue,
                        companions,
                        battleMode: 'balanced'
                    }}
                    userProfile={userProfile}
                />

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Date */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Date:
                        </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Boissons */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '12px'
                        }}>
                            Boissons:
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {drinks.map((drink, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px'
                                }}>
                                    <select 
                                        value={drink.type} 
                                        onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                        style={{
                                            width: '120px',
                                            padding: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    >
                                        {drinkOptions.map(opt => (
                                            <option key={opt.type} value={opt.type} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                {opt.type}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {drinkOptions.find(opt => opt.type === drink.type)?.brands.length > 0 && (
                                        <select 
                                            value={drink.brand} 
                                            onChange={(e) => handleDrinkChange(index, 'brand', e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">Marque</option>
                                            {drinkOptions.find(opt => opt.type === drink.type)?.brands.map(brand => (
                                                <option key={brand} value={brand} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                    {brand}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    <input 
                                        type="number" 
                                        value={drink.quantity} 
                                        onChange={(e) => handleDrinkChange(index, 'quantity', e.target.value)} 
                                        min="1"
                                        style={{
                                            width: '60px',
                                            padding: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
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
                                            borderRadius: '6px',
                                            padding: '8px',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={addDrink}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#8b45ff',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <PlusCircle size={16} />
                            Ajouter une boisson
                        </button>
                    </div>

                    {/* Détection IA des boissons */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            🤖 IA Détection de boissons:
                        </label>
                        <DrinkAnalyzer 
                            isDarkMode={true}
                            onDrinkDetected={handleDrinkDetected}
                        />
                    </div>

                    {/* Statistiques détaillées */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '12px'
                        }}>
                            Statistiques de la soirée:
                        </label>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            {/* Bagarres */}
                            <div style={{
                                background: 'rgba(251, 146, 60, 0.1)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(251, 146, 60, 0.3)'
                            }}>
                                <div style={{ color: '#fb923c', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                    Bagarres
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('timeFightsStarted', stats.timeFightsStarted - 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(251, 146, 60, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#fb923c',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                                        {stats.timeFightsStarted}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('timeFightsStarted', stats.timeFightsStarted + 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(251, 146, 60, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#fb923c',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Vomissements */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                    Vomissements
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('vomitCount', stats.vomitCount - 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#ef4444',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                                        {stats.vomitCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('vomitCount', stats.vomitCount + 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#ef4444',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>



                            {/* Nouveaux numéros */}
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                                <div style={{ color: '#22c55e', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                    Nouveaux numéros
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('newNumbersGot', stats.newNumbersGot - 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#22c55e',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                                        {stats.newNumbersGot}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('newNumbersGot', stats.newNumbersGot + 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#22c55e',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Elle veut */}
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                                <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                    Elle veut
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('elleVeut', stats.elleVeut - 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#3b82f6',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                                        {stats.elleVeut}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatChange('elleVeut', stats.elleVeut + 1)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: '#3b82f6',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lieu avec Google Maps */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Lieu (optionnel):
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

                    {/* Catégorie */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Type de soirée:
                        </label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        >
                            {partyCategories.map(cat => (
                                <option key={cat} value={cat} style={{ backgroundColor: '#374151', color: 'white' }}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sélection des compagnons */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '12px'
                        }}>
                            Avec qui étiez-vous ?
                        </label>
                        
                        {/* Type de compagnie */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'none', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: companions.type === 'none' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Seul(e)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'friends', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: companions.type === 'friends' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <User size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                Amis
                            </button>
                            <button
                                type="button"
                                onClick={() => setCompanions({ type: 'group', selectedIds: [], selectedNames: [] })}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: companions.type === 'group' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Users size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                Groupes
                            </button>
                        </div>

                        {/* Liste des amis */}
                        {companions.type === 'friends' && friendsList.length > 0 && (
                            <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '8px'
                            }}>
                                {friendsList.map(friend => (
                                    <div
                                        key={friend.id}
                                        onClick={() => toggleCompanionSelection('friends', friend.id, friend.displayName)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px',
                                            background: companions.selectedIds.includes(friend.id) ? 'rgba(139, 69, 255, 0.3)' : 'transparent',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: companions.selectedIds.includes(friend.id) ? '1px solid #8b45ff' : '1px solid transparent'
                                        }}
                                    >
                                        <UserAvatar user={friend} size={32} />
                                        <span style={{ color: 'white', fontSize: '14px' }}>
                                            {friend.displayName}
                                        </span>
                                        {companions.selectedIds.includes(friend.id) && (
                                            <div style={{
                                                marginLeft: 'auto',
                                                width: '16px',
                                                height: '16px',
                                                background: '#8b45ff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Liste des groupes */}
                        {companions.type === 'group' && groupsList.length > 0 && (
                            <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '8px'
                            }}>
                                {groupsList.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => toggleCompanionSelection('group', group.id, group.name)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px',
                                            background: companions.selectedIds.includes(group.id) ? 'rgba(139, 69, 255, 0.3)' : 'transparent',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: companions.selectedIds.includes(group.id) ? '1px solid #8b45ff' : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            background: 'linear-gradient(135deg, #8b45ff, #a855f7)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}>
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                                {group.name}
                                            </div>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                                                {group.memberCount} membres
                                            </div>
                                        </div>
                                        {companions.selectedIds.includes(group.id) && (
                                            <div style={{
                                                marginLeft: 'auto',
                                                width: '16px',
                                                height: '16px',
                                                background: '#8b45ff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Messages d'information */}
                        {companions.type === 'friends' && friendsList.length === 0 && !loadingCompanions && (
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255, 255, 0, 0.1)',
                                borderRadius: '8px',
                                color: '#fbbf24',
                                fontSize: '14px',
                                textAlign: 'center'
                            }}>
                                Aucun ami trouvé. Ajoutez des amis pour les sélectionner !
                            </div>
                        )}

                        {companions.type === 'group' && groupsList.length === 0 && !loadingCompanions && (
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255, 255, 0, 0.1)',
                                borderRadius: '8px',
                                color: '#fbbf24',
                                fontSize: '14px',
                                textAlign: 'center'
                            }}>
                                Aucun groupe trouvé. Créez ou rejoignez des groupes !
                            </div>
                        )}

                        {loadingCompanions && (
                            <div style={{
                                padding: '12px',
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                Chargement des compagnons...
                            </div>
                        )}
                    </div>



                    {/* Vidéos */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Vidéos (max 3, 20s chacune):
                        </label>
                        
                        {videoFiles.length < 3 && (
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '2px dashed rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                <Video size={20} />
                                <span>Ajouter des vidéos</span>
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
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: '8px',
                                marginTop: '12px'
                            }}>
                                {videoFiles.map((file, index) => (
                                    <div key={index} style={{
                                        position: 'relative',
                                        aspectRatio: '16/9',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <video
                                            src={URL.createObjectURL(file)}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            muted
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVideo(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(220, 38, 38, 0.8)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            left: '4px',
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '10px'
                                        }}>
                                            {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Détails de la soirée (optionnel) */}
                    <div>

                    </div>

                    {/* Photos */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Photos (max 5):
                        </label>
                        
                        {photoFiles.length < 5 && (
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '2px dashed rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                <Upload size={20} />
                                <span>Ajouter des photos</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoAdd}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                        
                        {photoFiles.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                gap: '8px',
                                marginTop: '12px'
                            }}>
                                {photoFiles.map((file, index) => (
                                    <div key={index} style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Aperçu photo ${index + 1}`}
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
                                                background: 'rgba(0, 0, 0, 0.7)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                padding: '4px',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={uploadingPhotos || uploadingVideos || loadingSummary}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: (uploadingPhotos || uploadingVideos || loadingSummary) ? '#6b7280' : 'linear-gradient(135deg, #8b45ff, #3b82f6)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: (uploadingPhotos || uploadingVideos || loadingSummary) ? 'not-allowed' : 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        {uploadingPhotos ? '⏳ Upload photos...' : uploadingVideos ? '⏳ Upload vidéos...' : loadingSummary ? '🤖 Génération résumé...' : '💾 Enregistrer la soirée'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BasicPartyModal;