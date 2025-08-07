const admin = require('firebase-admin');

// Fonction pour créer une notification
async function createNotification(db, appId, userId, type, data, message = null) {
    const notificationData = {
        type,
        data,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        displayed: false
    };

    try {
        await db.collection(`artifacts/${appId}/users/${userId}/notifications`).add(notificationData);
        console.log(`✅ Notification ${type} créée pour ${userId}`);
    } catch (error) {
        console.error(`❌ Erreur création notification ${type}:`, error);
        throw error;
    }
}

// Fonction pour nettoyer les anciennes notifications (garder les 50 dernières)
async function cleanupOldNotifications(db, appId, userId) {
    try {
        const notificationsRef = db.collection(`artifacts/${appId}/users/${userId}/notifications`);
        const snapshot = await notificationsRef.orderBy('timestamp', 'desc').get();
        
        if (snapshot.size > 50) {
            const batch = db.batch();
            const docsToDelete = snapshot.docs.slice(50);
            
            docsToDelete.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`🧹 ${docsToDelete.length} anciennes notifications supprimées pour ${userId}`);
        }
    } catch (error) {
        console.error('❌ Erreur nettoyage notifications:', error);
    }
}

// Fonction appelée quand quelqu'un like une publication
exports.onLikeAdded = async (db, appId, interaction) => {
    try {
        // Récupérer les infos de l'utilisateur qui a liké
        const userStats = await db.doc(`artifacts/${appId}/public_user_stats/${interaction.userId}`).get();
        const userName = userStats.exists ? userStats.data().username : 'Quelqu\'un';

        // Récupérer les infos de l'item liké
        const itemRef = db.doc(`artifacts/${appId}/users/${interaction.targetUserId}/parties/${interaction.itemId}`);
        const itemDoc = await itemRef.get();
        
        if (itemDoc.exists) {
            const itemData = itemDoc.data();
            
            // Ne pas notifier si c'est son propre like
            if (interaction.userId !== interaction.targetUserId) {
                await createNotification(db, appId, interaction.targetUserId, 'like', {
                    userName,
                    userId: interaction.userId,
                    itemId: interaction.itemId,
                    itemType: 'party',
                    itemTitle: itemData.title || 'Votre soirée'
                });

                // Nettoyer les anciennes notifications
                await cleanupOldNotifications(db, appId, interaction.targetUserId);
            }
        }
    } catch (error) {
        console.error('❌ Erreur notification like:', error);
    }
};

// Fonction appelée quand quelqu'un commente une publication
exports.onCommentAdded = async (db, appId, interaction) => {
    try {
        // Récupérer les infos de l'utilisateur qui a commenté
        const userStats = await db.doc(`artifacts/${appId}/public_user_stats/${interaction.userId}`).get();
        const userName = userStats.exists ? userStats.data().username : 'Quelqu\'un';

        // Récupérer les infos de l'item commenté
        const itemRef = db.doc(`artifacts/${appId}/users/${interaction.targetUserId}/parties/${interaction.itemId}`);
        const itemDoc = await itemRef.get();
        
        if (itemDoc.exists) {
            const itemData = itemDoc.data();
            
            // Ne pas notifier si c'est son propre commentaire
            if (interaction.userId !== interaction.targetUserId) {
                await createNotification(db, appId, interaction.targetUserId, 'comment', {
                    userName,
                    userId: interaction.userId,
                    itemId: interaction.itemId,
                    itemType: 'party',
                    itemTitle: itemData.title || 'Votre soirée',
                    content: interaction.content
                });

                // Nettoyer les anciennes notifications
                await cleanupOldNotifications(db, appId, interaction.targetUserId);
            }
        }
    } catch (error) {
        console.error('❌ Erreur notification commentaire:', error);
    }
};

// Fonction appelée quand une demande d'ami est envoyée
exports.onFriendRequestSent = async (db, appId, fromUserId, toUserId) => {
    try {
        // Récupérer les infos de l'utilisateur qui envoie la demande
        const userStats = await db.doc(`artifacts/${appId}/public_user_stats/${fromUserId}`).get();
        const userName = userStats.exists ? userStats.data().username : 'Quelqu\'un';

        await createNotification(db, appId, toUserId, 'friend_request', {
            userName,
            userId: fromUserId,
            requestId: `${fromUserId}_${toUserId}`
        });

        // Nettoyer les anciennes notifications
        await cleanupOldNotifications(db, appId, toUserId);
    } catch (error) {
        console.error('❌ Erreur notification demande d\'ami:', error);
    }
};

// Fonction appelée quand une demande d'ami est acceptée
exports.onFriendRequestAccepted = async (db, appId, fromUserId, toUserId) => {
    try {
        // Récupérer les infos de l'utilisateur qui a accepté
        const userStats = await db.doc(`artifacts/${appId}/public_user_stats/${toUserId}`).get();
        const userName = userStats.exists ? userStats.data().username : 'Quelqu\'un';

        await createNotification(db, appId, fromUserId, 'friend_accepted', {
            userName,
            userId: toUserId
        });

        // Nettoyer les anciennes notifications
        await cleanupOldNotifications(db, appId, fromUserId);
    } catch (error) {
        console.error('❌ Erreur notification ami accepté:', error);
    }
};

module.exports = {
    createNotification,
    cleanupOldNotifications,
    onLikeAdded: exports.onLikeAdded,
    onCommentAdded: exports.onCommentAdded,
    onFriendRequestSent: exports.onFriendRequestSent,
    onFriendRequestAccepted: exports.onFriendRequestAccepted
};
