import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc, arrayUnion, setDoc, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import DOMPurify from 'dompurify';
import { badgeService } from '../services/badgeService';
import { challengeService } from '../services/challengeService';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import ErrorFallback, { EmptyState } from '../components/ErrorFallback';

// Phase 2C: Animation components
import AnimatedList from '../components/AnimatedList';
import AnimatedCard from '../components/AnimatedCard';
import FeedbackOverlay from '../components/FeedbackOverlay';

import { Calendar, Users, Trophy, MapPin, Heart, MessageCircle, RefreshCw } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import EditPartyModal from '../components/EditPartyModal';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import { logger } from '../utils/logger.js';
import { toast } from 'sonner';
import { hapticFeedback } from '../utils/haptics';
import { useGesture } from '@use-gesture/react';
import { SkeletonCard } from '../components/SkeletonCard';
import InstagramPost from '../components/InstagramPost';
import PartyItem from '../components/PartyItem';
import { useFeedRateLimit } from '../hooks/useRateLimit';
import { 
    logFeedView, 
    logFeedInteraction, 
    logFeedComment, 
    logFeedShare, 
    logFeedRefresh,
    logFeedError 
} from '../utils/analytics';
import PullToRefresh from '../components/PullToRefresh';
import SkeletonPost from '../components/SkeletonPost';
import OfflineIndicator from '../components/OfflineIndicator';
import ErrorRetry, { InlineErrorRetry } from '../components/ErrorRetry';
import { t } from '../utils/i18n';
import '../styles/FeedPage.css';

