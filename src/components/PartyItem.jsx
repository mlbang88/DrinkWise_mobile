import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import InstagramPost from './InstagramPost';

/**
 * PartyItem - Composant mémorisé pour afficher un post de soirée avec animations
 * 🎯 CRITICAL: Ce composant DOIT être défini en dehors de FeedPage
 * pour que React.memo fonctionne correctement
 */
const PartyItem = React.memo(({ 
  item, 
  itemInteractions, 
  userProfile,
  friendsData,
  heartAnimation,
  showComments,
  handleInteraction,
  setShowComments,
  handleAddComment,
  handleDoubleTap,
  onEditParty, 
  onDeleteParty 
}) => {
  const party = item.data;
  const totalDrinks = party.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0;
  const xpGained = Number(party.xpGained) || 0;
  const isFeatured = xpGained > 100; // Post légendaire
  
  // Protection: s'assurer que item.user existe
  if (!item.user) {
    item.user = item.isOwn ? userProfile : friendsData[item.userId] || { username: 'Utilisateur inconnu', displayName: 'Utilisateur' };
  }

  // Vérifier si l'utilisateur a réagi
  const userReaction = itemInteractions?.userReaction;
  const isLiked = userReaction === 'like' || userReaction === 'love';
  
  // Compter les likes
  const likesCount = itemInteractions?.reactions ? 
    Object.values(itemInteractions.reactions).reduce((sum, users) => sum + users.length, 0) : 0;
  
  const commentsCount = itemInteractions?.comments?.length || 0;
  
  // Récupérer les interactions de cet item
  const currentInteractions = itemInteractions;

  // 🎯 MEMOIZE CALLBACKS - Références stables pour React.memo
  const handleLike = useCallback((reactionType) => {
    handleInteraction(item.id, reactionType || 'like');
  }, [item.id, handleInteraction]);

  const handleComment = useCallback(() => {
    setShowComments(prev => ({ ...prev, [item.id]: !prev[item.id] }));
  }, [item.id, setShowComments]);

  const handleAddCommentCallback = useCallback((text) => {
    handleAddComment(item.id, text);
  }, [item.id, handleAddComment]);

  const handleDoubleTapCallback = useCallback(() => {
    handleDoubleTap(item.id);
  }, [item.id, handleDoubleTap]);

  // Convertir timestamp en Date si nécessaire
  let timestampDate = null;
  try {
    if (item.timestamp?.toDate) {
      timestampDate = item.timestamp.toDate();
    } else if (item.timestamp instanceof Date) {
      timestampDate = item.timestamp;
    }
  } catch (e) {
    console.error('Error converting timestamp:', e?.message || 'Unknown error');
  }

  // Préparer les données du post pour InstagramPost (valeurs primitives uniquement)
  const postData = {
    id: item.id,
    summary: (typeof party.summary === 'string' && party.summary) || '',
    totalDrinks: Number(totalDrinks) || 0,
    girlsTalkedTo: Number(party.girlsTalkedTo) || 0,
    locationName: (typeof party.location === 'string' && party.location) || '',
    photoURLs: Array.isArray(party.photoURLs) ? party.photoURLs : [],
    photoURL: (typeof party.photoURL === 'string' && party.photoURL) || '',
    videoURLs: Array.isArray(party.videoURLs) ? party.videoURLs : [],
    xpGained: Number(party.xpGained) || 0,
    companions: party.companions?.selectedNames && Array.isArray(party.companions.selectedNames)
      ? party.companions.selectedNames.filter(name => typeof name === 'string' && name.trim() !== '')
      : [],
    companionsType: party.companions?.type || 'none',
    groupName: (() => {
      const isGroup = party.companions?.type === 'group' || party.companions?.type === 'groups';
      const name = isGroup && party.companions?.selectedNames?.[0] 
        ? party.companions.selectedNames[0] 
        : '';
      if (isGroup) {
        console.log('🏷️ Group name:', { name, companions: party.companions });
      }
      return name;
    })(),
    badges: Array.isArray(party.badges) ? party.badges : [],
    comments: currentInteractions?.comments || []
  };

  // Simplifier user en valeurs primitives uniquement
  const userData = {
    username: (typeof item.user?.username === 'string' && item.user.username) || 
              (typeof item.user?.displayName === 'string' && item.user.displayName) || 
              'Utilisateur',
    profilePhoto: (typeof item.user?.photoURL === 'string' && item.user.photoURL) || 
                 (typeof item.user?.profilePhoto === 'string' && item.user.profilePhoto) || 
                 null
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      layout
      className={isFeatured ? 'featured-post' : ''}
      style={isFeatured ? {
        position: 'relative',
        borderRadius: '12px',
        padding: '4px',
        background: 'linear-gradient(135deg, #bf00ff 0%, #8b5cf6 50%, #bf00ff 100%)',
        backgroundSize: '200% 200%',
        animation: 'featured-gradient 3s ease infinite'
      } : {}}
    >
      {isFeatured && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #bf00ff, #8b5cf6)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(191, 0, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⭐ LÉGENDAIRE +{xpGained} XP
        </div>
      )}
      <div style={isFeatured ? {
        background: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      } : {}}>
        <InstagramPost
          post={postData}
          user={userData}
          onLike={handleLike}
          onComment={handleComment}
          onAddComment={handleAddCommentCallback}
          onDoubleTapLike={handleDoubleTapCallback}
          isLiked={Boolean(isLiked)}
          userReaction={currentInteractions?.userReaction || null}
          reactions={currentInteractions?.reactions || {}}
          likesCount={Number(likesCount) || 0}
          commentsCount={Number(commentsCount) || 0}
          timestamp={timestampDate}
          showHeartAnimation={Boolean(heartAnimation[item.id])}
          isCommentsOpen={Boolean(showComments[item.id])}
        />
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 🎯 Compare ONLY data props that affect rendering
  const prevInt = prevProps.itemInteractions || {};
  const nextInt = nextProps.itemInteractions || {};
  
  // Item identity
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.timestamp !== nextProps.item.timestamp) return false;
  
  // Interactions data
  if (prevInt.userReaction !== nextInt.userReaction) return false;
  if ((prevInt.comments?.length || 0) !== (nextInt.comments?.length || 0)) return false;
  
  // Reactions
  const prevReactionsJson = JSON.stringify(prevInt.reactions || {});
  const nextReactionsJson = JSON.stringify(nextInt.reactions || {});
  if (prevReactionsJson !== nextReactionsJson) return false;
  
  // UI state
  if (prevProps.heartAnimation[prevProps.item.id] !== nextProps.heartAnimation[nextProps.item.id]) return false;
  if (prevProps.showComments[prevProps.item.id] !== nextProps.showComments[nextProps.item.id]) return false;
  
  // ✅ IGNORE all callbacks - they change but don't affect output
  return true;
});

PartyItem.displayName = 'PartyItem';

export default PartyItem;
