import React, { useState, useContext, useEffect } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data.jsx';
import { Upload, X, Trash2, PlusCircle, Play, Square, Clock, Trophy, Users, User, Video } from 'lucide-react';
import useBattleRoyale from '../hooks/useBattleRoyale.js';
import QuizManagerSimple from './QuizManagerSimple';
import DrinkAnalyzer from './DrinkAnalyzer';
import UserAvatar from './UserAvatar';

const CompetitivePartyModal = ({ onClose, onPartySaved, draftData = null }) => {
    const { db, storage, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    
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
    const [date, setDate] = useState(initialData.date);
    const [drinks, setDrinks] = useState(initialData.drinks);
    const [stats, setStats] = useState(initialData.stats);
    const [location, setLocation] = useState(initialData.location);
    const [category, setCategory] = useState(initialData.category);
    const [companions, setCompanions] = useState(initialData.companions);
    const [lastPartyData, setLastPartyData] = useState(null);
    const [lastPartyId, setLastPartyId] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    
    // États pour les médias et compagnons
    const [videoFiles, setVideoFiles] = useState([]);
    const [uploadingVideos, setUploadingVideos] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);
    
    // États pour les données temporelles
    const [partyStartTime, setPartyStartTime] = useState(draftData?.startTime || '');
    const [partyEndTime, setPartyEndTime] = useState(draftData?.endTime || '');
    const [isPartyOngoing, setIsPartyOngoing] = useState(draftData?.isOngoing || false);
    const [realTimeMode, setRealTimeMode] = useState(draftData?.realTimeMode || false);
    
    // Battle Royale integration
    const { userTournaments, processPartyForTournaments } = useBattleRoyale();
    const [selectedBattleMode, setSelectedBattleMode] = useState(draftData?.battleMode || 'balanced');

    const handleQuizComplete = (resultTitle) => {
        setShowQuiz(false);
        if (onPartySaved) onPartySaved();
        window.dispatchEvent(new CustomEvent('refreshFeed'));
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
        console.log('🤖 Boisson détectée:', { drinkType, detectedBrand });
        
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
            // Si le document n'existe pas, le créer
            try {
                await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/draft`), draftData);
                setMessageBox({ message: "Brouillon sauvegardé !", type: "success" });
            } catch (createError) {
                console.error("Erreur sauvegarde brouillon:", createError);
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
            mode: 'competitive' // Marqueur pour identifier le mode
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
                    console.error("Erreur calcul points Battle Royale:", battleError);
                }
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
                    console.error("Erreur upload photos:", photoError);
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
                    console.error("Erreur upload vidéos:", videoError);
                } finally {
                    setUploadingVideos(false);
                }
            }
            
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
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
                            console.error('Erreur chargement ami:', error);
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
                            console.error('Erreur chargement groupe:', error);
                        }
                    }
                    setGroupsList(groupsData);
                }
            } catch (error) {
                console.error('Erreur chargement compagnons:', error);
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
            padding: '10px',
            paddingTop: '30px',
            overflowY: 'auto'
        }}>
            <div style={{
                backgroundColor: '#1a202c',
                borderRadius: '20px',
                padding: '20px',
                maxWidth: '420px',
                width: '100%',
                maxHeight: '98vh',
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

                    {/* Battle Royale - si l'utilisateur participe à des tournois */}
                    {userTournaments.length > 0 && (
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.15), rgba(255, 107, 53, 0.15))',
                            border: '1px solid rgba(139, 69, 255, 0.3)',
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <Trophy size={18} style={{ color: '#FF6B35' }} />
                                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                                    Mode Battle Royale
                                </span>
                            </div>
                            
                            <select 
                                value={selectedBattleMode} 
                                onChange={(e) => setSelectedBattleMode(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255, 107, 53, 0.1)',
                                    border: '1px solid rgba(255, 107, 53, 0.3)',
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
                    )}

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
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: '4px' }}>
                                    {videoFiles.length} vidéo{videoFiles.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Infos rapides */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                    }}>
                        <div>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="📍 Lieu"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                    </div>

                    {/* Photos rapides */}
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

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={uploadingPhotos}
                        style={{
                            width: '100%',
                            padding: '20px',
                            background: uploadingPhotos ? '#6b7280' : 'linear-gradient(135deg, #8b45ff, #3b82f6)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '700',
                            cursor: uploadingPhotos ? 'not-allowed' : 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        {uploadingPhotos ? '⏳ Upload...' : '🎉 TERMINER & QUIZ'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompetitivePartyModal;