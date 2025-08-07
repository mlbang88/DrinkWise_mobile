/**
 * Logique pure pour récupérer les interactions d'un élément du feed
 * (likes, commentaires, félicitations)
 * @param {FirebaseFirestore.Firestore} db - instance Firestore
 * @param {string} currentUserId - ID de l'utilisateur connecté
 * @param {string} itemId - ID de l'item (party ou badge)
 * @param {string} appId - ID de l'application
 * @returns {Promise<{likes: Array, congratulations: Array, comments: Array}>}
 */
const notificationService = require('./notificationService');

async function getFeedInteractionsLogic(db, currentUserId, itemId, appId) {
  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié');
  }
  if (!itemId || !appId) {
    throw new Error('Paramètres manquants');
  }
  // Récupérer la liste des amis de l'utilisateur connecté
  const userStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${currentUserId}`);
  const userStatsDoc = await userStatsRef.get();
  let userFriends = [];
  if (userStatsDoc.exists) {
    userFriends = userStatsDoc.data().friends || [];
  }

  // Récupérer toutes les interactions pour cet item
  const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
  const snapshot = await interactionsRef
    .where('itemId', '==', itemId)
    .orderBy('timestamp', 'desc')
    .get();

  // Initialiser le résultat
  const interactions = { likes: [], congratulations: [], comments: [] };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const interactionUserId = data.userId;

    // Logique de visibilité assouplie :
    // 1. L'utilisateur peut toujours voir ses propres interactions
    // 2. L'utilisateur peut voir les interactions de ses amis (même si pas bidirectionnel)
    // 3. L'utilisateur peut voir les interactions sur ses propres posts (ownerId)
    
    let canSeeInteraction = false;
    
    // Cas 1: Ses propres interactions
    if (interactionUserId === currentUserId) {
      canSeeInteraction = true;
    }
    // Cas 2: Interactions de ses amis 
    else if (userFriends.includes(interactionUserId)) {
      canSeeInteraction = true;
    }
    // Cas 3: Interactions sur ses propres posts (récupérer ownerId depuis l'item)
    else {
      // Pour plus de sécurité, on pourrait vérifier si c'est un commentaire sur son propre post
      // Mais pour l'instant, on autorise la visibilité si l'utilisateur est ami
      canSeeInteraction = false;
    }
    
    if (!canSeeInteraction) continue;

    // Ajouter l'interaction au bon tableau
    switch (data.type) {
      case 'like':
        interactions.likes.push({ id: doc.id, userId: data.userId, timestamp: data.timestamp });
        break;
      case 'congratulate':
        interactions.congratulations.push({ id: doc.id, userId: data.userId, timestamp: data.timestamp });
        break;
      case 'comment':
        interactions.comments.push({ id: doc.id, userId: data.userId, content: data.content, timestamp: data.timestamp });
        break;
    }
  }

  return interactions;
}

/**
 * Ajouter une interaction et déclencher une notification si approprié
 */
async function addInteractionWithNotification(db, appId, interactionData) {
  try {
    // Ajouter l'interaction
    const interactionRef = await db.collection(`artifacts/${appId}/feed_interactions`).add(interactionData);
    
    // Déclencher la notification appropriée
    if (interactionData.type === 'like') {
      await notificationService.onLikeAdded(db, appId, interactionData);
    } else if (interactionData.type === 'comment') {
      await notificationService.onCommentAdded(db, appId, interactionData);
    }
    
    return interactionRef;
  } catch (error) {
    console.error('❌ Erreur ajout interaction avec notification:', error);
    throw error;
  }
}

module.exports = { 
  getFeedInteractionsLogic,
  addInteractionWithNotification
};
