import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { normalizeString } from '../utils/helpers';
import { drinkImageLibrary } from '../utils/data';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { Calendar, Users, Trophy, MapPin, Clock, Heart, MessageCircle, Share } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const FeedPage = () => {
    const { db, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    
    // Debug du contexte
    console.log('=== FEED PAGE DEBUG ===');
    console.log('functions from context:', functions);
    console.log('user:', user);
    console.log('userProfile:', userProfile);
    
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [friendsData, setFriendsData] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [interactions, setInteractions] = useState({});
    const [showComments, setShowComments] = useState({});
    const [commentTexts, setCommentTexts] = useState({});
    const [loadingInteractions, setLoadingInteractions] = useState({});

    // Références aux fonctions Firebase
    const handleFeedInteraction = httpsCallable(functions, 'handleFeedInteraction');
    const getFeedInteractions = httpsCallable(functions, 'getFeedInteractions');
    const fixFriendship = httpsCallable(functions, 'fixFriendship');
    
    console.log('handleFeedInteraction function exists:', typeof handleFeedInteraction === 'function');
    console.log('getFeedInteractions function exists:', typeof getFeedInteractions === 'function');
    console.log('functions service:', functions);

    // Charger les interactions pour un item - VERSION SIMPLIFIÉE ET FIABLE
    const loadInteractions = async (itemId) => {
        console.log('=== loadInteractions SIMPLIFIÉ ===');
        console.log('itemId:', itemId);
        
        if (!getFeedInteractions) {
            console.error('getFeedInteractions non disponible');
            return;
        }
        
        try {
            // Déterminer l'ID réel pour Firebase (sans préfixe my-)
            let realItemId = itemId;
            if (itemId.startsWith('my-')) {
                realItemId = itemId.substring(3);
            }
            
            console.log('� Appel getFeedInteractions avec ID:', realItemId);
            const result = await getFeedInteractions({ itemId: realItemId, appId });
            
            if (result?.data?.success && result.data.interactions) {
                const interactions = result.data.interactions;
                console.log('✅ Interactions reçues:', interactions);
                
                // Enrichir les commentaires avec les noms d'utilisateur
                if (interactions.comments && interactions.comments.length > 0) {
                    console.log('📝 Enrichissement de', interactions.comments.length, 'commentaires');
                    
                    for (let comment of interactions.comments) {
                        if (!comment.username) {
                            if (comment.userId === user.uid) {
                                comment.username = userProfile?.username || 'Vous';
                            } else if (friendsData[comment.userId]) {
                                comment.username = friendsData[comment.userId].username;
                            } else {
                                // Charger le nom depuis les stats publiques
                                try {
                                    const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, comment.userId);
                                    const userStatsDoc = await getDoc(userStatsRef);
                                    if (userStatsDoc.exists()) {
                                        comment.username = userStatsDoc.data().username || 'Utilisateur';
                                    } else {
                                        comment.username = 'Utilisateur';
                                    }
                                } catch (error) {
                                    console.error('Erreur chargement nom utilisateur:', error);
                                    comment.username = 'Utilisateur';
                                }
                            }
                        }
                        
                        // Assurer la compatibilité content/text
                        if (comment.content && !comment.text) {
                            comment.text = comment.content;
                        }
                    }
                }
                
                // Sauvegarder avec l'ID original (avec préfixe si nécessaire)
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: interactions
                }));
                
                console.log('💾 Interactions sauvegardées pour', itemId);
            } else {
                console.log('❌ Aucune interaction ou échec');
                setInteractions(prev => ({
                    ...prev,
                    [itemId]: { likes: [], comments: [], congratulations: [] }
                }));
            }
        } catch (error) {
            console.error('❌ Erreur chargement interactions:', error);
            setInteractions(prev => ({
                ...prev,
                [itemId]: { likes: [], comments: [], congratulations: [] }
            }));
        }
    };

    // Gérer les interactions (like, congratulations, comment) - VERSION SIMPLIFIÉE
    const handleInteraction = useCallback(async (itemId, interactionType, data = null) => {
        console.log('=== handleInteraction SIMPLIFIÉ ===');
        console.log('itemId:', itemId);
        console.log('interactionType:', interactionType);
        console.log('data:', data);
        
        if (loadingInteractions[itemId]) {
            console.log('Interaction déjà en cours pour:', itemId);
            return;
        }
        
        // Déterminer le type d'item et le propriétaire
        let itemType, ownerId;
        
        if (itemId.startsWith('my-')) {
            itemType = 'party';
            ownerId = user.uid;
        } else {
            // Pour les items d'amis, déterminer le propriétaire depuis les feedItems
            const item = feedItems.find(item => item.id === itemId);
            if (item) {
                itemType = item.type;
                ownerId = item.userId;
            } else {
                console.error('Item non trouvé:', itemId);
                return;
            }
        }
        
        console.log('Type:', itemType, 'Propriétaire:', ownerId);
        
        setLoadingInteractions(prev => ({ ...prev, [itemId]: true }));
        
        try {
            // Convertir l'ID pour Firebase (enlever my- si présent)
            let firebaseItemId = itemId.startsWith('my-') ? itemId.substring(3) : itemId;
            
            const result = await handleFeedInteraction({
                itemId: firebaseItemId,
                itemType,
                ownerId,
                interactionType,
                content: data?.text || null,
                appId
            });
            
            console.log('Résultat interaction:', result);
            
            if (result.data.success) {
                console.log('✅ Interaction réussie, rechargement...');
                // Recharger immédiatement les interactions
                await loadInteractions(itemId);
            } else {
                console.error('❌ Échec interaction:', result.data.error);
            }
        } catch (error) {
            console.error('❌ Erreur interaction:', error);
        } finally {
            setLoadingInteractions(prev => ({ ...prev, [itemId]: false }));
        }
    }, [user.uid, feedItems, handleFeedInteraction, appId, loadInteractions]);

    // Vérifier si l'utilisateur a déjà interagi
    const hasUserInteracted = (itemId, interactionType) => {
        const itemInteractions = interactions[itemId];
        if (!itemInteractions) return false;
        
        if (interactionType === 'like') {
            return itemInteractions.likes?.some(like => like.userId === user.uid);
        } else if (interactionType === 'congratulate') {
            return itemInteractions.congratulations?.some(congrat => congrat.userId === user.uid);
        }
        return false;
    };

    // Charger les données des amis
    const loadFriendsData = async () => {
        if (!userProfile?.friends || userProfile.friends.length === 0) {
            console.log('❌ AUCUN AMI dans userProfile.friends:', userProfile?.friends);
            return {};
        }
        
        console.log('👥 CHARGEMENT AMIS - Liste des IDs d\'amis:', userProfile.friends);
        
        const friends = {};
        for (const friendId of userProfile.friends) {
            try {
                console.log('🔄 Chargement données pour ami:', friendId);
                
                // Charger directement depuis public_user_stats en utilisant l'ID du document
                const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
                const publicStatsDoc = await getDoc(publicStatsRef);
                
                if (publicStatsDoc.exists()) {
                    const friendData = publicStatsDoc.data();
                    friends[friendId] = {
                        id: friendId,
                        username: friendData.username || friendData.displayName || 'Ami',
                        displayName: friendData.displayName || friendData.username || 'Ami',
                        level: friendData.level || 'Novice de la Fête',
                        photoURL: friendData.photoURL || null,
                        profilePhoto: friendData.profilePhoto || { url: friendData.photoURL || null }
                    };
                    console.log('✅ Ami chargé depuis public_user_stats:', friendId, '→', friends[friendId].username);
                } else {
                    console.log('❌ Public stats non trouvé pour:', friendId, 'Essai du profil...');
                    
                    // Fallback : essayer de charger depuis le profil
                    const profileQuery = query(
                        collection(db, `artifacts/${appId}/users/${friendId}/profile`)
                    );
                    const profileSnapshot = await getDocs(profileQuery);
                    if (!profileSnapshot.empty) {
                        const friendData = profileSnapshot.docs[0].data();
                        friends[friendId] = {
                            id: friendId,
                            username: friendData.username || friendData.displayName || 'Ami',
                            displayName: friendData.displayName || friendData.username || 'Ami',
                            level: friendData.level || 'Novice de la Fête',
                            photoURL: friendData.photoURL || null,
                            profilePhoto: friendData.profilePhoto || { url: friendData.photoURL || null }
                        };
                        console.log('✅ Ami chargé depuis profil:', friendId, '→', friends[friendId].username);
                    } else {
                        console.warn('❌ Aucune donnée trouvée pour l\'ami:', friendId);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement ami:', friendId, error);
            }
        }
        console.log('Amis chargés au total:', Object.keys(friends).length);
        return friends;
    };

    // Charger les soirées des amis
    const loadFriendsParties = async (friends) => {
        const parties = [];
        const friendIds = Object.keys(friends);
        console.log('Chargement soirées pour amis:', friendIds);
        
        for (const friendId of friendIds) {
            try {
                console.log('Chargement soirées pour ami:', friendId);
                console.log('Current user ID:', user.uid);
                console.log('Path:', `artifacts/${appId}/users/${friendId}/parties`);
                
                // Vérifier d'abord si on peut accéder aux stats publiques de cet ami
                const publicStatsDoc = await getDoc(doc(db, `artifacts/${appId}/public_user_stats/${friendId}`));
                console.log('Stats publiques ami accessibles:', publicStatsDoc.exists());
                if (publicStatsDoc.exists()) {
                    console.log('Friends list de cet ami:', publicStatsDoc.data().friends);
                }
                
                const partiesQuery = query(
                    collection(db, `artifacts/${appId}/users/${friendId}/parties`),
                    orderBy('timestamp', 'desc'),
                    limit(5) // Limiter à 5 soirées récentes par ami
                );
                const partiesSnapshot = await getDocs(partiesQuery);
                console.log(`Soirées trouvées pour ${friendId}:`, partiesSnapshot.docs.length);
                
                partiesSnapshot.docs.forEach(doc => {
                    const partyData = doc.data();
                    console.log('Soirée ami ajoutée:', {friendId, partyDate: partyData.date});
                    parties.push({
                        id: doc.id,
                        type: 'party',
                        userId: friendId,
                        username: friends[friendId].username,
                        timestamp: partyData.timestamp,
                        data: partyData,
                        createdAt: partyData.timestamp,
                        isOwnParty: false
                    });
                });
            } catch (error) {
                console.error('Erreur chargement soirées ami:', friendId, error);
                console.error('Code erreur:', error.code);
                console.error('Message erreur:', error.message);
            }
        }
        console.log('Total soirées amis chargées:', parties.length);
        return parties;
    };

    // Charger mes propres soirées
    const loadMyParties = async () => {
        const parties = [];
        
        try {
            const partiesQuery = query(
                collection(db, `artifacts/${appId}/users/${user.uid}/parties`),
                orderBy('timestamp', 'desc'),
                limit(5) // Limiter à 5 soirées récentes
            );
            const partiesSnapshot = await getDocs(partiesQuery);
            
            partiesSnapshot.docs.forEach(doc => {
                const partyData = doc.data();
                parties.push({
                    id: `my-${doc.id}`,
                    type: 'party',
                    userId: user.uid,
                    username: userProfile?.username || 'Vous',
                    timestamp: partyData.timestamp,
                    data: partyData,
                    createdAt: partyData.timestamp,
                    isOwnParty: true
                });
            });
        } catch (error) {
            console.error('Erreur chargement mes soirées:', error);
        }
        
        return parties;
    };

    // Charger les badges débloqués des amis
    const loadFriendsBadges = async (friends) => {
        const badges = [];
        const friendIds = Object.keys(friends);
        
        for (const friendId of friendIds) {
            try {
                console.log('Chargement badges pour ami:', friendId);
                console.log('Current user ID:', user.uid);
                console.log('Badge path:', `artifacts/${appId}/users/${friendId}/profile`);
                
                const profileQuery = query(
                    collection(db, `artifacts/${appId}/users/${friendId}/profile`)
                );
                const profileSnapshot = await getDocs(profileQuery);
                console.log(`Documents profile trouvés pour ${friendId}:`, profileSnapshot.docs.length);
                
                if (!profileSnapshot.empty) {
                    const profileData = profileSnapshot.docs[0].data();
                    const unlockedBadges = profileData.unlockedBadges || [];
                    console.log(`Badges débloqués pour ${friendId}:`, unlockedBadges);
                    
                    // Simuler des timestamps récents pour les badges (dans un vrai cas, il faudrait stocker quand chaque badge a été débloqué)
                    unlockedBadges.slice(-3).forEach((badge, index) => { // Prendre les 3 derniers badges
                        const fakeTimestamp = new Date();
                        fakeTimestamp.setDate(fakeTimestamp.getDate() - index); // Décaler de quelques jours
                        
                        badges.push({
                            id: `${friendId}-${badge}-${index}`,
                            type: 'badge',
                            userId: friendId,
                            username: friends[friendId].username,
                            timestamp: { toDate: () => fakeTimestamp },
                            data: { badgeId: badge },
                            createdAt: { toDate: () => fakeTimestamp }
                        });
                    });
                }
            } catch (error) {
                console.error('Erreur chargement badges ami:', friendId, error);
                console.error('Code erreur badges:', error.code);
                console.error('Message erreur badges:', error.message);
            }
        }
        return badges;
    };

    // Charger les souvenirs partagés (si cette fonctionnalité existe)
    const loadSharedMemories = async (friends) => {
        const memories = [];
        // Cette partie sera implémentée quand la fonctionnalité de partage de souvenirs sera disponible
        return memories;
    };

    // Fonction principale pour charger le fil d'actualité
    const loadFeed = async () => {
        try {
            setLoading(true);
            console.log('Début chargement fil d\'actualité');
            console.log('UserProfile friends:', userProfile?.friends);
            
            // Charger les données des amis
            const friends = await loadFriendsData();
            setFriendsData(friends);
            console.log('Amis chargés avec succès:', Object.keys(friends));

            // Charger toutes les activités (incluant mes propres soirées)
            const [friendsParties, myParties, badges, memories] = await Promise.all([
                loadFriendsParties(friends),
                loadMyParties(),
                loadFriendsBadges(friends),
                loadSharedMemories(friends)
            ]);

            console.log('Résultats chargement:');
            console.log('- Soirées amis:', friendsParties.length);
            console.log('- Mes soirées:', myParties.length);
            console.log('- Badges:', badges.length);
            console.log('- Souvenirs:', memories.length);

            // Combiner toutes les activités et trier par date
            const allItems = [...friendsParties, ...myParties, ...badges, ...memories];
            allItems.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
                return dateB - dateA;
            });

            console.log('Total éléments dans le fil:', allItems.length);
            setFeedItems(allItems.slice(0, 20)); // Limiter à 20 éléments
        } catch (error) {
            console.error('Erreur chargement fil:', error);
            setMessageBox({ message: 'Erreur lors du chargement du fil d\'actualité', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Rafraîchir le fil
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadFeed();
        setRefreshing(false);
    };

    useEffect(() => {
        if (user && userProfile) {
            loadFeed();
        }
    }, [user, userProfile]);

    // Composant optimisé pour la zone de commentaire
    const CommentSection = React.memo(({ 
        itemId, 
        interactions, 
        showComments, 
        commentTexts, 
        setCommentTexts, 
        handleInteraction, 
        loadingInteractions,
        setShowComments,
        user,
        userProfile,
        friendsData 
    }) => {
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
                    // Déterminer les données utilisateur pour l'avatar
                    let commentUser = null;
                    if (comment.userId === user.uid) {
                        commentUser = userProfile;
                    } else if (friendsData[comment.userId]) {
                        commentUser = friendsData[comment.userId];
                    } else {
                        commentUser = { username: comment.username || 'Utilisateur' };
                    }

                    return (
                        <div key={comment.id || index} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                        }}>
                            <UserAvatar 
                                user={commentUser}
                                size={24}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                                    {comment.username || 'Utilisateur'}
                                </div>
                                <div style={{ color: 'white', fontSize: '14px' }}>
                                    {comment.text || comment.content || ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {/* Zone de saisie commentaire */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                e.preventDefault();
                                const text = e.target.value.trim();
                                handleInteraction(itemId, 'comment', { text });
                                e.target.value = '';
                            }
                        }}
                        placeholder="Ajouter un commentaire..."
                        style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px'
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
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Envoyer
                    </button>
                </div>
            </div>
        );
    });

    // Charger les interactions pour tous les items du feed - VERSION SIMPLIFIÉE
    useEffect(() => {
        console.log('� Chargement interactions pour', feedItems.length, 'items');
        
        if (feedItems.length > 0) {
            feedItems.forEach(item => {
                loadInteractions(item.id);
            });
        }
    }, [feedItems]);

    // Composant pour afficher une soirée
    const PartyFeedItem = ({ item }) => {
        const party = item.data;
        const totalDrinks = party.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0;
        const timeAgo = getTimeAgo(item.timestamp?.toDate());

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
                    <div style={{ marginRight: '12px' }}>
                        <UserAvatar 
                            user={item.isOwnParty ? userProfile : friendsData[item.userId]}
                            size={40}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                            {item.isOwnParty ? 'Vous' : item.username}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            <Calendar size={14} style={{ marginRight: '4px' }} />
                            {item.isOwnParty ? 'avez fait une soirée' : 'a fait une soirée'} • {timeAgo}
                        </div>
                    </div>
                </div>

                {/* Contenu de la soirée */}
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                    }}>
                        <h4 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: 0
                        }}>
                            {party.category} - {party.date}
                        </h4>
                        {party.location && (
                            <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px' }}>
                                <MapPin size={14} style={{ marginRight: '4px' }} />
                                {party.location}
                            </div>
                        )}
                    </div>

                    {/* Stats de la soirée */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px',
                        marginBottom: '12px'
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

                    {/* Participants (si disponible) */}
                    {party.companions && party.companions.selectedNames.length > 0 && (
                        <div style={{
                            backgroundColor: 'rgba(139, 69, 255, 0.1)',
                            border: '1px solid rgba(139, 69, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', color: '#c084fc', fontSize: '14px' }}>
                                <Users size={14} style={{ marginRight: '6px' }} />
                                Avec: {party.companions.selectedNames.join(', ')}
                            </div>
                        </div>
                    )}

                    {/* Résumé de la soirée */}
                    {party.summary && (
                        <div style={{
                            backgroundColor: 'rgba(139, 69, 255, 0.1)',
                            border: '1px solid rgba(139, 69, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '12px'
                        }}>
                            <p style={{
                                color: '#c4b5fd',
                                fontSize: '14px',
                                fontStyle: 'italic',
                                margin: 0,
                                lineHeight: '1.4'
                            }}>
                                "{party.summary}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    paddingTop: '8px'
                }}>
                    <button 
                        onClick={() => handleInteraction(item.id, 'like')}
                        disabled={loadingInteractions[item.id]}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: hasUserInteracted(item.id, 'like') ? '#ef4444' : '#9ca3af',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: loadingInteractions[item.id] ? 0.5 : 1
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
                            gap: '4px',
                            fontWeight: interactions[item.id]?.comments?.length > 0 ? '600' : 'normal'
                        }}
                    >
                        <MessageCircle size={16} fill={interactions[item.id]?.comments?.length > 0 ? '#60a5fa' : 'none'} />
                        Commenter {interactions[item.id]?.comments?.length > 0 && `(${interactions[item.id].comments.length})`}
                    </button>
                </div>

                {/* Section commentaires */}
                <CommentSection
                    itemId={item.id}
                    interactions={interactions}
                    showComments={showComments}
                    commentTexts={commentTexts}
                    setCommentTexts={setCommentTexts}
                    handleInteraction={handleInteraction}
                    loadingInteractions={loadingInteractions}
                    setShowComments={setShowComments}
                    user={user}
                    userProfile={userProfile}
                    friendsData={friendsData}
                />
            </div>
        );
    };

    // Composant pour afficher un badge débloqué
    const BadgeFeedItem = ({ item }) => {
        const timeAgo = getTimeAgo(item.timestamp?.toDate());
        const badgeInfo = badgeService.getBadgeInfo(item.data.badgeId);

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
                    <div style={{ marginRight: '12px' }}>
                        <UserAvatar 
                            user={item.isOwnBadge ? userProfile : friendsData[item.userId]}
                            size={40}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                            {item.username}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            <Trophy size={14} style={{ marginRight: '4px' }} />
                            a débloqué un badge • {timeAgo}
                        </div>
                    </div>
                </div>

                {/* Contenu du badge */}
                <div style={{
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '32px',
                        marginRight: '16px'
                    }}>
                        {badgeInfo?.icon || '🏆'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{
                            color: '#ffc107',
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 4px 0'
                        }}>
                            {badgeInfo?.name || 'Badge Mystère'}
                        </h4>
                        <p style={{
                            color: '#9ca3af',
                            fontSize: '14px',
                            margin: 0
                        }}>
                            {badgeInfo?.description || 'Un accomplissement remarquable !'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    paddingTop: '8px'
                }}>
                    <button 
                        onClick={() => handleInteraction(item.id, 'congratulate')}
                        disabled={loadingInteractions[item.id]}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: hasUserInteracted(item.id, 'congratulate') ? '#ffc107' : '#9ca3af',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: loadingInteractions[item.id] ? 0.5 : 1
                        }}
                    >
                        <Heart size={16} fill={hasUserInteracted(item.id, 'congratulate') ? '#ffc107' : 'none'} />
                        Féliciter {interactions[item.id]?.congratulations?.length > 0 && `(${interactions[item.id].congratulations.length})`}
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
                            gap: '4px',
                            fontWeight: interactions[item.id]?.comments?.length > 0 ? '600' : 'normal'
                        }}
                    >
                        <MessageCircle size={16} fill={interactions[item.id]?.comments?.length > 0 ? '#60a5fa' : 'none'} />
                        Commenter {interactions[item.id]?.comments?.length > 0 && `(${interactions[item.id].comments.length})`}
                    </button>
                </div>

                {/* Section commentaires */}
                <CommentSection
                    itemId={item.id}
                    interactions={interactions}
                    showComments={showComments}
                    commentTexts={commentTexts}
                    setCommentTexts={setCommentTexts}
                    handleInteraction={handleInteraction}
                    loadingInteractions={loadingInteractions}
                    setShowComments={setShowComments}
                    user={user}
                    userProfile={userProfile}
                    friendsData={friendsData}
                />
            </div>
        );
    };

    // Fonction utilitaire pour calculer le temps écoulé
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
                <h2 style={{
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: '600',
                    margin: 0
                }}>
                    Fil d'actualité
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            console.log('🔄 RECHARGEMENT COMPLET');
                            // Recharger tous les interactions
                            feedItems.forEach(item => {
                                loadInteractions(item.id);
                            });
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
                        �️ Voir Commentaires
                    </button>
                    <button 
                        onClick={() => {
                            console.log('� ÉTAT ACTUEL:');
                            console.log('feedItems:', feedItems.length);
                            console.log('interactions:', Object.keys(interactions).length);
                            Object.keys(interactions).forEach(itemId => {
                                const int = interactions[itemId];
                                console.log(`${itemId}: ${int.likes?.length || 0} likes, ${int.comments?.length || 0} commentaires`);
                            });
                        }}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#8b5cf6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        � Debug
                    </button>
                    <button 
                        onClick={handleRefresh}
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

            {/* Contenu du fil */}
            {feedItems.length === 0 ? (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px auto', color: '#9ca3af' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                        Aucune activité récente
                    </h3>
                    <p style={{ color: '#9ca3af', margin: 0 }}>
                        Aucune activité récente à afficher. Organisez une soirée ou ajoutez des amis !
                    </p>
                </div>
            ) : (
                <div style={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                }}>
                    {feedItems.map((item) => (
                        <div key={item.id}>
                            {item.type === 'party' && <PartyFeedItem item={item} />}
                            {item.type === 'badge' && <BadgeFeedItem item={item} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedPage;
