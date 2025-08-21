import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { Calendar, Users, Trophy, MapPin, Heart, MessageCircle, MoreHorizontal, Volume2 } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import '../styles/FeedPage.css';
import '../styles/ModernFeed.css';

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
    
    // États pour les résumés expandus
    const [expandedSummaries, setExpandedSummaries] = useState({});
    
    // Fonctions Firebase
    const handleFeedInteraction = httpsCallable(functions, 'handleFeedInteraction');
    const getFeedInteractions = httpsCallable(functions, 'getFeedInteractions');

    console.log('🚀 FeedPage initialisé - User:', user?.uid, 'Profile:', userProfile?.username);

    // Composant VideoPlayer avec autoplay
    const VideoPlayer = ({ src, style, onClick, isInScroll = false }) => {
        const videoRef = useRef(null);
        const [isVisible, setIsVisible] = useState(false);
        const [isPlaying, setIsPlaying] = useState(false);

        useEffect(() => {
            const video = videoRef.current;
            if (!video) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsVisible(true);
                            // Démarrer la vidéo automatiquement
                            video.play().then(() => {
                                setIsPlaying(true);
                            }).catch((error) => {
                                console.log('Autoplay bloqué:', error);
                            });
                        } else {
                            setIsVisible(false);
                            // Arrêter la vidéo quand elle sort de la vue
                            video.pause();
                            video.currentTime = 0;
                            setIsPlaying(false);
                        }
                    });
                },
                {
                    threshold: 0.5, // Démarre quand 50% de la vidéo est visible
                    rootMargin: '0px'
                }
            );

            observer.observe(video);

            return () => {
                observer.disconnect();
            };
        }, []);

        return (
            <video 
                ref={videoRef}
                src={src}
                style={style}
                muted={true} // Toujours sans son pour l'autoplay
                playsInline
                preload="metadata"
                loop={true} // Boucle infinie
                onClick={onClick}
                onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Erreur chargement vidéo:', src);
                }}
            />
        );
    };

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

    // Item de soirée avec design moderne
    const PartyItem = ({ item }) => {
        const party = item.data;
        const totalDrinks = party.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0;
        const timeAgo = getTimeAgo(item.timestamp?.toDate());

        // Debug: vérifier si la soirée a des photos
        console.log(`🔍 PartyItem ${item.id}:`, {
            hasPhotos: !!(party.photoURLs && party.photoURLs.length > 0),
            photosCount: party.photoURLs?.length || 0,
            photoURLs: party.photoURLs,
            hasVideos: !!(party.videoURLs && party.videoURLs.length > 0),
            videosCount: party.videoURLs?.length || 0,
            videoURLs: party.videoURLs,
            hasOldPhoto: !!party.photoURL,
            partyData: party
        });

        return (
            <div className="modern-card">
                {/* Header moderne */}
                <div className="post-header">
                    <UserAvatar 
                        user={item.isOwn ? userProfile : friendsData[item.userId]}
                        size={44}
                        className="skeleton-avatar"
                    />
                    <div className="user-info">
                        <div className="username">
                            {item.isOwn ? userProfile?.username : friendsData[item.userId]?.username || 'Utilisateur'}
                        </div>
                        <div className="metadata">
                            {item.isOwn ? 'avez fait une soirée' : 'a fait une soirée'} • {timeAgo}
                        </div>
                    </div>
                    <button className="menu-btn">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                {/* Contenu de la soirée */}
                <div className="post-content">
                    <h4 className="post-title">
                        {party.category} - {party.date}
                    </h4>
                    
                    {party.location && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            marginBottom: '12px'
                        }}>
                            <MapPin size={14} />
                            {party.location}
                        </div>
                    )}

                    {/* Stats modernes */}
                    <div className="post-stats">
                        <div className="stat-item">
                            <span className="emoji">🍺</span>
                            <span>{totalDrinks} boissons</span>
                        </div>
                        <div className="stat-item">
                            <span className="emoji">👥</span>
                            <span>{party.girlsTalkedTo || 0} filles</span>
                        </div>
                        <div className="stat-item">
                            <span className="emoji">🤮</span>
                            <span>{party.vomi || 0} vomis</span>
                        </div>
                        <div className="stat-item">
                            <span className="emoji">👊</span>
                            <span>{party.fights || 0} bagarres</span>
                        </div>
                    </div>

                    {/* Participants */}
                    {party.companions && party.companions.selectedNames.length > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.08), rgba(99, 102, 241, 0.08))',
                            border: '1px solid rgba(139, 69, 255, 0.15)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)',
                            margin: 'var(--space-md) 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)'
                        }}>
                            <Users size={16} style={{ color: '#8b5cf6' }} />
                            <span style={{ color: '#6b46c1', fontSize: '14px' }}>
                                Avec: {party.companions.selectedNames.join(', ')}
                            </span>
                        </div>
                    )}

                    {/* Résumé moderne */}
                    {party.summary && (
                        <div className="summary-container">
                            {(() => {
                                // Vérifier s'il y a des médias (photos ou vidéos)
                                const hasMedia = (party.photoURLs && party.photoURLs.length > 0) || 
                                                party.photoURL || 
                                                (party.videoURLs && party.videoURLs.length > 0);
                                
                                // Si pas de média, afficher le résumé en entier
                                const shouldShowFull = !hasMedia || expandedSummaries[item.id];
                                
                                return (
                                    <>
                                        <p className="summary-text" style={{
                                            display: shouldShowFull ? 'block' : '-webkit-box',
                                            WebkitLineClamp: shouldShowFull ? 'none' : 1,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            "{party.summary}"
                                        </p>
                                        {/* Bouton "voir plus" seulement si il y a des médias et le texte est long */}
                                        {hasMedia && party.summary.length > 100 && (
                                            <button
                                                className="summary-toggle"
                                                onClick={() => setExpandedSummaries(prev => ({
                                                    ...prev,
                                                    [item.id]: !prev[item.id]
                                                }))}
                                            >
                                                {expandedSummaries[item.id] ? 'Voir moins' : 'Voir plus'}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Photos de la soirée */}
                {((party.photoURLs && party.photoURLs.length > 0) || party.photoURL) && (
                    <div className="media-container">
                        {/* Grille de photos pour le nouveau format */}
                        {party.photoURLs && party.photoURLs.length > 0 ? (
                            party.photoURLs.length === 1 ? (
                                // Une seule photo : pleine largeur
                                <img 
                                    src={party.photoURLs[0]}
                                    alt="Photo de soirée"
                                    onClick={() => setSelectedPhoto(party.photoURLs[0])}
                                    className="media-single"
                                    style={{ cursor: 'pointer' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        console.error('Erreur chargement image:', party.photoURLs[0]);
                                    }}
                                    loading="lazy"
                                />
                            ) : (
                                // Plusieurs photos : défilement horizontal
                                <div className="media-scroll photo-scroll">
                                    {party.photoURLs.map((photoURL, index) => (
                                        <div
                                            key={index}
                                            className="media-item"
                                            onClick={() => setSelectedPhoto(photoURL)}
                                        >
                                            <img 
                                                src={photoURL}
                                                alt={`Photo ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    console.error('Erreur chargement image:', photoURL);
                                                }}
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            /* Rétrocompatibilité avec l'ancien format */
                            party.photoURL && (
                                <img 
                                    src={party.photoURL}
                                    alt="Photo de soirée"
                                    onClick={() => setSelectedPhoto(party.photoURL)}
                                    className="media-single"
                                    style={{ cursor: 'pointer' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        console.error('Erreur chargement image:', party.photoURL);
                                    }}
                                    loading="lazy"
                                />
                            )
                        )}
                    </div>
                )}

                {/* Vidéos de la soirée */}
                {(party.videoURLs && party.videoURLs.length > 0) && (
                    <div className="media-container">
                        {party.videoURLs.length === 1 ? (
                            // Une seule vidéo : pleine largeur
                            <div style={{ position: 'relative' }}>
                                <VideoPlayer 
                                    src={party.videoURLs[0]}
                                    style={{
                                        width: '100%',
                                        height: '300px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-lg)'
                                    }}
                                    onClick={() => setSelectedVideo(party.videoURLs[0])}
                                />
                                <div className="video-overlay large">
                                    <Volume2 size={20} />
                                </div>
                            </div>
                        ) : (
                            // Plusieurs vidéos : défilement horizontal
                            <div className="media-scroll video-scroll">
                                {party.videoURLs.map((videoURL, index) => (
                                    <div
                                        key={index}
                                        className="media-item"
                                        onClick={() => setSelectedVideo(videoURL)}
                                        style={{ position: 'relative' }}
                                    >
                                        <VideoPlayer 
                                            src={videoURL}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onClick={() => setSelectedVideo(videoURL)}
                                            isInScroll={true}
                                        />
                                        <div className="video-overlay">
                                            <Volume2 size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Bar */}
                <div className="actions-bar">
                    <button 
                        className={`action-btn ${interactions[item.id]?.userLiked ? 'active' : ''}`}
                        onClick={() => handleInteraction(item.id, 'like')}
                        disabled={isLoadingInteraction[item.id]}
                    >
                        <Heart className="icon" fill={interactions[item.id]?.userLiked ? 'currentColor' : 'none'} />
                        <span className="action-count">{interactions[item.id]?.likes || 0}</span>
                    </button>
                    <button 
                        className="action-btn"
                        onClick={() => setShowComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    >
                        <MessageCircle className="icon" />
                        <span className="action-count">{interactions[item.id]?.comments?.length || 0}</span>
                    </button>
                </div>

                {/* Section commentaires */}
                <CommentSection itemId={item.id} />
            </div>
        );
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
                                // Vérifier s'il y a des médias (photos ou vidéos)
                                const hasMedia = (party.photoURLs && party.photoURLs.length > 0) || 
                                                party.photoURL || 
                                                (party.videoURLs && party.videoURLs.length > 0);
                                
                                // Si pas de média, afficher le résumé en entier
                                const shouldShowFull = !hasMedia || expandedSummaries[item.id];
                                
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
                                            hyphens: 'auto',
                                            display: shouldShowFull ? 'block' : '-webkit-box',
                                            WebkitLineClamp: shouldShowFull ? 'none' : 1,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            "{party.summary}"
                                        </p>
                                        {/* Bouton "voir plus" seulement si il y a des médias et le texte est long */}
                                        {hasMedia && party.summary.length > 100 && (
                                            <button
                                                onClick={() => setExpandedSummaries(prev => ({
                                                    ...prev,
                                                    [item.id]: !prev[item.id]
                                                }))}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    color: '#8b45ff',
                                                    fontSize: 'clamp(10px, 3vw, 12px)',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    marginTop: '8px',
                                                    padding: '4px 0',
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                {expandedSummaries[item.id] ? 'Voir moins' : 'Voir plus'}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Photos de la soirée */}
                {((party.photoURLs && party.photoURLs.length > 0) || party.photoURL) && (
                    <div style={{ marginTop: '16px', width: '100%' }}>
                        {/* Grille de photos pour le nouveau format */}
                        {party.photoURLs && party.photoURLs.length > 0 ? (
                            party.photoURLs.length === 1 ? (
                                // Une seule photo : pleine largeur
                                <div style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <img 
                                        src={party.photoURLs[0]}
                                        alt="Photo de soirée"
                                        onClick={() => setSelectedPhoto(party.photoURLs[0])}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '400px',
                                            objectFit: 'cover',
                                            display: 'block',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            console.error('Erreur chargement image:', party.photoURLs[0]);
                                        }}
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                // Plusieurs photos : défilement horizontal
                                <div 
                                    className="photo-scroll"
                                    style={{
                                        width: '100%',
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        scrollBehavior: 'smooth',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        paddingBottom: '8px',
                                        minWidth: 'max-content'
                                    }}>
                                        {party.photoURLs.map((photoURL, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'relative',
                                                    width: '300px', // Largeur fixe pour chaque photo
                                                    height: '400px', // Même hauteur que photo unique
                                                    flexShrink: 0,
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            /* Rétrocompatibilité avec l'ancien format */
                            party.photoURL && (
                                <div style={{
                                    width: '100%',
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
                                            maxHeight: '400px',
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

                {/* Vidéos de la soirée */}
                {(party.videoURLs && party.videoURLs.length > 0) && (
                    <div style={{ marginTop: '16px', width: '100%' }}>
                        {party.videoURLs.length === 1 ? (
                            // Une seule vidéo : pleine largeur
                            <div style={{
                                width: '100%',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: '#000'
                            }}>
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '300px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedVideo(party.videoURLs[0])}
                                >
                                    <VideoPlayer 
                                        src={party.videoURLs[0]}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onClick={() => setSelectedVideo(party.videoURLs[0])}
                                    />
                                    {/* Bouton play pour indiquer qu'on peut cliquer */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '60px',
                                        height: '60px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '20px',
                                        pointerEvents: 'none',
                                        border: '2px solid rgba(255, 255, 255, 0.8)',
                                        opacity: '0.8'
                                    }}>
                                        🔊
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Plusieurs vidéos : défilement horizontal
                            <div 
                                className="video-scroll"
                                style={{
                                    width: '100%',
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    scrollBehavior: 'smooth',
                                    borderRadius: '12px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    paddingBottom: '8px',
                                    minWidth: 'max-content'
                                }}>
                                    {party.videoURLs.map((videoURL, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                width: '300px', // Largeur fixe pour chaque vidéo
                                                height: '300px', // Même hauteur que vidéo unique
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                backgroundColor: '#000'
                                            }}
                                            onClick={() => setSelectedVideo(videoURL)}
                                        >
                                            <VideoPlayer 
                                                src={videoURL}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                                onClick={() => setSelectedVideo(videoURL)}
                                                isInScroll={true}
                                            />
                                            {/* Bouton pour indiquer qu'on peut cliquer pour le son */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '48px',
                                                height: '48px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '16px',
                                                pointerEvents: 'none',
                                                border: '2px solid rgba(255, 255, 255, 0.8)',
                                                opacity: '0.8'
                                            }}>
                                                🔊
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
