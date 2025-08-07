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
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
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
    
    // TODO: Implémenter la génération de résumé
    return { success: false, message: "À implémenter" };
    
  } catch (error) {
    logger.error('❌ Erreur generateSummary:', error);
    throw new Error(`Erreur génération résumé: ${error.message}`);
  }
});

// Fonction pour analyser une image avec Gemini de manière sécurisée
exports.analyzeImageSecure = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { imageBase64 } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Clé API stockée de manière sécurisée côté serveur
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('Configuration API manquante');
    }
    
    logger.info('🤖 Analyse d\'image sécurisée pour utilisateur:', request.auth.uid);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [
          {
            text: `Analyse cette image et identifie la boisson visible. 
            Réponds au format JSON avec les clés "type" et "brand" (marque).
            
            Pour le type, utilise l'un de ces termes : "Bière", "Vin", "Spiritueux", "Cocktail", "Autre"
            Pour la marque, identifie la marque visible sur l'étiquette/bouteille (ex: "Heineken", "Corona", "Absolut", "Jack Daniel's", etc.)
            Si aucune marque n'est visible ou identifiable, mets "brand": null
            
            Exemple de réponse:
            {"type": "Bière", "brand": "Heineken"}
            {"type": "Spiritueux", "brand": "Jack Daniel's"}
            {"type": "Vin", "brand": null}
            
            Si aucune boisson n'est visible, réponds: {"type": "Autre", "brand": null}`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 200
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Réponse API invalide');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    logger.info('Réponse Gemini brute:', text);
    
    // Parser la réponse JSON
    let drinkInfo;
    try {
      const cleanedText = text.replace(/```json|```/g, '').replace(/\n/g, '').trim();
      drinkInfo = JSON.parse(cleanedText);
      
      // Standardiser le format de réponse
      drinkInfo = {
        type: drinkInfo.type || 'Autre',
        brand: drinkInfo.brand || null
      };
    } catch (parseError) {
      logger.warn('Parsing JSON échoué, fallback:', parseError);
      // Fallback si parsing échoue
      drinkInfo = { type: 'Autre', brand: null };
    }
    
    logger.info('✅ Analyse terminée:', drinkInfo);
    
    return {
      success: true,
      drinkInfo: drinkInfo
    };
    
  } catch (error) {
    logger.error('❌ Erreur analyse image:', error);
    throw new Error(`Erreur analyse: ${error.message}`);
  }
});

