/**
 * Logique pure pour récupérer les interactions d'un élément du feed
 * (likes, commentaires, félicitations)
 * @param {FirebaseFirestore.Firestore} db - instance Firestore
 * @param {string} currentUserId - ID de l'utilisateur connecté
 * @param {string} itemId - ID de l'item (party ou badge)
 * @param {string} appId - ID de l'application
 * @returns {Promise<{likes: Array, congratulations: Array, comments: Array}>}
 */
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

    // Vérifier visibilité : soi-même ou ami bidirectionnel
    let canSeeInteraction = interactionUserId === currentUserId;
    if (!canSeeInteraction && userFriends.includes(interactionUserId)) {
      try {
        const interactionUserStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${interactionUserId}`);
        const interactionUserStatsDoc = await interactionUserStatsRef.get();
        if (interactionUserStatsDoc.exists) {
          const interactionUserFriends = interactionUserStatsDoc.data().friends || [];
          canSeeInteraction = interactionUserFriends.includes(currentUserId);
        }
      } catch {
        canSeeInteraction = false;
      }
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

module.exports = { getFeedInteractionsLogic };
