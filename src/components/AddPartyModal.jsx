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
import { logger } from '../utils/logger.js';
import { useModalAnimation } from '../hooks/useAnimation.js';
import useBattleRoyale from '../hooks/useBattleRoyale.js';
import BattleModeGuide from './BattleModeGuide.jsx';

// Phase 2C: Animation components
import AnimatedButton from './AnimatedButton';
import AnimatedInput from './AnimatedInput';

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
            stats: { fights: 0, recal: 0, vomi: 0, elleVeutElleVeut: 0 },
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
    
    // États pour les données temporelles améliorées
    const [partyStartTime, setPartyStartTime] = useState('');
    const [partyEndTime, setPartyEndTime] = useState('');
    const [isPartyOngoing, setIsPartyOngoing] = useState(false);
    const [realTimeMode, setRealTimeMode] = useState(false);
    
    // États pour la gestion des amis et groupes
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);
    
    // État pour l'animation du modal
    const [isModalOpen, setIsModalOpen] = useState(true);
    
    // Battle Royale integration
    const { userTournaments, processPartyForTournaments } = useBattleRoyale();
    const [selectedBattleMode, setSelectedBattleMode] = useState('balanced');
    const [showModeGuide, setShowModeGuide] = useState(null);
    
    // Animation hook
    const { isVisible, animationStyles } = useModalAnimation(isModalOpen, onClose, 350);
    // Désactiver temporairement les animations staggered qui masquent le contenu
    const getItemStyle = () => ({ opacity: 1, transform: 'none' });
    
    // Fonction de fermeture animée
    const handleClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

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
                console.error('Erreur chargement compagnons:', error?.message || String(error));
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
    const handleQuizComplete = () => {
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
        
        // Ajouter un timestamp si c'est la première fois qu'on modifie cette boisson
        if (!newDrinks[index].timestamp) {
            newDrinks[index].timestamp = realTimeMode ? new Date().toISOString() : null;
        }
        
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
        console.log("🎉 Soirée commencée en temps réel:", now);
    };
    
    const handleEndParty = () => {
        const now = new Date().toISOString();
        setPartyEndTime(now);
        setIsPartyOngoing(false);
        console.log("⏰ Soirée terminée:", now);
    };
    
    const calculatePartyDuration = () => {
        if (!partyStartTime || !partyEndTime) return 0;
        const start = new Date(partyStartTime);
        const end = new Date(partyEndTime);
        return (end - start) / (1000 * 60 * 60); // Durée en heures
    };

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

        // Calculer la durée automatiquement si pas déjà calculée
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
            // Nouvelles données temporelles
            startTime: partyStartTime || null,
            endTime: partyEndTime || null,
            duration: partyDuration || null,
            realTimeTracking: realTimeMode
        };
        console.log("📋 Données de soirée:", partyData);
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);
            console.log("✅ Soirée sauvegardée avec ID:", docRef.id);
            
            // 🏆 Calculer les points Battle Royale si l'utilisateur participe à des tournois
            if (userTournaments.length > 0) {
                try {
                    console.log("🏆 Calcul des points Battle Royale en cours...");
                    const additionalData = {
                        isNewVenue: location && location.trim() !== '',
                        isOrganizer: companions.type !== 'none',
                        consistencyScore: 85, // Peut être calculé selon l'historique
                        adaptedToContext: true,
                        isPersonalRecord: drinks.length >= 8, // Record si >=8 boissons
                        madeOthersDance: stats.elleVeutElleVeut > 1 // Critère d'influence sociale
                    };
                    
                    await processPartyForTournaments(partyData, selectedBattleMode, additionalData);
                    console.log("✅ Points Battle Royale calculés et attribués !");
                } catch (battleError) {
                    console.error("❌ Erreur calcul points Battle Royale:", battleError?.message || String(battleError));
                    // Ne pas bloquer le flux principal en cas d'erreur
                }
            }
            
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
                        console.error("❌ Erreur upload photos en arrière-plan:", photoError?.message || String(photoError));
                        console.error("❌ Détails de l'erreur:", {
                            code: photoError?.code,
                            message: photoError?.message
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
                        console.error("❌ Erreur upload vidéos en arrière-plan:", videoError?.message || String(videoError));
                        console.error("❌ Détails de l'erreur:", {
                            code: videoError?.code,
                            message: videoError?.message
                        });
                    } finally {
                        setUploadingVideos(false);
                    }
                })();
            }
            
            // Générer le résumé de la soirée EN ARRIÈRE-PLAN aussi
            generatePartySummary(partyData, docRef.id);
            
        } catch (error) {
            console.error("❌ Erreur enregistrement soirée:", error?.message || String(error));
            setMessageBox({ message: "Erreur lors de l'enregistrement.", type: "error" });
        }
    };

    const buildFallbackSummary = useCallback((details) => {
        const safeDetails = details || {};
        const drinksList = Array.isArray(safeDetails.drinks) ? safeDetails.drinks : [];
        const totalDrinks = drinksList.reduce((sum, drink) => sum + (Number(drink?.quantity) || 0), 0);
        const highlightDrink = drinksList.find((drink) => drink?.type)?.type || (drinksList.length > 0 ? 'quelques cocktails surprises' : 'une ambiance chill');
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

        const newNumbers = Number(stats.newNumbersGot || stats.girlsTalkedTo || 0);
        if (newNumbers > 0) {
            highlights.push(`${newNumbers} nouveau${newNumbers > 1 ? 'x' : ''} contact${newNumbers > 1 ? 's' : ''}`);
        }

        const fights = Number(stats.timeFightsStarted || stats.fights || 0);
        if (fights > 0) {
            highlights.push(`${fights} embrouille${fights > 1 ? 's' : ''}`);
        }

        const vibe = highlights.length > 0 ? highlights.join(', ') : 'des vibes mémorables';

        return `Soirée à ${locationLabel} ${companionsText}, ${vibe} et ${highlightDrink} en star. À revivre très vite !`;
    }, []);

    const generatePartySummary = useCallback(async (partyDetails, docId) => {
        if (!functions) {
            console.warn('⚠️ Fonctions Firebase indisponibles, résumé non généré');
            return;
        }

        if (!partyDetails || !docId) {
            console.warn('⚠️ Données insuffisantes pour générer le résumé', { partyDetails, docId });
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
        const prompt = `Génère un résumé de soirée amusant et mémorable (max 3 phrases) basé sur: ${JSON.stringify(safeDetails)}. Sois créatif et humoristique.`;

        try {
            console.log("🤖 Génération du résumé de soirée...");
            const result = await callGeminiAPI({ prompt, partyId: docId });
            const aiSummary = (result?.data?.text || result?.data?.summary || '').trim();
            const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);

            if (aiSummary) {
                await updateDoc(partyRef, {
                    summary: aiSummary,
                    summarySource: 'gemini',
                    summaryGeneratedAt: new Date()
                });
                console.log("✅ Résumé généré et sauvegardé:", aiSummary);
            } else {
                const fallbackSummary = buildFallbackSummary(safeDetails);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-empty-response',
                    summaryGeneratedAt: new Date()
                });
                console.warn('⚠️ Résultat inattendu de callGeminiAPI, fallback utilisé', JSON.stringify(result));
                setMessageBox({
                    message: "⚠️ Résumé IA indisponible, on a généré une version manuelle.",
                    type: 'warning'
                });
            }
        } catch (error) {
            console.error("❌ Erreur génération résumé via Cloud Function:", error?.message || String(error));

            try {
                const fallbackSummary = buildFallbackSummary(partyDetails);
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, {
                    summary: fallbackSummary,
                    summarySource: 'fallback-error',
                    summaryGeneratedAt: new Date()
                });
                console.log("🛟 Résumé fallback sauvegardé après erreur IA:", fallbackSummary);
                setMessageBox({
                    message: "🛟 Résumé généré manuellement suite à une erreur IA.",
                    type: 'info'
                });
            } catch (fallbackError) {
                console.error('❌ Impossible de sauvegarder le résumé fallback:', fallbackError?.message || String(fallbackError));
                setMessageBox({
                    message: "❌ Résumé indisponible pour cette soirée.",
                    type: 'error'
                });
            }
        } finally {
            setLoadingSummary(false);
        }
    }, [appId, buildFallbackSummary, db, functions, setMessageBox, user]);

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

    if (!isVisible) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.9))',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '15px',
                paddingTop: '15px',
                ...animationStyles.overlay
            }}
        >
            <div 
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(45, 45, 80, 0.9))',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(139, 69, 255, 0.3)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    ...animationStyles.modal,
                    maxWidth: '500px',
                    height: '98vh',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header avec titre et bouton close */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px 16px 24px',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(139, 69, 255, 0.2)',
                    position: 'relative'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '22px',
                        fontWeight: '700',
                        margin: 0,
                        flex: 1,
                        letterSpacing: '-0.02em'
                    }}>
                        {draftData ? '📝 Finaliser la Soirée' : 'Enregistrer une Soirée'}
                    </h2>
                    
                    <button 
                        onClick={handleClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.transform = 'scale(1)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>
                
                {draftData && (
                    <div style={{
                        margin: '0 24px 16px 24px',
                        background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.3), rgba(99, 39, 215, 0.2))',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(139, 69, 255, 0.4)',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'center',
                        flexShrink: 0,
                        boxShadow: '0 8px 16px rgba(139, 69, 255, 0.2)'
                    }}>
                        <div style={{
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            letterSpacing: '-0.01em'
                        }}>
                            🎉 Données du Mode Soirée récupérées
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '13px',
                            marginTop: '6px',
                            fontWeight: '500'
                        }}>
                            Vous pouvez maintenant finaliser et compléter votre soirée
                        </div>
                    </div>
                )}

                {(loadingSummary || uploadingPhotos || uploadingVideos) && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.9), rgba(25, 25, 45, 0.85))',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '24px',
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
                    paddingTop: draftData ? '12px' : '0',
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Date */}
                        <div style={getItemStyle()}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '8px',
                                letterSpacing: '-0.01em'
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
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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

                        {/* Gestion temporelle de la soirée */}
                        <div style={getItemStyle()}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '12px',
                                letterSpacing: '-0.01em'
                            }}>
                                ⏰ Suivi de la soirée:
                            </label>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Mode temps réel */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: isPartyOngoing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                    border: `1px solid ${isPartyOngoing ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                                    borderRadius: '12px'
                                }}>
                                    <div>
                                        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                            {isPartyOngoing ? '🟢 Soirée en cours' : '🔵 Mode saisie manuelle'}
                                        </span>
                                        {partyStartTime && (
                                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '4px' }}>
                                                Commencée: {new Date(partyStartTime).toLocaleTimeString()}
                                                {partyEndTime && ` - Terminée: ${new Date(partyEndTime).toLocaleTimeString()}`}
                                                {partyStartTime && partyEndTime && (
                                                    <span style={{ color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
                                                        ({calculatePartyDuration().toFixed(1)}h)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!isPartyOngoing && !partyEndTime ? (
                                        <button
                                            type="button"
                                            onClick={handleStartParty}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        >
                                            🚀 Commencer
                                        </button>
                                    ) : isPartyOngoing ? (
                                        <button
                                            type="button"
                                            onClick={handleEndParty}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        >
                                            ⏹️ Terminer
                                        </button>
                                    ) : null}
                                </div>

                                {/* Durée manuelle si pas de mode temps réel */}
                                {!realTimeMode && (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                                                Heure de début
                                            </label>
                                            <input
                                                type="time"
                                                value={partyStartTime ? new Date(partyStartTime).toTimeString().slice(0, 5) : ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const today = new Date().toISOString().split('T')[0];
                                                        setPartyStartTime(`${today}T${e.target.value}:00.000Z`);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                                                Heure de fin
                                            </label>
                                            <input
                                                type="time"
                                                value={partyEndTime ? new Date(partyEndTime).toTimeString().slice(0, 5) : ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const today = new Date().toISOString().split('T')[0];
                                                        setPartyEndTime(`${today}T${e.target.value}:00.000Z`);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analyseur de boisson IA */}
                        <div style={getItemStyle()}>
                            <DrinkAnalyzer 
                            onDrinkDetected={handleDrinkDetected}
                            setMessageBox={setMessageBox}
                        />
                        </div>

                        {/* Boissons */}
                        <div style={getItemStyle()}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '16px',
                                letterSpacing: '-0.01em'
                            }}>
                                Boissons:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {drinks.map((drink, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {/* Ligne principale avec les contrôles */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}>
                                            <select 
                                                value={drink.type} 
                                                onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                                style={{
                                                    width: '110px',
                                                    padding: '12px 10px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    fontSize: '13px',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
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
                                        
                                        {/* Ligne d'information temporelle */}
                                        {(realTimeMode && drink.timestamp) && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: 'rgba(255, 255, 255, 0.8)'
                                            }}>
                                                <span>🕒</span>
                                                <span>Ajoutée à {new Date(drink.timestamp).toLocaleTimeString()}</span>
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
                                    padding: '10px 16px',
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
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#7c3aed';
                                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 255, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#8b45ff';
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 255, 0.3)';
                                }}
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
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        WebkitTextFillColor: 'white',
                                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
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
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        WebkitTextFillColor: 'white',
                                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
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
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        WebkitTextFillColor: 'white',
                                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
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

                        {/* Mode Battle Royale (affiché seulement si participant à des tournois) */}
                        {userTournaments.length > 0 && (
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(139, 69, 255, 0.1))',
                                border: '1px solid rgba(255, 107, 53, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                                marginTop: '10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{
                                        color: '#FF6B35',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        ⚔️ Mode Battle Royale
                                        <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 'normal' }}>
                                            ({userTournaments.length > 0 ? `${userTournaments.length} tournoi${userTournaments.length > 1 ? 's' : ''}` : 'Test'})
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowModeGuide(selectedBattleMode)}
                                        style={{
                                            background: 'rgba(255, 107, 53, 0.2)',
                                            border: '1px solid rgba(255, 107, 53, 0.5)',
                                            borderRadius: '20px',
                                            color: '#FF6B35',
                                            fontSize: '12px',
                                            padding: '4px 12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ❓ Aide
                                    </button>
                                </div>
                                <select 
                                    value={selectedBattleMode} 
                                    onChange={(e) => setSelectedBattleMode(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                                        border: '1px solid rgba(255, 107, 53, 0.3)',
                                        borderRadius: '12px',
                                        color: '#FF6B35',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#FF6B35';
                                        e.target.style.backgroundColor = 'rgba(255, 107, 53, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 107, 53, 0.3)';
                                        e.target.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
                                    }}
                                >
                                    <option value="balanced" style={{ backgroundColor: '#2d3748', color: '#F59E0B' }}>
                                        🎯 Balanced Player - Équilibre parfait
                                    </option>
                                    <option value="moderation" style={{ backgroundColor: '#2d3748', color: '#10B981' }}>
                                        🧠 Modération Master - Maîtrise & responsabilité
                                    </option>
                                    <option value="explorer" style={{ backgroundColor: '#2d3748', color: '#8B5CF6' }}>
                                        ✨ Explorer Pro - Découverte & créativité
                                    </option>
                                    <option value="social" style={{ backgroundColor: '#2d3748', color: '#EF4444' }}>
                                        ❤️ Social Host - Animation & organisation  
                                    </option>
                                    <option value="party" style={{ backgroundColor: '#2d3748', color: '#FF6B35' }}>
                                        ⚡ Party Beast - Maximum fun & endurance
                                    </option>
                                </select>
                                <div style={{ 
                                    marginTop: '10px', 
                                    fontSize: '12px', 
                                    color: '#ccc',
                                    fontStyle: 'italic'
                                }}>
                                    {userTournaments.length > 0 
                                        ? `Tes points seront calculés selon ce mode dans tes ${userTournaments.length} tournoi${userTournaments.length > 1 ? 's' : ''} actifs !`
                                        : 'Rejoins un tournoi pour que tes points soient calculés automatiquement !'
                                    }
                                </div>
                                
                                {/* Prévisualisation des points */}
                                {userTournaments.length > 0 && drinks.length > 0 && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.15), rgba(255, 107, 53, 0.15))',
                                        border: '1px solid rgba(139, 69, 255, 0.3)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '16px' }}>🏆</span>
                                            <span style={{ 
                                                color: 'white', 
                                                fontSize: '14px', 
                                                fontWeight: '600' 
                                            }}>
                                                Aperçu des points
                                            </span>
                                        </div>
                                        
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '8px',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                🍻 Boissons: {drinks.length}
                                            </div>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                ⏰ Durée: {partyStartTime && partyEndTime ? 
                                                    `${calculatePartyDuration().toFixed(1)}h` : 
                                                    'Non définie'
                                                }
                                            </div>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                👥 Compagnons: {companions.type !== 'none' ? 
                                                    companions.selectedNames.length : 0
                                                }
                                            </div>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                📍 Nouveau lieu: {location ? 'Oui' : 'Non'}
                                            </div>
                                        </div>
                                        
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
                                        
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '11px',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            textAlign: 'center',
                                            fontStyle: 'italic'
                                        }}>
                                            Points calculés après soumission de la soirée
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                                padding: '16px 20px',
                                backgroundColor: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '17px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#7c3aed';
                                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 255, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#8b45ff';
                                e.target.style.transform = 'translateY(0) scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 255, 0.3)';
                            }}
                        >
                            🎉 Enregistrer & Lancer le Quiz
                        </button>
                    </form>
                </div>
            </div>
            
            {/* Guide des modes Battle Royale */}
            {showModeGuide && (
                <BattleModeGuide 
                    mode={showModeGuide} 
                    onClose={() => setShowModeGuide(null)} 
                />
            )}
        </div>
    );
};

export default AddPartyModal;