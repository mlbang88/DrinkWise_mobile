/**
 * Fonctions Cloud Firebase pour DrinkWise
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/https");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const cors = require('cors');
const admin = require('firebase-admin');

// Initialiser Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuration CORS pour permettre les requêtes depuis localhost et production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5175', 
    'https://drinkwise-31d3a.web.app',
    'https://drinkwise-31d3a.firebaseapp.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

const corsHandler = cors(corsOptions);

// Fonction pour générer un résumé de soirée avec IA
exports.generateSummary = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { partyData, drunkLevel, appId } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    logger.info('Génération de résumé pour:', { 
      userId: request.auth.uid, 
      drunkLevel,
      drinksCount: partyData?.drinks?.length || 0 
    });

    // Analyser les données de la soirée
    const totalDrinks = partyData?.drinks?.length || 0;
    const drinkTypes = {};
    const events = partyData?.events || [];
    
    // Compter les types de boissons
    partyData?.drinks?.forEach(drink => {
      const type = drink.type || 'Inconnu';
      drinkTypes[type] = (drinkTypes[type] || 0) + 1;
    });

    // Créer un résumé basé sur les données
    let summary = `🎉 Résumé de votre soirée !\n\n`;
    
    summary += `🍸 Consommation: ${totalDrinks} boisson${totalDrinks > 1 ? 's' : ''}\n`;
    
    if (Object.keys(drinkTypes).length > 0) {
      summary += `📊 Répartition:\n`;
      Object.entries(drinkTypes).forEach(([type, count]) => {
        summary += `  • ${type}: ${count}\n`;
      });
    }
    
    if (events.length > 0) {
      summary += `\n🎊 Événements: ${events.length} moment${events.length > 1 ? 's' : ''} marquant${events.length > 1 ? 's' : ''}\n`;
    }
    
    summary += `\n🎯 Niveau de soirée: ${drunkLevel}\n`;
    
    // Ajouter un conseil basé sur le niveau
    switch(drunkLevel) {
      case 'Soirée Sage':
        summary += `\n💡 Belle soirée contrôlée ! Continuez comme ça ! 🌟`;
        break;
      case 'Soirée Correcte':
        summary += `\n💡 Soirée équilibrée, vous savez vous amuser tout en restant raisonnable ! 👍`;
        break;
      case 'Soirée Arrosée':
        summary += `\n💡 Soirée festive ! N'oubliez pas de boire de l'eau et de bien vous reposer. 💧`;
        break;
      case 'Soirée Excessive':
        summary += `\n💡 Soirée intense ! Prenez soin de vous et hydratez-vous bien. 🚰`;
        break;
      default:
        summary += `\n💡 Merci d'avoir utilisé DrinkWise pour suivre votre soirée ! 🎉`;
    }

    logger.info('Résumé généré avec succès');

    return {
      success: true,
      summary: summary,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Erreur lors de la génération du résumé:', error);
    
    return {
      success: false,
      error: error.message,
      summary: "🎉 Votre soirée a été enregistrée ! Merci d'avoir utilisé DrinkWise."
    };
  }
});

// Fonction automatique de synchronisation des amitiés (version simplifiée)
exports.syncFriendshipRequest = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    const { requestId, appId } = request.data;
    
    if (!requestId || !appId) {
      throw new Error('Paramètres manquants: requestId et appId requis');
    }

    logger.info('Synchronisation manuelle d\'amitié:', {
      requestId,
      userId: request.auth.uid
    });

    // Récupérer la demande d'ami
    const requestRef = db.doc(`artifacts/${appId}/friend_requests/${requestId}`);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new Error('Demande d\'ami introuvable');
    }

    const requestData = requestDoc.data();

    // Vérifier que la demande est acceptée
    if (requestData.status !== 'accepted') {
      throw new Error('La demande n\'est pas acceptée');
    }

    const batch = db.batch();

    // Références des documents à mettre à jour
    const fromProfileRef = db.doc(`artifacts/${appId}/users/${requestData.from}/profile/data`);
    const fromStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${requestData.from}`);
    const toProfileRef = db.doc(`artifacts/${appId}/users/${requestData.to}/profile/data`);
    const toStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${requestData.to}`);

    // Ajouter l'ami dans les deux sens
    batch.update(fromProfileRef, {
      friends: admin.firestore.FieldValue.arrayUnion(requestData.to)
    });
    
    batch.update(fromStatsRef, {
      friends: admin.firestore.FieldValue.arrayUnion(requestData.to)
    });

    batch.update(toProfileRef, {
      friends: admin.firestore.FieldValue.arrayUnion(requestData.from)
    });
    
    batch.update(toStatsRef, {
      friends: admin.firestore.FieldValue.arrayUnion(requestData.from)
    });

    // Supprimer la demande d'ami après synchronisation
    batch.delete(requestRef);

    // Exécuter toutes les opérations en une seule transaction
    await batch.commit();

    logger.info('✅ Synchronisation d\'amitié réussie:', {
      from: requestData.fromUsername,
      to: requestData.toUsername
    });

    return { 
      success: true, 
      message: `Amitié synchronisée entre ${requestData.fromUsername} et ${requestData.toUsername}` 
    };

  } catch (error) {
    logger.error('❌ Erreur synchronisation manuelle:', error);
    return { success: false, error: error.message };
  }
});

// Fonction pour supprimer une amitié de manière bidirectionnelle
exports.removeFriendship = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    const { friendId, appId } = request.data;
    const userId = request.auth.uid;
    
    if (!friendId || !appId) {
      throw new Error('Paramètres manquants: friendId et appId requis');
    }

    logger.info('Suppression bidirectionnelle d\'amitié:', {
      userId,
      friendId
    });

    const batch = db.batch();

    // Références des documents à mettre à jour
    const userProfileRef = db.doc(`artifacts/${appId}/users/${userId}/profile/data`);
    const userStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${userId}`);
    const friendProfileRef = db.doc(`artifacts/${appId}/users/${friendId}/profile/data`);
    const friendStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${friendId}`);

    // Supprimer l'ami des deux côtés (profil privé et stats publiques)
    batch.update(userProfileRef, {
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });
    
    batch.update(userStatsRef, {
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });

    batch.update(friendProfileRef, {
      friends: admin.firestore.FieldValue.arrayRemove(userId)
    });
    
    batch.update(friendStatsRef, {
      friends: admin.firestore.FieldValue.arrayRemove(userId)
    });

    // Exécuter toutes les opérations en une seule transaction
    await batch.commit();

    logger.info('✅ Suppression bidirectionnelle d\'amitié réussie');

    return { 
      success: true, 
      message: 'Amitié supprimée des deux côtés (profil et stats publiques)' 
    };

  } catch (error) {
    logger.error('❌ Erreur suppression bidirectionnelle:', error);
    return { success: false, error: error.message };
  }
});

// Fonction pour gérer les interactions du feed (likes, félicitations, commentaires)
exports.handleFeedInteraction = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    const { 
      itemId, 
      itemType, // 'party' ou 'badge'
      ownerId, 
      interactionType, // 'like', 'congratulate', 'comment'
      content, // Pour les commentaires
      appId 
    } = request.data;
    
    const userId = request.auth.uid;
    
    if (!itemId || !itemType || !ownerId || !interactionType || !appId) {
      throw new Error('Paramètres manquants');
    }

    logger.info('Interaction feed:', {
      userId,
      itemId,
      itemType,
      ownerId,
      interactionType
    });

    // Référence vers la collection des interactions
    const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (interactionType === 'comment') {
      // Ajouter un commentaire
      if (!content || content.trim() === '') {
        throw new Error('Le contenu du commentaire ne peut pas être vide');
      }

      await interactionsRef.add({
        itemId,
        itemType,
        ownerId,
        userId,
        type: 'comment',
        content: content.trim(),
        timestamp,
        createdAt: new Date()
      });

      return { 
        success: true, 
        message: 'Commentaire ajouté avec succès' 
      };

    } else if (interactionType === 'like' || interactionType === 'congratulate') {
      // Vérifier si l'interaction existe déjà
      const existingQuery = await interactionsRef
        .where('itemId', '==', itemId)
        .where('userId', '==', userId)
        .where('type', '==', interactionType)
        .get();

      if (!existingQuery.empty) {
        // Supprimer l'interaction existante (toggle)
        const batch = db.batch();
        existingQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        return { 
          success: true, 
          message: `${interactionType === 'like' ? 'Like' : 'Félicitation'} retiré(e)`,
          action: 'removed'
        };
      } else {
        // Ajouter la nouvelle interaction
        await interactionsRef.add({
          itemId,
          itemType,
          ownerId,
          userId,
          type: interactionType,
          timestamp,
          createdAt: new Date()
        });

        return { 
          success: true, 
          message: `${interactionType === 'like' ? 'Like' : 'Félicitation'} ajouté(e)`,
          action: 'added'
        };
      }
    }

    throw new Error('Type d\'interaction non supporté');

  } catch (error) {
    logger.error('❌ Erreur interaction feed:', error);
    return { success: false, error: error.message };
  }
});

// Fonction pour récupérer les interactions d'un élément du feed
exports.getFeedInteractions = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { itemId, appId } = request.data;
    
    if (!itemId || !appId) {
      throw new Error('Paramètres manquants: itemId et appId requis');
    }

    const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const snapshot = await interactionsRef
      .where('itemId', '==', itemId)
      .orderBy('timestamp', 'desc')
      .get();

    const interactions = {
      likes: [],
      congratulations: [],
      comments: []
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      switch(data.type) {
        case 'like':
          interactions.likes.push({
            id: doc.id,
            userId: data.userId,
            timestamp: data.timestamp
          });
          break;
        case 'congratulate':
          interactions.congratulations.push({
            id: doc.id,
            userId: data.userId,
            timestamp: data.timestamp
          });
          break;
        case 'comment':
          interactions.comments.push({
            id: doc.id,
            userId: data.userId,
            content: data.content,
            timestamp: data.timestamp
          });
          break;
      }
    });

    return { 
      success: true, 
      interactions 
    };

  } catch (error) {
    logger.error('❌ Erreur récupération interactions:', error);
    return { success: false, error: error.message };
  }
});

// Fonction de test pour vérifier le fonctionnement
exports.helloWorld = onRequest((request, response) => {
  corsHandler(request, response, () => {
    logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
  });
});
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// Configuration globale
setGlobalOptions({ maxInstances: 10 });