// Types de réactions disponibles (défini en dehors pour être accessible partout)
const REACTIONS = [
    { type: 'like', emoji: '👍', label: "J'aime" },
    { type: 'love', emoji: '❤️', label: 'Amour' },
    { type: 'haha', emoji: '😂', label: 'Drôle' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Triste' },
    { type: 'angry', emoji: '😡', label: 'Énervé' }
];

const FeedPage = () => {
    const { db, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    
    // Rate limiting pour les interactions
    const { limitInteraction, limitComment } = useFeedRateLimit();
    
    // États principaux
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [friendsData, setFriendsData] = useState({});
    
    // États pour les interactions
    const [interactions, setInteractions] = useState({});
    const [showComments, setShowComments] = useState({});
    const [showAllComments, setShowAllComments] = useState({}); // Preview commentaires
    const [isLoadingInteraction, setIsLoadingInteraction] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState({});
    const [filter, setFilter] = useState('all'); // Filtres: all | friends | own
    
    // États pour l'affichage des photos
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    
    // États pour l'affichage des résumés
    const [expandedSummaries, setExpandedSummaries] = useState({});
    
    // États pour l'édition/suppression des soirées
    const [editingParty, setEditingParty] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // États pour double-tap to like
    const [lastTap, setLastTap] = useState({});
    const [heartAnimation, setHeartAnimation] = useState({});
    
    // État pour pull-to-refresh
    const [pullY, setPullY] = useState(0);
    
    // États pour infinite scroll
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    
    // Fonctions Firebase
    const handleFeedInteraction = httpsCallable(functions, 'handleFeedInteraction');
    const getFeedInteractions = httpsCallable(functions, 'getFeedInteractions');

    // ===== CHARGEMENT DES DONNÉES (défini en premier) =====

    // Charger les données des amis
    const loadFriendsData = async () => {
        if (!userProfile?.friends?.length) {
            logger.info('Aucun ami à charger');
            return {};
        }

        logger.info('Chargement amis', { friendsCount: userProfile.friends.length });
        const friends = {};

        for (const friendId of userProfile.friends) {
            try {
                const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
                const statsDoc = await getDoc(statsRef);
                
                if (statsDoc.exists()) {
                    const data = statsDoc.data();
                    friends[friendId] = {
                        id: friendId,
                        username: data.username || 'Ami',
                        displayName: data.displayName || data.username || 'Ami',
                        photoURL: data.photoURL,
                        level: data.level || 'Novice'
                    };
                    logger.debug('Ami chargé', { friendId, username: friends[friendId].username });
                }
            } catch (error) {
                logger.error('Erreur chargement ami', { friendId, error: error.message });
            }
        }

        return friends;
    };

    // Charger mes soirées
    const loadMyParties = async () => {
        if (!db || !appId || !user?.uid) {
            logger.warn('loadMyParties: db, appId ou user.uid manquant');
            return [];
        }
        
        try {
            const partiesQuery = query(
                collection(db, `artifacts/${appId}/users/${user.uid}/parties`),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(partiesQuery);
            
            return snapshot.docs.map(doc => ({
                id: `${user.uid}-${doc.id}`, // ID unique avec préfixe userId
                type: 'party',
                userId: user.uid,
                username: userProfile?.username || 'Vous',
                timestamp: doc.data().timestamp,
                data: doc.data(),
                isOwn: true,
                originalId: doc.id
            }));
        } catch (error) {
            logger.error('Erreur chargement mes soirées', { error: error.message });
            return [];
        }
    };

    // Charger les soirées des amis
    const loadFriendsParties = async (friends) => {
        if (!db || !appId) {
            logger.warn('loadFriendsParties: db ou appId manquant');
            return [];
        }
        
        const parties = [];
        
        for (const [friendId, friendData] of Object.entries(friends)) {
            try {
                const partiesQuery = query(
                    collection(db, `artifacts/${appId}/users/${friendId}/parties`),
                    orderBy('timestamp', 'desc'),
                    limit(3)
                );
                const snapshot = await getDocs(partiesQuery);
                
                snapshot.docs.forEach(doc => {
                    parties.push({
                        id: `${friendId}-${doc.id}`, // ID unique pour éviter les doublons
                        type: 'party',
                        userId: friendId,
                        username: friendData.username,
                        timestamp: doc.data().timestamp,
                        data: doc.data(),
                        isOwn: false,
                        originalId: doc.id // Garder l'ID original pour les interactions
                    });
                });
            } catch (error) {
                logger.error('Erreur chargement soirées ami', { friendId, error: error.message });
                // Continue with other friends even if one fails
            }
        }
        
        return parties;
    };

    // ===== GESTION DES INTERACTIONS (défini AVANT handleInteraction) =====

    // Charger les interactions d'un item - DÉFINITION UNIQUE (voir ligne ~500 pour l'implémentation réelle)

    // ===== GESTION DES INTERACTIONS (défini AVANT loadFeed) =====

    // Charger les interactions d'un item
    const loadInteractions = useCallback(async (itemId) => {
        try {
            logger.debug('Chargement interactions', { itemId });
            
            // Utiliser l'ID original pour les interactions (sans préfixe userId)
            const originalId = itemId.includes('-') ? itemId.split('-')[1] : itemId;
            
            const result = await getFeedInteractions({ 
                itemId: originalId,
                appId 
            });

            if (result?.data?.success) {
                const interactionsData = result.data.interactions || { likes: [], comments: [], congratulations: [] };
                
                // Calculer userReaction depuis reactions object
                // Format: { like: [{userId, username, timestamp}], love: [...] }
                let userReaction = null;
                if (interactionsData.reactions) {
                    for (const [reactionType, users] of Object.entries(interactionsData.reactions)) {
                        if (Array.isArray(users) && users.some(u => u.userId === user.uid)) {
                            userReaction = reactionType;
                            break;
                        }
                    }
                }
                
                // Enrichir les commentaires avec les noms d'utilisateur
                if (interactionsData.comments?.length > 0) {
                    for (const comment of interactionsData.comments) {
                        if (!comment.username) {
                            if (comment.userId === user.uid) {
                                comment.username = userProfile?.username || 'Vous';
                            } else if (friendsData[comment.userId]) {
                                comment.username = friendsData[comment.userId].username;
                            } else {
                                // Fallback: charger depuis Firebase
                                try {
                                    const userRef = doc(db, `artifacts/${appId}/public_user_stats`, comment.userId);
                                    const userDoc = await getDoc(userRef);
                                    comment.username = userDoc.exists() ? userDoc.data().username : 'Utilisateur';
                                } catch {
                                    comment.username = 'Utilisateur';
                                }
                            }
                        }
                        
                        // Assurer la compatibilité text/content
                        if (!comment.text && comment.content) {
                            comment.text = comment.content;
                        }
                    }
                }

                setInteractions(prev => ({
                    ...prev,
                    [itemId]: {
                        ...interactionsData,
                        userReaction
                    }
                }));

                logger.debug('Interactions chargées', { itemId, commentsCount: interactionsData.comments?.length || 0, userReaction });
            } else {
                // Pas d'interactions trouvées
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: { likes: [], comments: [], congratulations: [] }
                }));
            }
        } catch (error) {
            logger.error('Erreur chargement interactions', { itemId, error: error.message });
            setInteractions(prev => ({
                ...prev,
                [itemId]: { likes: [], comments: [], congratulations: [] }
            }));
        }
    }, [user, userProfile, friendsData, db, appId, getFeedInteractions]);

    // Charger les interactions par batch pour optimiser les requêtes
    const loadInteractionsBatch = useCallback(async (itemIds) => {
        const BATCH_SIZE = 5;
        const batches = [];
        
        for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
            batches.push(itemIds.slice(i, i + BATCH_SIZE));
        }
        
        for (const batch of batches) {
            await Promise.all(batch.map(itemId => loadInteractions(itemId)));
            // Petit délai entre les batches pour éviter de surcharger Firebase
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }, [loadInteractions]);

    // Charger le feed principal
    const loadFeed = useCallback(async (isInitialLoad = true) => {
        if (!db || !user || !appId) {
            logger.debug('FeedPage: Firebase not ready, waiting');
            setLoading(false);
            return;
        }
        
        try {
            if (isInitialLoad) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }
            logger.info('Chargement du feed...');

            // 1. Charger les amis
            const friends = await loadFriendsData();
            setFriendsData(friends);

            // 2. Charger les activités
            const [myParties, friendsParties] = await Promise.all([
                loadMyParties(),
                loadFriendsParties(friends)
            ]);

            // 3. Combiner et trier
            const allItems = [...myParties, ...friendsParties];
            allItems.sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp;
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp;
                return dateB - dateA;
            });

            setFeedItems(allItems.slice(0, 20));
            setHasMore(allItems.length > 20);
            setLastVisible(allItems.length > 20 ? allItems[19] : null);
            logger.info('Feed chargé', { itemsCount: allItems.length });

            // 📊 Analytics: Vue du feed
            logFeedView(allItems.length);

            // 4. Charger les interactions par batch pour optimiser
            const itemsToLoad = allItems.slice(0, 20);
            loadInteractionsBatch(itemsToLoad.map(item => item.id));

        } catch (error) {
            logger.error('Erreur chargement feed', { error: error.message });
            logFeedError('load_feed', error.message);
            setError(error.message || 'Erreur lors du chargement du fil');
            setMessageBox({ message: 'Erreur lors du chargement du fil', type: 'error' });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user, db, appId, setMessageBox, loadInteractionsBatch, logFeedView, logFeedError]);

    // Vérifier si l'utilisateur a déjà interagi
    const hasUserInteracted = (itemId, type) => {
        const itemInteractions = interactions[itemId];
        if (!itemInteractions) return false;

        if (type === 'like') {
            return itemInteractions.likes?.some(like => like.userId === user.uid);
        } else if (type === 'congratulate') {
            return itemInteractions.congratulations?.some(congrat => congrat.userId === user.uid);
        }
        return false;
    };

    // ===== GÉRER LES INTERACTIONS (défini APRÈS loadInteractions) =====
    
    // Gérer une interaction (like, comment, etc.) avec mise à jour optimiste
    const handleInteraction = useCallback(async (itemId, type, data = null) => {
        if (isLoadingInteraction[itemId]) return;

        // ✅ Vérifier le rate limiting manuellement
        const rateLimitCheck = limitInteraction(() => {})();
        try {
            await rateLimitCheck;
        } catch (error) {
            if (error.message.includes('Trop de requêtes')) {
                toast.error(error.message);
                return;
            }
        }

        try {
            logger.debug('Interaction', { type, itemId });

            // Trouver le propriétaire de l'item seulement pour l'appel Firebase
            const item = feedItems.find(i => i.id === itemId);
            if (!item) {
                logger.error('Item non trouvé', { itemId });
                return;
            }

            // ⚡ MISE À JOUR OPTIMISTE : Met à jour l'UI instantanément
            if (['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(type)) {
                const currentInteractions = interactions[itemId] || { likes: [], comments: [], congratulations: [], reactions: {} };
                const currentReactions = currentInteractions.reactions || {};
                const userReaction = Object.keys(currentReactions).find(reactionType => 
                    currentReactions[reactionType]?.some(r => r.userId === user.uid)
                );
                
                // Si l'utilisateur a déjà réagi, on retire son ancienne réaction
                let newReactions = { ...currentReactions };
                if (userReaction) {
                    newReactions[userReaction] = newReactions[userReaction].filter(r => r.userId !== user.uid);
                    if (newReactions[userReaction].length === 0) {
                        delete newReactions[userReaction];
                    }
                }
                
                // Ajouter la nouvelle réaction (sauf si c'était la même)
                if (userReaction !== type) {
                    newReactions[type] = [...(newReactions[type] || []), {
                        userId: user.uid,
                        username: userProfile?.username || 'Vous',
                        timestamp: new Date()
                    }];
                    
                    // Haptic feedback + toast
                    hapticFeedback.light();
                    const reactionEmoji = REACTIONS.find(r => r.type === type)?.emoji || '👍';
                    toast.success(`${reactionEmoji} ${t('success.reactionAdded')}`);
                    
                    // 📊 Analytics: Interaction
                    logFeedInteraction(type, item.type, itemId);
                }
                
                // Calculer le nouveau userReaction après modification
                const newUserReaction = Object.keys(newReactions).find(reactionType =>
                    Array.isArray(newReactions[reactionType]) && newReactions[reactionType]?.some(r => r.userId === user.uid)
                ) || null;
                
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: {
                        ...currentInteractions,
                        reactions: newReactions,
                        userReaction: newUserReaction
                    }
                }));
                
                // Fermer le picker après sélection
                setShowReactionPicker(prev => ({ ...prev, [itemId]: false }));
            } else if (type === 'comment' && data?.text) {
                const currentInteractions = interactions[itemId] || { likes: [], comments: [], congratulations: [] };
                const newComment = {
                    id: `temp-${Date.now()}`,
                    userId: user.uid,
                    username: userProfile?.username || 'Vous',
                    text: data.text,
                    timestamp: new Date()
                };
                
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: {
                        ...currentInteractions,
                        comments: [...(currentInteractions.comments || []), newComment]
                    }
                }));
                
                // Haptic feedback + toast
                hapticFeedback.medium();
                toast.success(`💬 ${t('success.commentAdded')}`);
            }

            // Utiliser l'ID original pour Firebase
            const originalId = item.originalId || itemId;

            // 🚀 Envoyer la requête en arrière-plan (sans attendre)
            handleFeedInteraction({
                itemId: originalId,
                itemType: item.type,
                ownerId: item.userId,
                interactionType: type,
                content: data?.text || null,
                appId
            }).then(result => {
                if (result?.data?.success) {
                    logger.debug('Interaction synchronisée avec le serveur');
                    // Recharger pour synchroniser avec les autres utilisateurs
                    setTimeout(() => loadInteractions(itemId), 500);
                } else {
                    logger.error('Échec sync serveur, rollback', { error: result?.data?.error });
                    // En cas d'erreur, recharger les vraies données
                    loadInteractions(itemId);
                }
            }).catch(error => {
                logger.error('Erreur sync serveur, rollback', { error: error.message });
                // En cas d'erreur, recharger les vraies données  
                loadInteractions(itemId);
            });

        } catch (error) {
            logger.error('Erreur interaction', { error: error.message });
            // En cas d'erreur, recharger les vraies données
            loadInteractions(itemId);
        }
    }, [isLoadingInteraction, limitInteraction, feedItems, interactions, user, userProfile, handleFeedInteraction, appId, loadInteractions]);

    // ===== INTERACTIONS MODERNES =====

    // Double-tap to like (Instagram-style)
    const handleDoubleTap = useCallback((itemId) => {
        const now = Date.now();
        const lastTapTime = lastTap[itemId] || 0;
        
        if (now - lastTapTime < 300) {
            // Double tap détecté!
            handleInteraction(itemId, 'like');
            hapticFeedback.light();
            
            // Animation du coeur avec cleanup
            setHeartAnimation(prev => ({ ...prev, [itemId]: true }));
            const timer = setTimeout(() => {
                setHeartAnimation(prev => ({ ...prev, [itemId]: false }));
            }, 1000);
            
            // Cleanup si composant unmount
            return () => clearTimeout(timer);
            
            logger.debug('Double-tap like', { itemId });
        }
        
        setLastTap({ ...lastTap, [itemId]: now });
    }, [lastTap, handleInteraction]);

    // Pull-to-refresh
    const handlePullRefresh = async () => {
        if (refreshing) return;
        
        setRefreshing(true);
        hapticFeedback.medium();
        logger.info('Pull-to-refresh déclenché');
        
        await loadFeed();
        
        setRefreshing(false);
        hapticFeedback.success();
        toast.success('✨ Feed mis à jour!');
    };

    // Gesture pour pull-to-refresh
    const bind = useGesture({
        onDrag: ({ down, movement: [, my] }) => {
            if (my > 0 && window.scrollY === 0) {
                setPullY(down ? Math.min(my, 100) : 0);
                
                if (!down && my > 80) {
                    handlePullRefresh();
                }
            }
        },
    });

    // Ajouter un commentaire
    const handleAddComment = useCallback(async (itemId, commentText) => {
        if (!commentText.trim() || !user) return;

        // ✅ Vérifier le rate limiting manuellement
        const rateLimitCheck = limitComment(() => {})();
        try {
            await rateLimitCheck;
        } catch (error) {
            if (error.message.includes('Trop de requêtes')) {
                toast.error(error.message);
                return;
            }
        }

        try {
            // Trouver l'item pour obtenir le type et l'ownerId
            const item = feedItems.find(i => i.id === itemId);
            if (!item) {
                logger.error('Item non trouvé pour commentaire', { itemId });
                return;
            }

            const newComment = {
                userId: user.uid,
                username: userProfile?.username || user.displayName || 'Utilisateur',
                text: commentText.trim(),
                content: commentText.trim(),
                timestamp: new Date()
            };

            // Mise à jour optimiste
            setInteractions(prev => ({
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    comments: [...(prev[itemId]?.comments || []), newComment]
                }
            }));

            // Utiliser l'ID original pour les interactions
            const originalId = item.originalId || itemId;

            // Utiliser la Cloud Function pour la cohérence
            const result = await handleFeedInteraction({
                itemId: originalId,
                itemType: item.type,
                ownerId: item.userId,
                interactionType: 'comment',
                content: commentText.trim(),
                appId
            });

            if (result?.data?.success) {
                logger.info('Commentaire ajouté via Cloud Function', { itemId });
                hapticFeedback.medium();
                toast.success('💬 Commentaire ajouté!');
                
                // 📊 Analytics: Commentaire
                logFeedComment(item.type, itemId, commentText.length);
                
                // Recharger pour synchroniser
                setTimeout(() => loadInteractions(itemId), 500);
            } else {
                throw new Error(result?.data?.error || 'Erreur inconnue');
            }

        } catch (error) {
            logger.error('Erreur ajout commentaire', { error: error.message });
            // Recharger les interactions en cas d'erreur
            loadInteractions(itemId);
        }
    }, [limitComment, user, feedItems, userProfile, handleFeedInteraction, appId, loadInteractions]);

    // ===== GESTION ÉDITION/SUPPRESSION DES SOIRÉES =====
    
    const handleEditParty = useCallback((partyItem) => {
        if (!partyItem.isOwn) {
            setMessageBox({ message: "Vous ne pouvez modifier que vos propres soirées.", type: "error" });
            return;
        }
        
        logger.info('Ouverture édition soirée', { partyId: partyItem.id });
        setEditingParty({
            id: partyItem.id,
            ...partyItem.data,
            timestamp: partyItem.timestamp
        });
        setShowEditModal(true);
    }, [user, setMessageBox]);

    const handleDeleteParty = useCallback((partyItem) => {
        if (!partyItem.isOwn) {
            setMessageBox({ message: "Vous ne pouvez supprimer que vos propres soirées.", type: "error" });
            return;
        }
        
        // Confirmation rapide avant suppression
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la soirée du ${partyItem.data.date} ?`)) {
            logger.info('Confirmation suppression soirée', { partyId: partyItem.id });
            setEditingParty({
                id: partyItem.id,
                ...partyItem.data,
                timestamp: partyItem.timestamp
            });
            setShowEditModal(true);
        }
    }, [user, setMessageBox]);

    const handlePartyUpdated = useCallback((updatedParty) => {
        // Mettre à jour le feed local
        setFeedItems(prev => prev.map(item => 
            item.id === updatedParty.id 
                ? { ...item, data: updatedParty }
                : item
        ));
        
        // Recharger le feed complet pour s'assurer de la cohérence
        setTimeout(() => {
            loadFeed();
        }, 1000);
        
        logger.info('Soirée mise à jour dans le feed', { partyId: updatedParty.id });
    }, []);

    const handlePartyDeleted = useCallback((partyId) => {
        // Supprimer du feed local
        setFeedItems(prev => prev.filter(item => item.id !== partyId));
        
        // Nettoyer les interactions associées
        setInteractions(prev => {
            const newInteractions = { ...prev };
            delete newInteractions[partyId];
            return newInteractions;
        });
        
        logger.info('Soirée supprimée du feed', { partyId });
    }, []);

    // ===== COMPOSANTS UI =====

    // Section de commentaires
    const CommentSection = ({ itemId }) => {
        if (!showComments[itemId]) return null;

        const itemInteractions = interactions[itemId];
        const comments = itemInteractions?.comments || [];

        return (
            <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Liste des commentaires */}
                {comments.map((comment, index) => {
                    const commentUser = comment.userId === user.uid 
                        ? userProfile 
                        : friendsData[comment.userId] || { username: comment.username };

                    return (
                        <div key={comment.id || index} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '8px',
                            display: 'flex',
                            gap: '10px',
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden' // Empêche le débordement
                        }}>
                            <UserAvatar user={commentUser} size={24} style={{ flexShrink: 0 }} />
                            <div style={{ 
                                flex: 1, 
                                minWidth: 0, // Permet la compression du contenu
                                overflow: 'hidden'
                            }}>
                                <div style={{ 
                                    color: '#60a5fa', 
                                    fontSize: 'clamp(11px, 3vw, 12px)', // Responsive
                                    fontWeight: '600', 
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap' // Tronque si trop long
                                }}>
                                    {comment.username}
                                </div>
                                <div style={{ 
                                    color: 'white', 
                                    fontSize: 'clamp(13px, 3.5vw, 14px)', // Responsive
                                    lineHeight: '1.4',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto' // Césure automatique
                                }}>
                                    <span dangerouslySetInnerHTML={{ 
                                      __html: DOMPurify.sanitize(comment.text || comment.content || '', {
                                        ALLOWED_TAGS: ['br'],
                                        ALLOWED_ATTR: []
                                      })
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Zone de saisie */}
                <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '12px',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden' // Empêche le débordement
                }}>
                    <input
                        type="text"
                        placeholder="Ajouter un commentaire..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                const text = e.target.value.trim();
                                handleInteraction(itemId, 'comment', { text });
                                e.target.value = '';
                            }
                        }}
                        style={{
                            flex: 1,
                            minWidth: 0, // Important pour éviter le débordement
                            maxWidth: '100%',
                            padding: 'clamp(6px, 2vw, 8px) clamp(8px, 3vw, 12px)', // Responsive padding
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive font size
                            outline: 'none',
                            boxSizing: 'border-box' // Inclut padding/border dans la largeur
                        }}
                    />
                    <button
                        onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling;
                            const text = input.value.trim();
                            if (text) {
                                handleInteraction(itemId, 'comment', { text });
                                input.value = '';
                            }
                        }}
                        style={{
                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 4vw, 16px)', // Responsive padding
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)', // Responsive font size
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0, // Empêche le bouton de rétrécir
                            minWidth: 'clamp(40px, 12vw, 60px)' // Taille minimum responsive
                        }}
                    >
                        📨
                    </button>
                </div>
            </div>
        );
    };

    // Fonction utilitaire pour le temps
    const getTimeAgo = (date) => {
        if (!date) return 'Récemment';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `il y a ${diffMins}min`;
        if (diffHours < 24) return `il y a ${diffHours}h`;
        if (diffDays < 7) return `il y a ${diffDays}j`;
        return `le ${date.toLocaleDateString()}`;
    };

    // ===== EFFETS =====

    // ===== EFFETS =====

    // Charger plus d'items (infinite scroll)
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !lastVisible || !db || !user || !appId) return;
        
        setLoadingMore(true);
        try {
            logger.info('Chargement de plus d\'items...');
            
            // Charger les soirées suivantes de l'utilisateur
            const myPartiesQuery = query(
                collection(db, `artifacts/${appId}/users/${user.uid}/parties`),
                orderBy('timestamp', 'desc'),
                startAfter(lastVisible.timestamp),
                limit(5)
            );
            const myPartiesSnapshot = await getDocs(myPartiesQuery);
            
            const newMyParties = myPartiesSnapshot.docs.map(doc => ({
                id: `${user.uid}-${doc.id}`,
                type: 'party',
                userId: user.uid,
                username: userProfile?.username || 'Vous',
                timestamp: doc.data().timestamp,
                data: doc.data(),
                isOwn: true,
                originalId: doc.id
            }));
            
            // Charger les soirées suivantes des amis
            const friends = friendsData || {};
            const newFriendsParties = [];
            
            for (const [friendId, friendData] of Object.entries(friends)) {
                try {
                    const partiesQuery = query(
                        collection(db, `artifacts/${appId}/users/${friendId}/parties`),
                        orderBy('timestamp', 'desc'),
                        startAfter(lastVisible.timestamp),
                        limit(2)
                    );
                    const snapshot = await getDocs(partiesQuery);
                    
                    snapshot.docs.forEach(doc => {
                        newFriendsParties.push({
                            id: `${friendId}-${doc.id}`,
                            type: 'party',
                            userId: friendId,
                            username: friendData.username,
                            timestamp: doc.data().timestamp,
                            data: doc.data(),
                            isOwn: false,
                            originalId: doc.id
                        });
                    });
                } catch (error) {
                    logger.error('Erreur chargement plus soirées ami', { friendId, error: error.message });
                }
            }
            
            // Combiner et trier les nouveaux items
            const newItems = [...newMyParties, ...newFriendsParties];
            newItems.sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp;
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp;
                return dateB - dateA;
            });
            
            if (newItems.length > 0) {
                setFeedItems(prev => [...prev, ...newItems]);
                setLastVisible(newItems[newItems.length - 1]);
                setHasMore(newItems.length >= 5); // Si on a récupéré 5+ items, il y en a peut-être plus
                
                // Charger les interactions des nouveaux items
                loadInteractionsBatch(newItems.map(item => item.id));
                
                logger.info('Plus d\'items chargés', { count: newItems.length });
            } else {
                setHasMore(false);
                logger.info('Plus d\'items disponibles');
            }
        } catch (error) {
            logger.error('Erreur chargement plus items', { error: error.message });
            logFeedError('load_more', error.message);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible, db, user, appId, userProfile, friendsData, loadInteractionsBatch, logFeedError]);

    // Détecter le scroll pour infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Charger plus quand on est à 80% du scroll
            if (scrollTop + windowHeight >= documentHeight * 0.8) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    // Fonction de refresh pour PullToRefresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        logFeedRefresh();
        await loadFeed(true);
        setRefreshing(false);
    }, [loadFeed]);

    // Charger le feed au démarrage (on ne met PAS loadFeed en dépendance pour éviter les boucles)
    useEffect(() => {
        if (user && userProfile && db) {
            // Vider les items existants pour forcer un rechargement complet
            setFeedItems([]);
            setInteractions({});
            loadFeed(true);
        }
    }, [user, userProfile, db]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listener pour rafraîchissement automatique du feed
    useEffect(() => {
        const handleFeedRefresh = () => {
            logger.debug('FeedPage: Auto refresh triggered');
            loadFeed();
        };

        // Écouter l'événement custom de refresh du feed
        window.addEventListener('refreshFeed', handleFeedRefresh);
        
        return () => {
            window.removeEventListener('refreshFeed', handleFeedRefresh);
        };
    }, [loadFeed]);

    // ===== RENDU =====

    if (loading) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#0a0a0a',
                minHeight: '100vh',
                color: 'white'
            }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
                    📱 {t('feed.title')}
                </h2>
                <span className="sr-only" role="status" aria-live="polite">
                    {t('feed.loading')}
                </span>
                <SkeletonPost />
                <SkeletonPost />
                <SkeletonPost />
            </div>
        );
    }

    if (error) {
        return <ErrorRetry error={error} onRetry={() => loadFeed(true)} />;
    }

    if (!loading && feedItems.length === 0) {
        return (
            <EmptyState 
                title={t('feed.empty')}
                message={t('feed.emptyMessage')}
                actionLabel={t('feed.emptyAction')}
                onAction={() => window.location.href = '/'}
            />
        );
    }

    return (
        <PullToRefresh onRefresh={handleRefresh} threshold={80}>
            <OfflineIndicator />
            
            <div 
                className="feed-container"
                {...bind()}
            >
            {/* Pull-to-refresh indicator */}
            {pullY > 0 && (
                <div className="pull-indicator" style={{ height: pullY > 80 ? '80px' : `${pullY}px` }}>
                    <div 
                        className="pull-indicator-content" 
                        style={{ opacity: Math.min(pullY / 80, 1) }}
                        role="status"
                        aria-live="polite"
                        aria-label={pullY > 80 ? t('feed.releaseToRefresh') : t('feed.pullToRefresh')}>
                        <RefreshCw 
                            size={16} 
                            color="#bf00ff"
                            className={pullY > 80 ? 'spin-animation' : ''}
                            aria-hidden="true"
                        />
                        <span className="pull-indicator-text">
                            {pullY > 80 ? 'Relâchez pour actualiser...' : 'Tirez pour actualiser'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Loading overlay quand refresh en cours */}
            {refreshing && (
                <div 
                    className="refresh-overlay"
                    role="status"
                    aria-busy="true"
                    aria-label={t('feed.refreshing')}>
                    <RefreshCw 
                        size={16} 
                        color="#bf00ff"
                        className="spin-animation"
                        aria-hidden="true"
                    />
                    <span className="refresh-overlay-text">
                        {t('feed.refreshing')}
                    </span>
                </div>
            )}
            
            {/* Instagram-style Header */}
            <div className="feed-header">
                <div className="feed-header-top">
                    <h1 className="feed-header-title">
                        DrinkWise
                    </h1>
                    <button
                        onClick={loadFeed}
                        disabled={refreshing}
                        aria-label={t('feed.refreshing')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: refreshing ? 0.5 : 1
                        }}
                    >
                        <RefreshCw 
                            size={24} 
                            style={{ 
                                transition: 'transform 0.3s ease',
                                transform: refreshing ? 'rotate(360deg)' : 'rotate(0deg)'
                            }} 
                        />
                    </button>
                </div>

                {/* Filtres */}
                <div className="feed-filters">
                    <button 
                        className={`feed-filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        🌍 {t('feed.filters.all')}
                    </button>
                    <button 
                        className={`feed-filter-btn ${filter === 'friends' ? 'active' : ''}`}
                        onClick={() => setFilter('friends')}
                    >
                        👥 {t('feed.filters.friends')}
                    </button>
                    <button 
                        className={`feed-filter-btn ${filter === 'own' ? 'active' : ''}`}
                        onClick={() => setFilter('own')}
                    >
                        ⭐ {t('feed.filters.own')}
                    </button>
                </div>
            </div>

            {/* Feed content */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%'
            }}>
                <AnimatedList
                    items={feedItems.filter(item => {
                        if (filter === 'own') return item.isOwn;
                        if (filter === 'friends') return !item.isOwn;
                        return true;
                    })}
                    renderItem={(item) => (
                        <PartyItem 
                            item={item} 
                            itemInteractions={interactions[item.id]}
                            userProfile={userProfile}
                            friendsData={friendsData}
                            heartAnimation={heartAnimation}
                            showComments={showComments}
                            handleInteraction={handleInteraction}
                            setShowComments={setShowComments}
                            handleAddComment={handleAddComment}
                            handleDoubleTap={handleDoubleTap}
                        />
                    )}
                    keyExtractor={(item) => `feed-item-${item.id}`}
                />
            </div>

            {/* Photo modal */}
            {selectedPhoto && (
                <div 
                    onClick={() => setSelectedPhoto(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'pointer',
                        padding: '20px'
                    }}
                >
                    <div style={{
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        position: 'relative'
                    }}>
                        <img 
                            src={selectedPhoto} 
                            alt="Photo en grand" 
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(null);
                            }}
                            aria-label={t('common.close')}
                            style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: 'rgba(0, 0, 0, 0.8)',
                                border: 'none',
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingParty && showEditModal && (
                <EditPartyModal
                    party={editingParty}
                    onClose={() => {
                        setEditingParty(null);
                        setShowEditModal(false);
                    }}
                    onSave={async (updatedParty) => {
                        handlePartyUpdated(updatedParty);
                        setEditingParty(null);
                        setShowEditModal(false);
                    }}
                />
            )}
            
            {/* Infinite scroll loading indicator */}
            {loadingMore && (
                <div style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <LoadingSpinner />
                </div>
            )}
            
            {/* End of feed indicator */}
            {!hasMore && feedItems.length > 0 && (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '14px'
                }}>
                    {t('feed.endOfFeed')}
                </div>
            )}
        </div>
        </PullToRefresh>
    );
};

export default FeedPage;

