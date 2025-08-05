/**
 * Logique pure pour gérer les interactions du feed (like, congratulate, comment)
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} currentUserId
 * @param {Object} data - { itemId, itemType, ownerId, interactionType, content }
 * @returns {Promise<{ success: boolean, action?: string, message?: string }>} 
 */
async function handleFeedInteractionLogic(db, currentUserId, data) {
  const { itemId, itemType, ownerId, interactionType, content } = data;
  if (!currentUserId) throw new Error('Utilisateur non authentifié');
  if (!itemId || !itemType || !ownerId || !interactionType) throw new Error('Paramètres manquants');
  const interactionsRef = db.collection(`artifacts/${data.appId}/feed_interactions`);
  if (interactionType === 'comment') {
    if (!content || content.trim() === '') throw new Error('Le contenu du commentaire ne peut pas être vide');
    await interactionsRef.add({ itemId, itemType, ownerId, userId: currentUserId, type: 'comment', content: content.trim(), timestamp: new Date() });
    return { success: true, action: 'commentAdded', message: 'Commentaire ajouté' };
  }
  if (interactionType === 'like' || interactionType === 'congratulate') {
    // toggle logique
    const existing = await interactionsRef
      .where('itemId', '==', itemId)
      .where('userId', '==', currentUserId)
      .where('type', '==', interactionType)
      .get();
    if (!existing.empty) {
      const batch = db.batch();
      existing.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return { success: true, action: 'removed', message: `${interactionType} retiré` };
    } else {
      await interactionsRef.add({ itemId, itemType, ownerId, userId: currentUserId, type: interactionType, timestamp: new Date() });
      return { success: true, action: 'added', message: `${interactionType} ajouté` };
    }
  }
  throw new Error('Type d\'interaction non supporté');
}

module.exports = { handleFeedInteractionLogic };