// Fonction pour forcer l'ajout d'un ami (avec privilèges admin)
exports.forceAddFriend = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { friendId, appId } = request.data;
    const userId = request.auth.uid;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }
    
    logger.info(`🔧 Ajout forcé d'ami: ${userId} -> ${friendId}`);
    
    // 1. Vérifier que les deux utilisateurs existent
    const [userStatsRef, friendStatsRef] = [
      db.doc(`artifacts/${appId}/public_user_stats/${userId}`),
      db.doc(`artifacts/${appId}/public_user_stats/${friendId}`)
    ];
    
    const [userDoc, friendDoc] = await Promise.all([
      userStatsRef.get(),
      friendStatsRef.get()
    ]);
    
    if (!userDoc.exists) {
      throw new Error('Utilisateur actuel introuvable');
    }
    
    if (!friendDoc.exists) {
      throw new Error('Ami introuvable');
    }
    
    const userData = userDoc.data();
    const friendData = friendDoc.data();
    
    logger.info(`✅ Utilisateur: ${userData.username}, Ami: ${friendData.username}`);
    
    // 2. Vérifier s'ils sont déjà amis
    const userFriends = userData.friends || [];
    const friendFriends = friendData.friends || [];
    
    if (userFriends.includes(friendId) && friendFriends.includes(userId)) {
      return {
        success: true,
        message: 'Vous êtes déjà amis',
        alreadyFriends: true
      };
    }
    
    // 3. Créer un batch pour toutes les opérations
    const batch = db.batch();
    
    // 4. Ajouter aux profils publics
    if (!userFriends.includes(friendId)) {
      batch.update(userStatsRef, {
        friends: admin.firestore.FieldValue.arrayUnion(friendId)
      });
      logger.info(`➕ ${friendData.username} ajouté aux amis de ${userData.username}`);
    }
    
    if (!friendFriends.includes(userId)) {
      batch.update(friendStatsRef, {
        friends: admin.firestore.FieldValue.arrayUnion(userId)
      });
      logger.info(`➕ ${userData.username} ajouté aux amis de ${friendData.username}`);
    }
    
    // 5. Ajouter aux profils privés (si ils existent)
    const userProfileRef = db.doc(`artifacts/${appId}/users/${userId}/profile`);
    const friendProfileRef = db.doc(`artifacts/${appId}/users/${friendId}/profile`);
    
    try {
      const userProfileDoc = await userProfileRef.get();
      if (userProfileDoc.exists()) {
        const profileFriends = userProfileDoc.data().friends || [];
        if (!profileFriends.includes(friendId)) {
          batch.update(userProfileRef, {
            friends: admin.firestore.FieldValue.arrayUnion(friendId)
          });
          logger.info(`➕ Profil privé de ${userData.username} mis à jour`);
        }
      }
    } catch (error) {
      logger.warn(`⚠️ Pas de profil privé pour ${userData.username}`);
    }
    
    try {
      const friendProfileDoc = await friendProfileRef.get();
      if (friendProfileDoc.exists()) {
        const profileFriends = friendProfileDoc.data().friends || [];
        if (!profileFriends.includes(userId)) {
          batch.update(friendProfileRef, {
            friends: admin.firestore.FieldValue.arrayUnion(userId)
          });
          logger.info(`➕ Profil privé de ${friendData.username} mis à jour`);
        }
      }
    } catch (error) {
      logger.warn(`⚠️ Pas de profil privé pour ${friendData.username}`);
    }
    
    // 6. Supprimer les demandes d'amitié en cours
    const requestsSnapshot = await db.collection(`artifacts/${appId}/friend_requests`)
      .where('from', 'in', [userId, friendId])
      .where('to', 'in', [userId, friendId])
      .get();
    
    requestsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      logger.info(`🗑️ Demande d'amitié supprimée: ${doc.id}`);
    });
    
    // 7. Exécuter toutes les opérations
    await batch.commit();
    
    logger.info(`🎉 Amitié créée avec succès entre ${userData.username} et ${friendData.username}!`);
    
    return {
      success: true,
      message: `Ami ${friendData.username} ajouté avec succès !`,
      friendName: friendData.username,
      userName: userData.username
    };
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'ajout forcé d\'ami:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

