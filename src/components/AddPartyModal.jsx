import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data';
import LoadingSpinner from './LoadingSpinner';
import DrinkAnalyzer from './DrinkAnalyzer';
import QuizManagerSimple from './QuizManagerSimple';
import { PlusCircle, Trash2, XCircle, Users, User } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddPartyModal = ({ onClose, onPartySaved, draftData }) => {
    logger.debug("AddPartyModal rendu/re-rendu", { hasDraftData: !!draftData });
    
    const { db, user, appId, setMessageBox, functions, userProfile } = useContext(FirebaseContext);
    
    // Initialiser les données depuis le draft si disponible
    const initializeFromDraft = () => {
        if (draftData) {
            logger.info("Initialisation depuis le draft", { draftData });
            return {
                date: draftData.startTime ? new Date(draftData.startTime.seconds ? draftData.startTime.toDate() : draftData.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                drinks: draftData.drinks && draftData.drinks.length > 0 ? draftData.drinks : [{ type: 'Bière', brand: '', quantity: 1 }],
                stats: {
                    girlsTalkedTo: draftData.events?.girlsTalkedTo || 0,
                    fights: draftData.events?.fights || 0,
                    recal: draftData.events?.recal || 0,
                    vomi: draftData.events?.vomi || 0,
                    elleVeutElleVeut: draftData.events?.elleVeutElleVeut || 0
                },
                location: draftData.location || '',
                category: draftData.category || partyCategories[0],
                companions: draftData.companions || { type: 'none', selectedIds: [], selectedNames: [] }
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            drinks: [{ type: 'Bière', brand: '', quantity: 1 }],
            stats: { girlsTalkedTo: 0, fights: 0, recal: 0, vomi: 0, elleVeutElleVeut: 0 },
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
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadingVideos, setUploadingVideos] = useState(false);
    
    // États pour la gestion des amis et groupes
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);

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

                // Charger les groupes (structure simplifiée)
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
                console.error('Erreur chargement compagnons:', error);
            } finally {
                setLoadingCompanions(false);
            }
        };

        loadCompanionsData();
    }, [user, db, userProfile, appId]);

    // Fonction pour gérer le changement de type de compagnon
    const handleCompanionTypeChange = (type) => {
        setCompanions({ type, selectedIds: [], selectedNames: [] });
    };

    // Fonction pour gérer la sélection/désélection d'amis
    const handleFriendToggle = (friendId, friendName) => {
        setCompanions(prev => {
            const isSelected = prev.selectedIds.includes(friendId);
            if (isSelected) {
                return {
                    ...prev,
                    selectedIds: prev.selectedIds.filter(id => id !== friendId),
                    selectedNames: prev.selectedNames.filter(name => name !== friendName)
                };
            } else {
                return {
                    ...prev,
                    selectedIds: [...prev.selectedIds, friendId],
                    selectedNames: [...prev.selectedNames, friendName]
                };
            }
        });
    };

    // Fonction pour gérer la sélection de groupe
    const handleGroupSelect = (groupId, groupName) => {
        setCompanions({
            type: 'group',
            selectedIds: [groupId],
            selectedNames: [groupName]
        });
    };

    // Fonction pour gérer la fin du quiz et afficher le récapitulatif
    const handleQuizComplete = (resultTitle) => {
        console.log("✅ Quiz terminé, notification parent");
        setShowQuiz(false);
        
        // Fermer le modal et notifier le parent
        if (onPartySaved) {
            onPartySaved();
        }
        
        // Déclencher un rafraîchissement automatique du feed
        console.log("📡 Quiz terminé - Déclenchement rafraîchissement automatique du feed");
        window.dispatchEvent(new CustomEvent('refreshFeed'));
        
        onClose();
    };

    const handleStatChange = (field, value) => setStats(prev => ({ ...prev, [field]: Math.max(0, Number(value)) }));
    const handleDrinkChange = (index, field, value) => {
        const newDrinks = [...drinks];
        newDrinks[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
        if (field === 'type') newDrinks[index].brand = '';
        setDrinks(newDrinks);
    };

    // Fonction pour gérer la détection automatique de boisson
    const handleDrinkDetected = (drinkType, detectedBrand) => {
        console.log('🤖 Boisson détectée:', { drinkType, detectedBrand });
        
        // Ajouter ou remplacer la première boisson avec le type et la marque détectés
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

    // Fonctions pour gérer les photos
    const handlePhotoAdd = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.slice(0, 5 - photoFiles.length); // Limiter à 5 photos max
        
        setPhotoFiles(prev => [...prev, ...newPhotos]);
        console.log(`📸 ${newPhotos.length} photo(s) ajoutée(s), total: ${photoFiles.length + newPhotos.length}`);
    };

    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        console.log(`🗑️ Photo ${index + 1} supprimée`);
    };

    // Fonctions pour gérer les vidéos
    const handleVideoAdd = (e) => {
        const files = Array.from(e.target.files);
        const validVideos = [];
        
        for (const file of files) {
            // Vérifier la taille (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setMessageBox({ 
                    message: `Vidéo "${file.name}" trop volumineuse (max 50MB)`, 
                    type: "error" 
                });
                continue;
            }
            
            // Vérifier la durée via un élément vidéo temporaire
            const video = document.createElement('video');
            video.preload = 'metadata';
            
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
                        console.log(`🎥 ${validVideos.length} vidéo(s) ajoutée(s)`);
                    }
                }
                URL.revokeObjectURL(video.src);
            };
            
            video.src = URL.createObjectURL(file);
        }
    };

    const removeVideo = (index) => {
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
        console.log(`🗑️ Vidéo ${index + 1} supprimée`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("🎉 Début soumission de soirée", { user: !!user, db: !!db });
        
        if (!user || !db) return setMessageBox({ message: "Connexion requise.", type: "error" });

        const partyData = { 
            date, 
            drinks, 
            ...stats, 
            location, 
            category, 
            companions,
            timestamp: Timestamp.now(), 
            userId: user.uid, 
            username: userProfile?.username || "Anonyme" 
        };
        console.log("📋 Données de soirée:", partyData);
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);
            console.log("✅ Soirée sauvegardée avec ID:", docRef.id);
            
            // Préparer et lancer le quiz IMMÉDIATEMENT
            setLastPartyData(partyData);
            setLastPartyId(docRef.id);
            console.log("🎯 Lancement immédiat du quiz - Upload des photos en arrière-plan");
            setShowQuiz(true);
            
            // Upload photos EN ARRIÈRE-PLAN (ne bloque pas le quiz)
            if (photoFiles.length > 0) {
                console.log(`📸 Début upload en arrière-plan de ${photoFiles.length} photo(s)...`);
                
                // Upload asynchrone sans attendre
                (async () => {
                    try {
                        setUploadingPhotos(true);
                        const photoURLs = [];
                        
                        for (let i = 0; i < photoFiles.length; i++) {
                            const photoFile = photoFiles[i];
                            console.log(`📸 Upload arrière-plan photo ${i + 1}/${photoFiles.length}:`, {
                                fileName: photoFile.name,
                                fileSize: photoFile.size,
                                fileType: photoFile.type
                            });
                            
                            const storagePath = `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/photo_${i + 1}.jpg`;
                            console.log(`📁 Chemin: ${storagePath}`);
                            
                            const storageRefPhoto = ref(storage, storagePath);
                            await uploadBytes(storageRefPhoto, photoFile);
                            console.log(`✅ Photo ${i + 1} uploadée vers Storage`);
                            
                            const photoURL = await getDownloadURL(storageRefPhoto);
                            photoURLs.push(photoURL);
                            console.log(`🔗 URL photo ${i + 1} obtenue`);
                        }
                        
                        // Sauvegarder toutes les URLs dans Firestore
                        const partyRefWithPhotos = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id);
                        await updateDoc(partyRefWithPhotos, { 
                            photoURLs: photoURLs,
                            photosCount: photoURLs.length 
                        });
                        console.log(`✅ ${photoURLs.length} URL(s) sauvegardée(s) dans Firestore - Upload terminé !`);
                        
                        console.log("🎉 Toutes les photos uploadées et référencées en arrière-plan !");
                    } catch (photoError) {
                        console.error("❌ Erreur upload photos en arrière-plan:", photoError);
                        console.error("❌ Détails de l'erreur:", {
                            code: photoError.code,
                            message: photoError.message,
                            stack: photoError.stack
                        });
                    } finally {
                        setUploadingPhotos(false);
                    }
                })();
            }
            
            // Upload vidéos EN ARRIÈRE-PLAN (ne bloque pas le quiz)
            if (videoFiles.length > 0) {
                console.log(`🎥 Début upload en arrière-plan de ${videoFiles.length} vidéo(s)...`);
                
                // Upload asynchrone sans attendre
                (async () => {
                    try {
                        setUploadingVideos(true);
                        const videoURLs = [];
                        
                        for (let i = 0; i < videoFiles.length; i++) {
                            const videoFile = videoFiles[i];
                            console.log(`🎥 Upload arrière-plan vidéo ${i + 1}/${videoFiles.length}:`, {
                                fileName: videoFile.name,
                                fileSize: videoFile.size,
                                fileType: videoFile.type
                            });
                            
                            const storagePath = `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/video_${i + 1}.mp4`;
                            console.log(`📁 Chemin: ${storagePath}`);
                            
                            const storageRefVideo = ref(storage, storagePath);
                            await uploadBytes(storageRefVideo, videoFile);
                            console.log(`✅ Vidéo ${i + 1} uploadée vers Storage`);
                            
                            const videoURL = await getDownloadURL(storageRefVideo);
                            videoURLs.push(videoURL);
                            console.log(`🔗 URL vidéo ${i + 1} obtenue`);
                        }
                        
                        // Sauvegarder toutes les URLs dans Firestore
                        const partyRefWithVideos = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id);
                        await updateDoc(partyRefWithVideos, { 
                            videoURLs: videoURLs,
                            videosCount: videoURLs.length 
                        });
                        console.log(`✅ ${videoURLs.length} URL(s) vidéo sauvegardée(s) dans Firestore - Upload terminé !`);
                        
                        console.log("🎉 Toutes les vidéos uploadées et référencées en arrière-plan !");
                        
                        // Notifier le parent pour rafraîchir le feed
                        if (onPartySaved) {
                            console.log("🔄 Notification parent pour rafraîchir le feed...");
                            onPartySaved();
                        }
                        
                        // Déclencher un rafraîchissement automatique du feed
                        console.log("📡 Déclenchement de l'événement de rafraîchissement global du feed");
                        window.dispatchEvent(new CustomEvent('refreshFeed'));
                    } catch (videoError) {
                        console.error("❌ Erreur upload vidéos en arrière-plan:", videoError);
                        console.error("❌ Détails de l'erreur:", {
                            code: videoError.code,
                            message: videoError.message,
                            stack: videoError.stack
                        });
                    } finally {
                        setUploadingVideos(false);
                    }
                })();
            }
            
            // Générer le résumé de la soirée EN ARRIÈRE-PLAN aussi
            generatePartySummary(partyData, docRef.id);
            
        } catch (error) {
            console.error("❌ Erreur enregistrement soirée:", error);
            setMessageBox({ message: "Erreur lors de l'enregistrement.", type: "error" });
        }
    };

    const generatePartySummary = useCallback(async (partyDetails, docId) => {
        setLoadingSummary(true);
        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const prompt = `Génère un résumé de soirée amusant et mémorable (max 3 phrases) basé sur: ${JSON.stringify(partyDetails)}. Sois créatif et humoristique.`;
        try {
            console.log("🤖 Génération du résumé de soirée...");
            const result = await callGeminiAPI({ prompt });
            if (result.data.text) {
                const summary = result.data.text;
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, { summary });
                console.log("✅ Résumé généré et sauvegardé:", summary);
            }
        } catch (error) { 
            console.error("❌ Erreur génération résumé via Cloud Function:", error); 
        } finally {
            setLoadingSummary(false);
        }
    }, [db, user, appId, functions]);

    // If quiz is activated, unmount form and display quiz modal
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
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
        >
            <div 
                style={{
                    backgroundColor: '#1a1a2e',
                    borderRadius: '20px',
                    border: '2px solid #8b45ff',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Header avec titre et bouton close */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'clamp(16px, 5vw, 24px) clamp(16px, 5vw, 24px) 0 clamp(16px, 5vw, 24px)', // Responsive padding
                    marginBottom: 'clamp(16px, 5vw, 24px)', // Responsive margin
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: 'clamp(18px, 5vw, 24px)', // Responsive font size
                        fontWeight: '600',
                        margin: 0,
                        textAlign: 'center',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {draftData ? '📝 Finaliser la Soirée' : 'Enregistrer une Soirée'}
                    </h2>
                    
                    {draftData && (
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            left: '24px',
                            right: '24px',
                            backgroundColor: 'rgba(139, 69, 255, 0.2)',
                            border: '1px solid #8b45ff',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                color: '#c084fc',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                🎉 Données du Mode Soirée récupérées
                            </div>
                            <div style={{
                                color: '#9ca3af',
                                fontSize: '12px',
                                marginTop: '4px'
                            }}>
                                Vous pouvez maintenant finaliser et compléter votre soirée
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#9ca3af';
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {(loadingSummary || uploadingPhotos || uploadingVideos) && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        zIndex: 10
                    }}>
                        <LoadingSpinner text={
                            uploadingVideos ? "Upload des vidéos..." : 
                            uploadingPhotos ? "Upload des photos..." : 
                            "Finalisation..."
                        } />
                    </div>
                )}

                {/* Contenu scrollable */}
                <div style={{
                    padding: '0 24px 24px 24px',
                    paddingTop: draftData ? '20px' : '0', // Espace supplémentaire si notification
                    maxHeight: 'calc(90vh - 120px)',
                    overflowY: 'auto'
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Date */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
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
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            />
                        </div>

                        {/* Analyseur de boisson IA */}
                        <DrinkAnalyzer 
                            onDrinkDetected={handleDrinkDetected}
                            setMessageBox={setMessageBox}
                        />

                        {/* Boissons */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '16px'
                            }}>
                                Boissons:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {drinks.map((drink, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: '#2d3748',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px'
                                    }}>
                                        <select 
                                            value={drink.type} 
                                            onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                            style={{
                                                width: '100px',
                                                padding: '10px 8px',
                                                backgroundColor: '#374151',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '11px',
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
                                                    minWidth: 0,
                                                    padding: '10px 8px',
                                                    backgroundColor: '#374151',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '11px',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>Marque</option>
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
                                                width: '50px',
                                                padding: '10px 8px',
                                                backgroundColor: '#374151',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                textAlign: 'center'
                                            }}
                                        />
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => removeDrink(index)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#dc2626',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={addDrink}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px',
                                    backgroundColor: '#8b45ff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#8b45ff'}
                            >
                                <PlusCircle size={20} />
                                Ajouter
                            </button>
                        </div>
                        {/* Statistiques en grille 2x2 */}
                        <div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px'
                            }}>
                                {/* Vomis */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Vomis:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.vomi} 
                                        onChange={(e) => handleStatChange('vomi', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Bagarres */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Bagarres:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.fights} 
                                        onChange={(e) => handleStatChange('fights', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Recals */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Recals:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.recal} 
                                        onChange={(e) => handleStatChange('recal', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Filles parlées */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Filles parlées:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.girlsTalkedTo} 
                                        onChange={(e) => handleStatChange('girlsTalkedTo', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Elle veut, elle veut (champ seul) */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Elle veut, elle veut:
                            </label>
                            <input 
                                type="number" 
                                value={stats.elleVeutElleVeut} 
                                onChange={(e) => handleStatChange('elleVeutElleVeut', e.target.value)} 
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                        {/* Lieu */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Lieu:
                            </label>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="Où s'est déroulée la soirée ?"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            />
                        </div>
                        
                        {/* Compagnons */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Avec qui étiez-vous ?
                            </label>
                            
                            {/* Sélecteur de type */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('none')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'none' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'none' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Seul(e)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('friends')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'friends' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'friends' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <User size={16} />
                                    Amis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('group')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'group' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'group' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Users size={16} />
                                    Groupe
                                </button>
                            </div>

                            {/* Liste des amis (si amis sélectionné) */}
                            {companions.type === 'friends' && (
                                <div style={{
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {loadingCompanions ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Chargement des amis...
                                        </div>
                                    ) : friendsList.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Aucun ami trouvé
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {friendsList.map(friend => (
                                                <label
                                                    key={friend.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: companions.selectedIds.includes(friend.id) ? 'rgba(139, 69, 255, 0.2)' : 'transparent',
                                                        border: companions.selectedIds.includes(friend.id) ? '1px solid #8b45ff' : '1px solid transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={companions.selectedIds.includes(friend.id)}
                                                        onChange={() => handleFriendToggle(friend.id, friend.username)}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: '#8b45ff'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: companions.selectedIds.includes(friend.id) ? '600' : '400'
                                                    }}>
                                                        {friend.username}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Liste des groupes (si groupe sélectionné) */}
                            {companions.type === 'group' && (
                                <div style={{
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {loadingCompanions ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Chargement des groupes...
                                        </div>
                                    ) : groupsList.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Aucun groupe trouvé
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {groupsList.map(group => (
                                                <label
                                                    key={group.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: companions.selectedIds.includes(group.id) ? 'rgba(139, 69, 255, 0.2)' : 'transparent',
                                                        border: companions.selectedIds.includes(group.id) ? '1px solid #8b45ff' : '1px solid transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="selectedGroup"
                                                        checked={companions.selectedIds.includes(group.id)}
                                                        onChange={() => handleGroupSelect(group.id, group.name)}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: '#8b45ff'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: companions.selectedIds.includes(group.id) ? '600' : '400'
                                                    }}>
                                                        {group.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Affichage des compagnons sélectionnés */}
                            {companions.selectedNames.length > 0 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(139, 69, 255, 0.1)',
                                    border: '1px solid #8b45ff',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        color: '#c084fc',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        marginBottom: '4px'
                                    }}>
                                        {companions.type === 'friends' ? 'Amis sélectionnés :' : 'Groupe sélectionné :'}
                                    </div>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '14px'
                                    }}>
                                        {companions.selectedNames.join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Catégorie */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Catégorie:
                            </label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            >
                                {partyCategories.map(cat => (
                                    <option key={cat} value={cat} style={{ backgroundColor: '#2d3748', color: 'white' }}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Section Photos avec interface smartphone */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Photos de la soirée ({photoFiles.length}/5):
                            </label>
                            
                            {/* Grille des photos existantes */}
                            {photoFiles.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                                    gap: '12px',
                                    marginBottom: '16px',
                                    padding: '16px',
                                    backgroundColor: '#2d3748',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    {photoFiles.map((photo, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '1',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#374151'
                                            }}
                                        >
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Photo ${index + 1}`}
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
                                                    width: '24px',
                                                    height: '24px',
                                                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Bouton d'ajout de photos (seulement si moins de 5) */}
                            {photoFiles.length < 5 && (
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple
                                        onChange={handlePhotoAdd}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            width: '100%',
                                            padding: '20px',
                                            backgroundColor: '#374151',
                                            border: '2px dashed #8b45ff',
                                            borderRadius: '12px',
                                            color: '#8b45ff',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>📸</span>
                                        <span>Ajouter des photos</span>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            color: '#9ca3af',
                                            fontWeight: '400' 
                                        }}>
                                            {photoFiles.length === 0 
                                                ? 'Touchez pour sélectionner jusqu\'à 5 photos'
                                                : `Encore ${5 - photoFiles.length} photo(s) possible(s)`
                                            }
                                        </span>
                                    </button>
                                </div>
                            )}
                            
                            {/* Message si limite atteinte */}
                            {photoFiles.length === 5 && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'rgba(139, 69, 255, 0.1)',
                                    border: '1px solid #8b45ff',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#c084fc', fontSize: '14px' }}>
                                        ✅ Limite de 5 photos atteinte
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Section Vidéos avec interface smartphone */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Vidéos de la soirée ({videoFiles.length}/3) - Max 20 secondes:
                            </label>
                            
                            {/* Grille des vidéos existantes */}
                            {videoFiles.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '12px',
                                    marginBottom: '16px',
                                    padding: '16px',
                                    backgroundColor: '#2d3748',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    {videoFiles.map((video, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '16/9',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#374151'
                                            }}
                                        >
                                            <video
                                                src={URL.createObjectURL(video)}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                muted
                                                playsInline
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                color: 'white',
                                                fontSize: '20px',
                                                pointerEvents: 'none'
                                            }}>
                                                ▶️
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeVideo(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    width: '24px',
                                                    height: '24px',
                                                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Bouton d'ajout de vidéos (seulement si moins de 3) */}
                            {videoFiles.length < 3 && (
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="file" 
                                        accept="video/*" 
                                        multiple
                                        onChange={handleVideoAdd}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            width: '100%',
                                            padding: '20px',
                                            backgroundColor: '#374151',
                                            border: '2px dashed #10b981',
                                            borderRadius: '12px',
                                            color: '#10b981',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>🎥</span>
                                        <span>Ajouter des vidéos</span>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            color: '#9ca3af',
                                            fontWeight: '400' 
                                        }}>
                                            {videoFiles.length === 0 
                                                ? 'Max 20 sec, jusqu\'à 3 vidéos, 50MB max'
                                                : `Encore ${3 - videoFiles.length} vidéo(s) possible(s)`
                                            }
                                        </span>
                                    </button>
                                </div>
                            )}
                            
                            {/* Message si limite atteinte */}
                            {videoFiles.length === 3 && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid #10b981',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#34d399', fontSize: '14px' }}>
                                        ✅ Limite de 3 vidéos atteinte
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bouton submit */}
                        <button 
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '18px 24px',
                                backgroundColor: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b45ff'}
                        >
                            🎉 Enregistrer & Lancer le Quiz
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPartyModal;