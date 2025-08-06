import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
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
    const loadFeed = async () => {
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
    };

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
                            gap: '10px'
                        }}>
                            <UserAvatar user={commentUser} size={24} />
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    color: '#60a5fa', 
                                    fontSize: '12px', 
                                    fontWeight: '600', 
                                    marginBottom: '4px' 
                                }}>
                                    {comment.username}
                                </div>
                                <div style={{ color: 'white', fontSize: '14px' }}>
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
                    marginTop: '8px',
                    width: '100%'
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
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none'
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
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0 // Empêche le bouton de rétrécir
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

        // Debug: vérifier si la soirée a des photos
        console.log(`🔍 PartyItem ${item.id}:`, {
            hasPhotos: !!(party.photoURLs && party.photoURLs.length > 0),
            photosCount: party.photoURLs?.length || 0,
            photoURLs: party.photoURLs,
            // Rétrocompatibilité avec l'ancien format
            hasOldPhoto: !!party.photoURL,
            partyData: party
        });

        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                marginBottom: '16px'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <UserAvatar 
                        user={item.isOwn ? userProfile : friendsData[item.userId]}
                        size={40}
                        style={{ marginRight: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            color: 'white', 
                            fontWeight: '600', 
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {item.isOwn ? 'Vous' : item.username}
                            {/* Indicateur de photos */}
                            {(party.photoURLs && party.photoURLs.length > 0) && (
                                <span style={{
                                    backgroundColor: '#8b45ff',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                }}>
                                    📸 {party.photoURLs.length}
                                </span>
                            )}
                            {/* Rétrocompatibilité avec l'ancien format */}
                            {party.photoURL && !(party.photoURLs && party.photoURLs.length > 0) && (
                                <span style={{
                                    backgroundColor: '#8b45ff',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                }}>
                                    📸 1
                                </span>
                            )}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            <Calendar size={14} style={{ marginRight: '4px' }} />
                            {item.isOwn ? 'avez fait une soirée' : 'a fait une soirée'} • {timeAgo}
                        </div>
                    </div>
                </div>

                {/* Contenu */}
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px'
                }}>
                    <h4 style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 12px 0'
                    }}>
                        {party.category} - {party.date}
                    </h4>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px'
                    }}>
                        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                            🍺 {totalDrinks} boissons
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                            👥 {party.girlsTalkedTo || 0} filles
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                            🤮 {party.vomi || 0} vomis
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                            👊 {party.fights || 0} bagarres
                        </div>
                    </div>

                    {party.summary && (
                        <div style={{
                            backgroundColor: 'rgba(139, 69, 255, 0.1)',
                            border: '1px solid rgba(139, 69, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '12px'
                        }}>
                            <p style={{
                                color: '#c4b5fd',
                                fontSize: '14px',
                                fontStyle: 'italic',
                                margin: 0
                            }}>
                                "{party.summary}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Photos de la soirée */}
                {((party.photoURLs && party.photoURLs.length > 0) || party.photoURL) && (
                    <div style={{ marginTop: '16px' }}>
                        {/* Grille de photos pour le nouveau format */}
                        {party.photoURLs && party.photoURLs.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: party.photoURLs.length === 1 ? '1fr' : 
                                                   party.photoURLs.length === 2 ? '1fr 1fr' :
                                                   party.photoURLs.length === 3 ? '1fr 1fr 1fr' :
                                                   '1fr 1fr',
                                gap: '8px',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                {party.photoURLs.slice(0, 4).map((photoURL, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            position: 'relative',
                                            aspectRatio: party.photoURLs.length === 1 ? '16/10' : '1/1',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                console.error('Erreur chargement image:', photoURL);
                                            }}
                                            loading="lazy"
                                        />
                                        {/* Overlay si plus de 4 photos */}
                                        {index === 3 && party.photoURLs.length > 4 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '18px',
                                                fontWeight: '600'
                                            }}>
                                                +{party.photoURLs.length - 4}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Rétrocompatibilité avec l'ancien format */
                            party.photoURL && (
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
                                            maxHeight: '300px',
                                            objectFit: 'cover',
                                            display: 'block',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            console.error('Erreur chargement image:', party.photoURL);
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        loading="lazy"
                                    />
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
                    <button 
                        onClick={() => handleInteraction(item.id, 'like')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: hasUserInteracted(item.id, 'like') ? '#ef4444' : '#9ca3af',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        <Heart size={16} fill={hasUserInteracted(item.id, 'like') ? '#ef4444' : 'none'} />
                        J'aime {interactions[item.id]?.likes?.length > 0 && `(${interactions[item.id].likes.length})`}
                    </button>
                    
                    <button 
                        onClick={() => setShowComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: interactions[item.id]?.comments?.length > 0 ? '#60a5fa' : '#9ca3af',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <MessageCircle size={16} />
                        Commenter {interactions[item.id]?.comments?.length > 0 && `(${interactions[item.id].comments.length})`}
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
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
            }}>
                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '600', margin: 0 }}>
                    Fil d'actualité
                </h2>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            console.log('🔄 Rechargement interactions...');
                            feedItems.forEach(item => loadInteractions(item.id));
                        }}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Recharger
                    </button>
                    
                    <button 
                        onClick={() => {
                            console.log('👁️ AFFICHAGE AUTOMATIQUE DES COMMENTAIRES');
                            Object.keys(interactions).forEach(itemId => {
                                if (interactions[itemId]?.comments?.length > 0) {
                                    console.log(`Ouverture commentaires pour ${itemId}:`, interactions[itemId].comments.length);
                                    setShowComments(prev => ({ ...prev, [itemId]: true }));
                                }
                            });
                        }}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        👁️ Voir Commentaires ({Object.keys(interactions).filter(id => interactions[id]?.comments?.length > 0).length})
                    </button>
                    
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
                    color: 'white'
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
                    overflowY: 'auto'
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
        </div>
    );
};

export default FeedPage;
