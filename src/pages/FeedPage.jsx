import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { challengeService } from '../services/challengeService';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { Calendar, Users, Trophy, MapPin, Heart, MessageCircle } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const FeedPage = () => {
    const { db, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    
    // États principaux
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [friendsData, setFriendsData] = useState({});
    
    // États pour les interactions
    const [interactions, setInteractions] = useState({});
    const [showComments, setShowComments] = useState({});
    const [isLoadingInteraction, setIsLoadingInteraction] = useState({});
    
    // États pour l'affichage des photos
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    
    // États pour l'affichage des résumés
    const [expandedSummaries, setExpandedSummaries] = useState({});
    
    // Fonctions Firebase
    const handleFeedInteraction = httpsCallable(functions, 'handleFeedInteraction');
    const getFeedInteractions = httpsCallable(functions, 'getFeedInteractions');

    console.log('🚀 FeedPage initialisé - User:', user?.uid, 'Profile:', userProfile?.username);

    // ===== CHARGEMENT DES DONNÉES =====

    // Charger les données des amis
    const loadFriendsData = async () => {
        if (!userProfile?.friends?.length) {
            console.log('Aucun ami à charger');
            return {};
        }

        console.log('📥 Chargement de', userProfile.friends.length, 'amis');
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
                    console.log('✅ Ami chargé:', friendId, '→', friends[friendId].username);
                }
            } catch (error) {
                console.error('Erreur chargement ami:', friendId, error);
            }
        }

        return friends;
    };

    // Charger mes soirées
    const loadMyParties = async () => {
        try {
            const partiesQuery = query(
                collection(db, `artifacts/${appId}/users/${user.uid}/parties`),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(partiesQuery);
            
            return snapshot.docs.map(doc => ({
                id: doc.id, // ID simple sans préfixe
                type: 'party',
                userId: user.uid,
                username: userProfile?.username || 'Vous',
                timestamp: doc.data().timestamp,
                data: doc.data(),
                isOwn: true
            }));
        } catch (error) {
            console.error('Erreur chargement mes soirées:', error);
            return [];
        }
    };

    // Charger les soirées des amis
    const loadFriendsParties = async (friends) => {
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
                console.error('Erreur chargement soirées ami:', friendId, error);
            }
        }
        
        return parties;
    };

    // Charger le feed principal
    const loadFeed = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📱 Chargement du feed...');

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
            console.log('✅ Feed chargé:', allItems.length, 'items');

        } catch (error) {
            console.error('❌ Erreur chargement feed:', error);
            setMessageBox({ message: 'Erreur lors du chargement du fil', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [user, userProfile, db, appId, setMessageBox]);

    // ===== GESTION DES INTERACTIONS =====

    // Charger les interactions d'un item
    const loadInteractions = async (itemId) => {
        try {
            console.log('📥 Chargement interactions pour:', itemId);
            
            // Utiliser l'ID original pour les interactions (sans préfixe userId)
            const originalId = itemId.includes('-') ? itemId.split('-')[1] : itemId;
            
            const result = await getFeedInteractions({ 
                itemId: originalId,
                appId 
            });

            if (result?.data?.success) {
                const interactionsData = result.data.interactions || { likes: [], comments: [], congratulations: [] };
                
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
                    [itemId]: interactionsData
                }));

                console.log('✅ Interactions chargées pour', itemId, ':', interactionsData.comments?.length || 0, 'commentaires');
            } else {
                // Pas d'interactions trouvées
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: { likes: [], comments: [], congratulations: [] }
                }));
            }
        } catch (error) {
            console.error('❌ Erreur chargement interactions:', itemId, error);
            setInteractions(prev => ({
                ...prev,
                [itemId]: { likes: [], comments: [], congratulations: [] }
            }));
        }
    };

    // Gérer une interaction (like, comment, etc.) avec mise à jour optimiste
    const handleInteraction = async (itemId, type, data = null) => {
        if (isLoadingInteraction[itemId]) return;

        try {
            console.log('🔄 Interaction:', type, 'sur', itemId, data);

            // Trouver le propriétaire de l'item
            const item = feedItems.find(i => i.id === itemId);
            if (!item) {
                console.error('Item non trouvé:', itemId);
                return;
            }

            // ⚡ MISE À JOUR OPTIMISTE : Met à jour l'UI instantanément
            if (type === 'like') {
                const currentInteractions = interactions[itemId] || { likes: [], comments: [], congratulations: [] };
                const hasLiked = currentInteractions.likes?.some(like => like.userId === user.uid);
                
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: {
                        ...currentInteractions,
                        likes: hasLiked 
                            ? currentInteractions.likes.filter(like => like.userId !== user.uid)
                            : [...(currentInteractions.likes || []), { 
                                userId: user.uid, 
                                username: userProfile?.username || 'Vous',
                                timestamp: new Date()
                              }]
                    }
                }));
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
                    console.log('✅ Interaction synchronisée avec le serveur');
                    // Optionnel : recharger pour être sûr de la cohérence
                    // loadInteractions(itemId);
                } else {
                    console.error('❌ Échec sync serveur, rollback:', result?.data?.error);
                    // En cas d'erreur, recharger les vraies données
                    loadInteractions(itemId);
                }
            }).catch(error => {
                console.error('❌ Erreur sync serveur, rollback:', error);
                // En cas d'erreur, recharger les vraies données  
                loadInteractions(itemId);
            });

        } catch (error) {
            console.error('❌ Erreur interaction:', error);
            // En cas d'erreur, recharger les vraies données
            loadInteractions(itemId);
        }
    };

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
                                    {comment.text || comment.content}
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

    // Item de soirée
    const PartyItem = ({ item }) => {
        const party = item.data;
        const totalDrinks = party.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0;
        const timeAgo = getTimeAgo(item.timestamp?.toDate());

        // Debug: vérifier si la soirée a des photos et des badges
        console.log(`🔍 PartyItem ${item.id}:`, {
            hasPhotos: !!(party.photoURLs && party.photoURLs.length > 0),
            photosCount: party.photoURLs?.length || 0,
            hasVideos: !!(party.videoURLs && party.videoURLs.length > 0),
            videosCount: party.videoURLs?.length || 0,
            // Debug badges
            hasBadges: !!(party.unlockedBadges && party.unlockedBadges.length > 0),
            badgesCount: party.unlockedBadges?.length || 0,
            badges: party.unlockedBadges,
            // Debug level-up
            hasLevelUp: !!party.levelUp,
            levelUp: party.levelUp,
            // Debug challenges
            hasChallenges: !!(party.completedChallenges && party.completedChallenges.length > 0),
            challenges: party.completedChallenges
        });

        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                marginBottom: '16px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden'
                }}>
                    <UserAvatar 
                        user={item.isOwn ? userProfile : friendsData[item.userId]}
                        size={40}
                        style={{ marginRight: '12px', flexShrink: 0 }}
                    />
                    <div style={{ 
                        flex: 1, 
                        minWidth: 0, // Permet la compression
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            color: 'white', 
                            fontWeight: '600', 
                            fontSize: 'clamp(14px, 4vw, 16px)', // Responsive font size
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap', // Permet le passage à la ligne
                            overflow: 'hidden'
                        }}>
                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '150px' // Limite la largeur du nom
                            }}>
                                {item.isOwn ? 'Vous' : item.username}
                            </span>
                            {/* Indicateur de photos */}
                            {(party.photoURLs && party.photoURLs.length > 0) && (
                                <span style={{
                                    backgroundColor: '#8b45ff',
                                    color: 'white',
                                    fontSize: 'clamp(9px, 2.5vw, 10px)', // Responsive
                                    padding: '2px 4px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}>
                                    📸 {party.photoURLs.length}
                                </span>
                            )}
                            {/* Indicateur de vidéos */}
                            {(party.videoURLs && party.videoURLs.length > 0) && (
                                <span style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontSize: 'clamp(9px, 2.5vw, 10px)', // Responsive
                                    padding: '2px 4px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}>
                                    🎥 {party.videoURLs.length}
                                </span>
                            )}
                            {/* Rétrocompatibilité avec l'ancien format */}
                            {party.photoURL && !(party.photoURLs && party.photoURLs.length > 0) && (
                                <span style={{
                                    backgroundColor: '#8b45ff',
                                    color: 'white',
                                    fontSize: 'clamp(9px, 2.5vw, 10px)', // Responsive
                                    padding: '2px 4px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}>
                                    📸 1
                                </span>
                            )}
                        </div>
                        <div style={{ 
                            color: '#9ca3af', 
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            display: 'flex', 
                            alignItems: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            <Calendar size={14} style={{ marginRight: '4px', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.isOwn ? 'avez fait une soirée' : 'a fait une soirée'} • {timeAgo}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contenu */}
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: 'clamp(12px, 4vw, 16px)', // Responsive padding
                    marginBottom: '12px',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                }}>
                    <h4 style={{
                        color: 'white',
                        fontSize: 'clamp(14px, 4vw, 16px)', // Responsive
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        wordWrap: 'break-word'
                    }}>
                        {party.category} - {party.date}
                    </h4>

                    {/* Badges débloqués - Affichage juste au-dessus des stats */}
                    {party.unlockedBadges && party.unlockedBadges.length > 0 && (
                        <div style={{
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <Trophy size={16} style={{ color: '#ffd700' }} />
                                <span style={{
                                    color: '#ffd700',
                                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                                    fontWeight: '600'
                                }}>
                                    {party.unlockedBadges.length === 1 ? 'Badge débloqué !' : 'Badges débloqués !'}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                {party.unlockedBadges.map((badgeId, index) => {
                                    const badgeInfo = badgeService.getBadgeInfo(badgeId);
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                                                padding: '6px 10px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(255, 215, 0, 0.4)'
                                            }}
                                        >
                                            <span style={{ fontSize: '14px' }}>
                                                {React.cloneElement(badgeInfo.icon, { size: 14 })}
                                            </span>
                                            <span style={{
                                                color: '#fff',
                                                fontSize: 'clamp(11px, 3vw, 12px)',
                                                fontWeight: '500'
                                            }}>
                                                {badgeInfo.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Challenges complétés */}
                    {party.completedChallenges && party.completedChallenges.length > 0 && (
                        <div style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '16px' }}>🎯</span>
                                <span style={{
                                    color: '#22c55e',
                                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                                    fontWeight: '600'
                                }}>
                                    {party.completedChallenges.length === 1 ? 'Défi accompli !' : 'Défis accomplis !'}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                {party.completedChallenges.map((challengeId, index) => {
                                    const challengeInfo = challengeService.getChallengeInfo(challengeId);
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                padding: '6px 10px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(34, 197, 94, 0.4)'
                                            }}
                                        >
                                            <span style={{ fontSize: '14px' }}>
                                                {React.cloneElement(challengeInfo.icon, { size: 14 })}
                                            </span>
                                            <span style={{
                                                color: '#fff',
                                                fontSize: 'clamp(11px, 3vw, 12px)',
                                                fontWeight: '500'
                                            }}>
                                                {challengeInfo.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Montée de niveau */}
                    {party.levelUp && (
                        <div style={{
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '18px' }}>⬆️</span>
                                <span style={{
                                    color: '#a855f7',
                                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                                    fontWeight: '600'
                                }}>
                                    {party.levelUp.levelsGained > 1 
                                        ? `Montée de ${party.levelUp.levelsGained} niveaux !` 
                                        : 'Montée de niveau !'}
                                </span>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                border: '1px solid rgba(168, 85, 247, 0.4)'
                            }}>
                                <span style={{
                                    color: '#fff',
                                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                                    fontWeight: '600'
                                }}>
                                    {party.levelUp.levelsGained > 1 
                                        ? `Niveau ${party.levelUp.oldLevel} → ${party.levelUp.newLevel} • ${party.levelUp.newLevelName}`
                                        : `Niveau ${party.levelUp.newLevel} • ${party.levelUp.newLevelName}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // Plus petit minmax pour mobile
                        gap: 'clamp(8px, 3vw, 12px)', // Responsive gap
                        width: '100%'
                    }}>
                        <div style={{ 
                            color: '#9ca3af', 
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            🍺 {totalDrinks} boissons
                        </div>
                        <div style={{ 
                            color: '#9ca3af', 
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            👥 {party.girlsTalkedTo || 0} filles
                        </div>
                        <div style={{ 
                            color: '#9ca3af', 
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            🤮 {party.vomi || 0} vomis
                        </div>
                        <div style={{ 
                            color: '#9ca3af', 
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            👊 {party.fights || 0} bagarres
                        </div>
                    </div>

                    {party.summary && (
                        <div style={{
                            backgroundColor: 'rgba(139, 69, 255, 0.1)',
                            border: '1px solid rgba(139, 69, 255, 0.3)',
                            borderRadius: '8px',
                            padding: 'clamp(10px, 3vw, 12px)', // Responsive padding
                            marginTop: '12px',
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            boxSizing: 'border-box'
                        }}>
                            {(() => {
                                const hasMedia = (party.photoURLs && party.photoURLs.length > 0) || 
                                                party.photoURL || 
                                                (party.videoURLs && party.videoURLs.length > 0);
                                const isExpanded = expandedSummaries[party.id] || false;
                                const shouldTruncate = hasMedia && party.summary.length > 100;
                                const truncatedSummary = party.summary.slice(0, 100) + '...';
                                
                                return (
                                    <>
                                        <p style={{
                                            color: '#c4b5fd',
                                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                                            fontStyle: 'italic',
                                            margin: 0,
                                            lineHeight: '1.4',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            hyphens: 'auto'
                                        }}>
                                            "{shouldTruncate && !isExpanded ? truncatedSummary : party.summary}"
                                        </p>
                                        {shouldTruncate && (
                                            <button
                                                onClick={() => setExpandedSummaries(prev => ({
                                                    ...prev,
                                                    [party.id]: !isExpanded
                                                }))}
                                                style={{
                                                    background: 'rgba(139, 69, 255, 0.2)',
                                                    border: '1px solid rgba(139, 69, 255, 0.4)',
                                                    color: '#c4b5fd',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    marginTop: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = 'rgba(139, 69, 255, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'rgba(139, 69, 255, 0.2)';
                                                }}
                                            >
                                                {isExpanded ? 'Voir moins' : 'Voir davantage'}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Photos et vidéos de la soirée */}
                {((party.photoURLs && party.photoURLs.length > 0) || party.photoURL || (party.videoURLs && party.videoURLs.length > 0)) && (
                    <div style={{ 
                        marginTop: '16px',
                        marginLeft: '-20px',
                        marginRight: '-20px',
                        position: 'relative'
                    }}>
                        {/* Défilement horizontal pour tous les médias */}
                        {(party.photoURLs && party.photoURLs.length > 0) || (party.videoURLs && party.videoURLs.length > 0) ? (
                            <div style={{
                                display: 'flex',
                                overflowX: 'auto',
                                gap: '12px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitScrollbar: { display: 'none' }
                            }}>
                                {/* Photos */}
                                {party.photoURLs && party.photoURLs.map((photoURL, index) => (
                                    <div
                                        key={`photo-${index}`}
                                        style={{
                                            minWidth: '85vw',
                                            maxWidth: '85vw',
                                            aspectRatio: '16/10',
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            position: 'relative'
                                        }}
                                        onClick={() => setSelectedPhoto(photoURL)}
                                    >
                                        <img 
                                            src={photoURL}
                                            alt={`Photo ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.2s ease'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                console.error('Erreur chargement image:', photoURL);
                                            }}
                                            loading="lazy"
                                        />
                                        {/* Indicateur de position */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            {index + 1}/{(party.photoURLs?.length || 0) + (party.videoURLs?.length || 0)}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Vidéos */}
                                {party.videoURLs && party.videoURLs.map((videoURL, index) => (
                                    <div
                                        key={`video-${index}`}
                                        style={{
                                            minWidth: '85vw',
                                            maxWidth: '85vw',
                                            aspectRatio: '16/10',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            position: 'relative'
                                        }}
                                    >
                                        <video 
                                            src={videoURL}
                                            controls
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                console.error('Erreur chargement vidéo:', videoURL);
                                            }}
                                        />
                                        {/* Indicateur de position */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            {(party.photoURLs?.length || 0) + index + 1}/{(party.photoURLs?.length || 0) + (party.videoURLs?.length || 0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Rétrocompatibilité avec l'ancien format */
                            party.photoURL && (
                                <div style={{
                                    marginLeft: '-20px',
                                    marginRight: '-20px'
                                }}>
                                    <div style={{
                                        paddingLeft: '20px',
                                        paddingRight: '20px'
                                    }}>
                                        <div style={{
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            cursor: 'pointer'
                                        }}>
                                            <img 
                                                src={party.photoURL}
                                                alt="Photo de soirée"
                                                onClick={() => setSelectedPhoto(party.photoURL)}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    aspectRatio: '16/10',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    console.error('Erreur chargement image:', party.photoURL);
                                                }}
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Actions */}
                <div style={{ 
                    display: 'flex', 
                    gap: 'clamp(8px, 4vw, 16px)', // Responsive gap
                    paddingTop: '8px',
                    flexWrap: 'wrap', // Permet le passage à la ligne
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden'
                }}>
                    <button 
                        onClick={() => handleInteraction(item.id, 'like')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: hasUserInteracted(item.id, 'like') ? '#ef4444' : '#9ca3af',
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'color 0.2s ease',
                            padding: 'clamp(4px, 2vw, 8px)', // Responsive padding
                            minHeight: '44px', // Touch-friendly
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        <Heart size={16} fill={hasUserInteracted(item.id, 'like') ? '#ef4444' : 'none'} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            J'aime {interactions[item.id]?.likes?.length > 0 && `(${interactions[item.id].likes.length})`}
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => setShowComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: interactions[item.id]?.comments?.length > 0 ? '#60a5fa' : '#9ca3af',
                            fontSize: 'clamp(12px, 3.5vw, 14px)', // Responsive
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 'clamp(4px, 2vw, 8px)', // Responsive padding
                            minHeight: '44px', // Touch-friendly
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        <MessageCircle size={16} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Commenter {interactions[item.id]?.comments?.length > 0 && `(${interactions[item.id].comments.length})`}
                        </span>
                    </button>
                </div>

                {/* Section commentaires */}
                <CommentSection itemId={item.id} />
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

    // Charger le feed au démarrage
    useEffect(() => {
        if (user && userProfile) {
            loadFeed();
        }
    }, [user, userProfile]);

    // Listener pour rafraîchissement automatique du feed
    useEffect(() => {
        const handleFeedRefresh = () => {
            console.log('🔄 Rafraîchissement automatique du feed déclenché');
            loadFeed();
        };

        // Écouter l'événement custom de refresh du feed
        window.addEventListener('refreshFeed', handleFeedRefresh);
        
        return () => {
            window.removeEventListener('refreshFeed', handleFeedRefresh);
        };
    }, [loadFeed]);

    // Charger les interactions quand les items changent
    useEffect(() => {
        if (feedItems.length > 0) {
            console.log('📥 Chargement interactions pour', feedItems.length, 'items');
            feedItems.forEach(item => {
                loadInteractions(item.id);
            });
        }
    }, [feedItems.length]); // Seulement quand le nombre d'items change

    // ===== RENDU =====

    if (loading) return <LoadingSpinner />;

    return (
        <>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '600', margin: 0 }}>
                    Fil d'actualité
                </h2>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={async () => {
                            setRefreshing(true);
                            await loadFeed();
                            setRefreshing(false);
                        }}
                        disabled={refreshing}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: refreshing ? '#6b7280' : '#8b45ff',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {refreshing ? <LoadingIcon /> : '🔄'}
                        {refreshing ? 'Actualisation...' : 'Actualiser'}
                    </button>
                </div>
            </div>

            {/* Contenu */}
            {feedItems.length === 0 ? (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px auto', color: '#9ca3af' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                        Aucune activité récente
                    </h3>
                    <p style={{ color: '#9ca3af', margin: 0 }}>
                        Aucune activité à afficher. Organisez une soirée ou ajoutez des amis !
                    </p>
                </div>
            ) : (
                <div style={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {feedItems.map((item) => (
                        <div key={item.id}>
                            {item.type === 'party' && <PartyItem item={item} />}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal photo en plein écran */}
            {selectedPhoto && (
                <div 
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
                        zIndex: 10000,
                        padding: '20px'
                    }}
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div style={{
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img 
                            src={selectedPhoto}
                            alt="Photo en grand"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Modal vidéo en plein écran */}
            {selectedVideo && (
                <div 
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
                        zIndex: 10000,
                        padding: '20px'
                    }}
                    onClick={() => setSelectedVideo(null)}
                >
                    <div style={{
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <video 
                            src={selectedVideo}
                            controls
                            autoPlay
                            muted
                            playsInline
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                borderRadius: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setSelectedVideo(null)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedPage;