// Fonction pour analyser une image avec Gemini de manière sécurisée
exports.analyzeImageSecure = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { imageBase64, mimeType } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Clé API stockée de manière sécurisée côté serveur
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('Configuration API manquante');
    }
    
    logger.info('🤖 Analyse d\'image sécurisée pour utilisateur:', request.auth.uid);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [
          {
            text: `Analyse cette image et identifie la boisson visible. 
            Réponds au format JSON avec les clés "type" et "brand" (marque).
            
            Pour le type, utilise l'un de ces termes : "Bière", "Vin", "Spiritueux", "Cocktail", "Autre"
            Pour la marque, identifie la marque visible sur l'étiquette/bouteille (ex: "Heineken", "Corona", "Absolut", "Jack Daniel's", etc.)
            Si aucune marque n'est visible ou identifiable, mets "brand": null
            
            Exemple de réponse:
            {"type": "Bière", "brand": "Heineken"}
            {"type": "Spiritueux", "brand": "Jack Daniel's"}
            {"type": "Vin", "brand": null}
            
            Si aucune boisson n'est visible, réponds: {"type": "Autre", "brand": null}`
          },
          {
            inline_data: {
              mime_type: mimeType || "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 100
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Réponse API invalide');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    logger.info('Réponse Gemini brute:', text);
    
    // Parser la réponse JSON
    let drinkInfo;
    try {
      const cleanedText = text.replace(/```json|```/g, '').replace(/\n/g, '').trim();
      drinkInfo = JSON.parse(cleanedText);
      
      // Standardiser le format de réponse
      drinkInfo = {
        type: drinkInfo.type || 'Autre',
        brand: drinkInfo.brand || null
      };
    } catch (parseError) {
      logger.warn('Parsing JSON échoué, fallback:', parseError);
      // Fallback si parsing échoue
      drinkInfo = { type: 'Autre', brand: null };
    }
    
    logger.info('✅ Analyse terminée:', drinkInfo);
    
    return {
      success: true,
      drinkInfo: drinkInfo
    };
    
  } catch (error) {
    logger.error('❌ Erreur analyse image:', error);
    throw new Error(`Erreur analyse: ${error.message}`);
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

// Fonction de réparation pour forcer l'amitié bidirectionnelle
exports.fixFriendship = onCall({
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

    logger.info('🔧 Réparation amitié bidirectionnelle:', {
      userId,
      friendId
    });

    const batch = db.batch();

    // Références des documents à mettre à jour
    const userProfileRef = db.doc(`artifacts/${appId}/users/${userId}/profile/data`);
    const userStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${userId}`);
    const friendProfileRef = db.doc(`artifacts/${appId}/users/${friendId}/profile/data`);
    const friendStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${friendId}`);

    // Forcer l'ajout bidirectionnel (arrayUnion évite les doublons)
    batch.update(userProfileRef, {
      friends: admin.firestore.FieldValue.arrayUnion(friendId)
    });
    
    batch.update(userStatsRef, {
      friends: admin.firestore.FieldValue.arrayUnion(friendId)
    });

    batch.update(friendProfileRef, {
      friends: admin.firestore.FieldValue.arrayUnion(userId)
    });
    
    batch.update(friendStatsRef, {
      friends: admin.firestore.FieldValue.arrayUnion(userId)
    });

    // Exécuter toutes les opérations
    await batch.commit();

    logger.info('✅ Amitié bidirectionnelle réparée');

    return { 
      success: true, 
      message: 'Amitié bidirectionnelle réparée avec succès' 
    };

  } catch (error) {
    logger.error('❌ Erreur réparation amitié:', error);
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
      interactionType,
      authenticatedUser: request.auth.uid,
      content: content
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
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    const { itemId, appId } = request.data;
    const currentUserId = request.auth.uid;
    
    if (!itemId || !appId) {
      throw new Error('Paramètres manquants: itemId et appId requis');
    }

    logger.info('Récupération interactions pour:', {
      itemId,
      userId: currentUserId
    });

    // Récupérer la liste des amis de l'utilisateur connecté
    const userStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${currentUserId}`);
    const userStatsDoc = await userStatsRef.get();
    
    let userFriends = [];
    if (userStatsDoc.exists) {
      userFriends = userStatsDoc.data().friends || [];
    }

    logger.info('Amis de l\'utilisateur:', userFriends);

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

    // Utiliser for...of au lieu de forEach pour permettre await
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const interactionUserId = data.userId;
      
      logger.info(`🔍 Évaluation interaction:`, {
        docId: doc.id,
        interactionUserId,
        currentUserId,
        userFriends,
        isCurrentUser: interactionUserId === currentUserId,
        isFriend: userFriends.includes(interactionUserId),
        interactionType: data.type,
        content: data.content
      });
      
      // Vérifier si l'utilisateur peut voir cette interaction
      // L'utilisateur peut voir :
      // 1. Ses propres interactions
      // 2. Les interactions de ses amis (vérification bidirectionnelle)
      let canSeeInteraction = interactionUserId === currentUserId;
      
      if (!canSeeInteraction && userFriends.includes(interactionUserId)) {
        // Vérifier la bidirectionnalité : est-ce que je suis aussi dans la liste d'amis de l'auteur de l'interaction ?
        try {
          const interactionUserStatsRef = db.collection(`artifacts/${appId}/public_user_stats`).doc(interactionUserId);
          const interactionUserStatsDoc = await interactionUserStatsRef.get();
          
          if (interactionUserStatsDoc.exists) {
            const interactionUserData = interactionUserStatsDoc.data();
            const interactionUserFriends = interactionUserData.friends || [];
            
            // Vérification bidirectionnelle : je suis dans ses amis ET il est dans les miens
            canSeeInteraction = interactionUserFriends.includes(currentUserId);
            
            logger.info(`🔍 Vérification bidirectionnelle pour ${interactionUserId}:`, {
              interactionUserFriends,
              amISInHisFriends: interactionUserFriends.includes(currentUserId),
              isHeInMyFriends: userFriends.includes(interactionUserId),
              finalDecision: canSeeInteraction
            });
          } else {
            logger.info(`⚠️ Stats publiques introuvables pour ${interactionUserId}`);
            canSeeInteraction = false;
          }
        } catch (error) {
          logger.error(`❌ Erreur vérification bidirectionnelle pour ${interactionUserId}:`, error);
          canSeeInteraction = false;
        }
      }

      if (!canSeeInteraction) {
        logger.info(`❌ Interaction filtrée - amitié non bidirectionnelle entre ${interactionUserId} et ${currentUserId}`);
        continue; // Skip cette interaction
      }
      
      logger.info(`✅ Interaction acceptée pour ${interactionUserId}`);

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
    }

    logger.info('Interactions filtrées retournées:', {
      likes: interactions.likes.length,
      congratulations: interactions.congratulations.length,
      comments: interactions.comments.length
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
