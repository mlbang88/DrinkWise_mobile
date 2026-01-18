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
const functions = require('firebase-functions');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const crypto = require('crypto');

// Initialiser Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const EXPECTED_GEMINI_KEY_HASH = '579b2b37ca9f8f76f43f2d432bd3dd63da9c2d87121cc7be0065e40294912708';
let hasLoggedGeminiKey = false;
let hasWarnedGeminiKeyMismatch = false;

function resolveGeminiApiKey() {
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || functions.config()?.gemini?.api_key;

  if (!envKey) {
    throw new Error('Configuration API manquante');
  }

  const keyHash = crypto.createHash('sha256').update(envKey).digest('hex');

  if (!hasLoggedGeminiKey) {
    logger.info(`🔐 Empreinte GEMINI_API_KEY: ${keyHash}`);
    hasLoggedGeminiKey = true;
  }

  if (EXPECTED_GEMINI_KEY_HASH && keyHash !== EXPECTED_GEMINI_KEY_HASH && !hasWarnedGeminiKeyMismatch) {
    logger.warn('⚠️ Clé Gemini inattendue détectée. Vérifiez la configuration déployée.');
    hasWarnedGeminiKeyMismatch = true;
  }

  return envKey;
}

function extractTextFromGeminiResponse(response) {
  let directText = '';

  try {
    if (response && typeof response.text === 'function') {
      directText = (response.text() || '').trim();
    }
  } catch (textError) {
    logger.warn('⚠️ Impossible de lire response.text() depuis Gemini:', textError);
  }

  if (directText) {
    return directText;
  }

  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  const partsText = candidates
    .flatMap((candidate) => Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [])
    .filter((part) => typeof part?.text === 'string')
    .map((part) => part.text)
    .join(' ')
    .trim();

  if (partsText) {
    return partsText;
  }

  const finishReasons = candidates
    .map((candidate) => candidate?.finishReason)
    .filter(Boolean);
  const blockReason = response?.promptFeedback?.blockReason || 'none';

  throw new Error(`Réponse Gemini vide (finishReasons: ${finishReasons.join(', ') || 'none'}, blockReason: ${blockReason})`);
}

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
  cors: corsOptions,
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  try {
    const { partyData, drunkLevel, appId } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier les données requises
    if (!partyData || !appId) {
      throw new Error('Données de soirée manquantes');
    }

    // Construire le prompt pour l'IA
    const totalDrinks = partyData.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0;
    const drinkTypes = partyData.drinks?.map(drink => `${drink.quantity}x ${drink.type || drink.brand}`).join(', ') || 'Aucune boisson';
    
    const prompt = `Génère un résumé amusant et créatif de cette soirée. IMPORTANT: Écris 2-3 phrases COMPLÈTES qui se terminent par un point final.
    
    📊 Données de la soirée:
    🍻 Lieu: ${partyData.location || 'Lieu inconnu'}
    🍺 Boissons: ${drinkTypes} (Total: ${totalDrinks} verres)
    👥 Filles parlées: ${partyData.girlsTalkedTo || 0}
    🤮 Vomissements: ${partyData.vomi || 0}
    👊 Bagarres: ${partyData.fights || 0}
    🔥 Niveau d'alcoolémie: ${drunkLevel || 'Modéré'}
    
    Ton: ${partyData.vomi > 0 ? 'Humoristique sur les excès' : 'Positif et amusant'}
    Style: Comme un ami qui raconte la soirée, avec des emojis.
    
    CONSIGNES:
    - Écris 2 à 3 phrases complètes
    - Termine TOUJOURS par un point final
    - Ne t'arrête PAS au milieu d'une phrase
    - Sois créatif et amusant`;

    // Appeler l'API Gemini
    const result = await callGeminiForText(prompt);
    
    if (!result.success) {
      throw new Error('Erreur lors de la génération du résumé');
    }

    logger.info(`✅ Résumé généré pour l'utilisateur ${request.auth.uid}`);
    
    return { 
      success: true, 
      summary: result.text,
      message: "Résumé généré avec succès" 
    };
    
  } catch (error) {
    logger.error('❌ Erreur generateSummary:', error);
    throw new Error(`Erreur génération résumé: ${error.message}`);
  }
});

// Fonction générique pour appeler Gemini API avec un prompt personnalisé
exports.callGeminiAPI = onCall({
  region: 'us-central1',
  cors: corsOptions,
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  try {
    const { prompt } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier les données requises
    if (!prompt) {
      throw new Error('Prompt manquant');
    }

    // Appeler l'API Gemini
    const result = await callGeminiForText(prompt);
    
    if (!result.success) {
      throw new Error('Erreur lors de la génération du texte');
    }

    logger.info(`✅ Texte généré pour l'utilisateur ${request.auth.uid}`);
    
    return { 
      success: true, 
      text: result.text,
      message: "Texte généré avec succès" 
    };
    
  } catch (error) {
    logger.error('❌ Erreur callGeminiAPI:', error);
    throw new Error(`Erreur génération texte: ${error.message}`);
  }
});

// Fonction helper pour appeler Gemini avec du texte uniquement (SDK officiel)
async function callGeminiForText(prompt) {
  try {
    const GEMINI_API_KEY = resolveGeminiApiKey();

    logger.info('🤖 Appel Gemini pour génération de texte');

    // Initialiser le SDK Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    });

    // Générer le contenu avec le SDK - generationConfig doit être ici!
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // ✅ Augmenté pour éviter coupure des résumés
        stopSequences: []
      }
    });
    const response = result?.response;

    if (!response) {
      throw new Error('Réponse vide de Gemini (response manquant)');
    }

    // Logger le finishReason pour déboguer
    const candidates = response?.candidates || [];
    const finishReason = candidates[0]?.finishReason || 'unknown';
    const safetyRatings = candidates[0]?.safetyRatings || [];
    const citationMetadata = candidates[0]?.citationMetadata || null;
    
    logger.info('📊 Réponse Gemini reçue', {
      finishReason: finishReason,
      candidatesCount: candidates.length,
      safetyRatings: safetyRatings,
      hasCitationMetadata: !!citationMetadata
    });

    // Logger la réponse brute complète pour diagnostic
    logger.info('🔍 Contenu brut candidates[0]', {
      candidate: JSON.stringify(candidates[0])
    });

    const text = extractTextFromGeminiResponse(response);

    logger.info('✅ Génération de texte réussie', {
      length: text.length,
      firstChars: text.substring(0, 50),
      lastChars: text.substring(Math.max(0, text.length - 50)),
      preview: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
      endsWithPunctuation: /[.!?]$/.test(text)
    });

    return {
      success: true,
      text
    };
    
  } catch (error) {
    logger.error('❌ Erreur callGeminiForText:', error);
    
    // Gestion d'erreurs détaillée
    if (error.message.includes('not found') || error.message.includes('404')) {
      logger.error('🔍 Erreur de modèle - Modèle Gemini non trouvé');
    } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
      logger.error('🔍 Erreur requête - Paramètres invalides:', error.message);
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      logger.error('🔍 Erreur permissions - Clé API ou quotas:', error.message);
    } else if (error.message.includes('429')) {
      logger.error('🔍 Erreur quota - Limite de requêtes atteinte:', error.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

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

// Fonction pour analyser une image avec Gemini de manière sécurisée (SDK officiel)
exports.analyzeImageSecure = onCall({
  region: 'us-central1',
  cors: corsOptions,
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  try {
    const { imageBase64, mimeType } = request.data;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Valider et normaliser le type MIME
    const supportedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    let normalizedMimeType = mimeType?.toLowerCase() || 'image/jpeg';
    
    // Convertir les types non supportés vers JPEG
    if (!supportedMimeTypes.includes(normalizedMimeType)) {
      logger.warn(`⚠️ Type MIME non supporté: ${normalizedMimeType}, conversion vers JPEG`);
      normalizedMimeType = 'image/jpeg';
    }
    
    logger.info(`📷 Type MIME utilisé: ${normalizedMimeType}`);
    
    // Clé API stockée de manière sécurisée côté serveur
    const GEMINI_API_KEY = resolveGeminiApiKey();
    
    logger.info('🤖 Analyse d\'image sécurisée pour utilisateur:', request.auth.uid);
    
    // Initialiser le SDK Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Préparer le prompt et l'image
    const prompt = `Analyse cette image et identifie la boisson visible. 
Réponds au format JSON avec les clés "type" et "brand" (marque).

Pour le type, utilise l'un de ces termes : "Bière", "Vin", "Spiritueux", "Cocktail", "Autre"
Pour la marque, identifie la marque visible sur l'étiquette/bouteille (ex: "Heineken", "Corona", "Absolut", "Jack Daniel's", etc.)
Si aucune marque n'est visible ou identifiable, mets "brand": null

Exemple de réponse:
{"type": "Bière", "brand": "Heineken"}
{"type": "Spiritueux", "brand": "Jack Daniel's"}
{"type": "Vin", "brand": null}

Si aucune boisson n'est visible, réponds: {"type": "Autre", "brand": null}`;
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: normalizedMimeType
      }
    };
    
    // Générer le contenu avec le SDK
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    logger.info('✅ Réponse Gemini brute:', text);
    
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
    
    // Afficher les détails de l'erreur pour le débogage
    if (error.message.includes('not found') || error.message.includes('404')) {
      logger.error('🔍 Erreur de modèle - Modèle Gemini non trouvé');
    } else if (error.message.includes('Unsupported MIME type')) {
      logger.error('🔍 Erreur format d\'image - Type MIME non supporté:', error.message);
    } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
      logger.error('🔍 Erreur requête - Paramètres invalides:', error.message);
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      logger.error('🔍 Erreur permissions - Clé API ou quotas:', error.message);
    }
    
    // Fallback gracieux - retourner un résultat par défaut au lieu d'échouer
    logger.warn('🔄 Utilisation du fallback - analyse IA temporairement indisponible');
    return {
      success: true,
      drinkInfo: { 
        type: 'Autre', 
        brand: null,
        note: 'Analyse automatique temporairement indisponible',
        error: error.message
      }
    };
  }
});

// Fonction de débogage pour lister les modèles Gemini disponibles
exports.listGeminiModels = onCall({
  region: 'us-central1',
  cors: corsOptions,
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  try {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const GEMINI_API_KEY = resolveGeminiApiKey();
    
    logger.info('🔍 Listage des modèles Gemini disponibles...');
    
    // Tester différents modèles un par un (nouveaux modèles 2.5 disponibles)
    const modelsToTest = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash', 
      'gemini-pro-vision',
      'gemini-pro'
    ];
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const availableModels = [];
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Essayer une génération de test simple
        const result = await model.generateContent("Test");
        availableModels.push({
          name: modelName,
          status: 'available',
          supportsImages: modelName.includes('pro-vision') || 
                         modelName.includes('1.5') || 
                         modelName.includes('2.0') || 
                         modelName.includes('2.5') ||
                         modelName.includes('flash') ||
                         modelName.includes('pro')
        });
        logger.info(`✅ Modèle disponible: ${modelName}`);
      } catch (error) {
        logger.warn(`❌ Modèle non disponible: ${modelName} - ${error.message}`);
        availableModels.push({
          name: modelName,
          status: 'unavailable',
          error: error.message
        });
      }
    }
    
    logger.info('📋 Résumé des modèles:', availableModels);
    
    return {
      success: true,
      models: availableModels,
      recommendation: availableModels.find(m => m.status === 'available' && m.supportsImages)?.name || 'Aucun modèle vision disponible'
    };
    
  } catch (error) {
    logger.error('❌ Erreur listage modèles:', error);
    return {
      success: false,
      error: error.message
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
      interactionType, // 'like', 'love', 'haha', 'wow', 'sad', 'angry', 'congratulate', 'comment'
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

    } else if (['like', 'love', 'haha', 'wow', 'sad', 'angry', 'congratulate'].includes(interactionType)) {
      // Réactions (like, love, etc.) - Retirer d'abord toutes les anciennes réactions de cet utilisateur
      const existingReactionsQuery = await interactionsRef
        .where('itemId', '==', itemId)
        .where('userId', '==', userId)
        .where('type', 'in', ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'congratulate'])
        .get();

      const batch = db.batch();
      
      // Supprimer toutes les anciennes réactions
      existingReactionsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Vérifier si on toggle la même réaction
      const sameReactionExists = existingReactionsQuery.docs.some(doc => doc.data().type === interactionType);

      if (sameReactionExists) {
        // Toggle off - juste supprimer
        await batch.commit();
        return { 
          success: true, 
          message: 'Réaction retirée',
          action: 'removed'
        };
      } else {
        // Ajouter la nouvelle réaction
        const newReactionRef = interactionsRef.doc();
        batch.set(newReactionRef, {
          itemId,
          itemType,
          ownerId,
          userId,
          type: interactionType,
          timestamp,
          createdAt: new Date()
        });
        await batch.commit();

        return { 
          success: true, 
          message: 'Réaction ajoutée',
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
      comments: [],
      reactions: {
        like: [],
        love: [],
        haha: [],
        wow: [],
        sad: [],
        angry: []
      }
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

      const interactionData = {
        id: doc.id,
        userId: data.userId,
        timestamp: data.timestamp,
        content: data.content
      };

      switch(data.type) {
        case 'like':
          interactions.likes.push(interactionData);
          interactions.reactions.like.push(interactionData);
          break;
        case 'love':
          interactions.reactions.love.push(interactionData);
          break;
        case 'haha':
          interactions.reactions.haha.push(interactionData);
          break;
        case 'wow':
          interactions.reactions.wow.push(interactionData);
          break;
        case 'sad':
          interactions.reactions.sad.push(interactionData);
          break;
        case 'angry':
          interactions.reactions.angry.push(interactionData);
          break;
        case 'congratulate':
          interactions.congratulations.push(interactionData);
          break;
        case 'comment':
          interactions.comments.push(interactionData);
          break;
      }
    }

    logger.info('Interactions filtrées retournées:', {
      likes: interactions.likes.length,
      congratulations: interactions.congratulations.length,
      comments: interactions.comments.length,
      reactions: Object.keys(interactions.reactions).reduce((acc, key) => {
        acc[key] = interactions.reactions[key].length;
        return acc;
      }, {})
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

// Fonction pour marquer toutes les notifications comme lues
exports.markAllNotificationsAsRead = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    const { userId } = request.data;
    const appId = 'drinkwise-mobile-app';
    
    // Vérifier que l'utilisateur peut modifier ses propres notifications
    if (request.auth.uid !== userId) {
      throw new Error('Vous ne pouvez modifier que vos propres notifications');
    }

    // Récupérer toutes les notifications non lues
    const notificationsRef = db.collection(`artifacts/${appId}/users/${userId}/notifications`);
    const unreadSnapshot = await notificationsRef
      .where('read', '==', false)
      .get();

    if (unreadSnapshot.empty) {
      return { success: true, message: 'Aucune notification à marquer' };
    }

    // Marquer toutes comme lues en batch
    const batch = db.batch();
    unreadSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    logger.info(`✅ ${unreadSnapshot.size} notifications marquées comme lues pour ${userId}`);
    
    return { 
      success: true, 
      count: unreadSnapshot.size,
      message: `${unreadSnapshot.size} notifications marquées comme lues` 
    };

  } catch (error) {
    logger.error('❌ Erreur markAllNotificationsAsRead:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

// Fonction pour réparer automatiquement le système d'amis
exports.repairFriendshipSystem = onCall({
  region: 'us-central1',
  cors: corsOptions
}, async (request) => {
  try {
    const { appId } = request.data;
    const userId = request.auth.uid;
    
    // Vérifier l'authentification
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    logger.info(`🔧 Réparation du système d'amis pour l'utilisateur ${userId}`);

    const repairResults = {
      userFixed: false,
      friendsFixed: 0,
      errors: []
    };

    // 1. Récupérer les données actuelles de l'utilisateur
    const userStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${userId}`);
    const userDoc = await userStatsRef.get();
    
    if (!userDoc.exists()) {
      throw new Error('Profil utilisateur introuvable');
    }

    const userData = userDoc.data();
    const userFriends = userData.friends || [];
    
    logger.info(`👤 Utilisateur ${userData.username} a ${userFriends.length} amis: [${userFriends.join(', ')}]`);

    // 2. Vérifier chaque ami et réparer les relations bidirectionnelles
    for (const friendId of userFriends) {
      try {
        const friendStatsRef = db.doc(`artifacts/${appId}/public_user_stats/${friendId}`);
        const friendDoc = await friendStatsRef.get();
        
        if (!friendDoc.exists()) {
          logger.warn(`⚠️ Ami ${friendId} n'existe plus, nettoyage nécessaire`);
          // Retirer cet ami inexistant de ma liste
          await userStatsRef.update({
            friends: admin.firestore.FieldValue.arrayRemove(friendId)
          });
          repairResults.friendsFixed++;
          continue;
        }

        const friendData = friendDoc.data();
        const friendFriends = friendData.friends || [];
        
        // Vérifier si la relation est bidirectionnelle
        if (!friendFriends.includes(userId)) {
          logger.info(`🔄 Réparation: Ajout de ${userId} à la liste d'amis de ${friendData.username}`);
          
          await friendStatsRef.update({
            friends: admin.firestore.FieldValue.arrayUnion(userId)
          });
          
          repairResults.friendsFixed++;
        } else {
          logger.info(`✅ Relation OK avec ${friendData.username}`);
        }
        
      } catch (error) {
        logger.error(`❌ Erreur lors de la réparation de l'ami ${friendId}:`, error);
        repairResults.errors.push(`Erreur avec ${friendId}: ${error.message}`);
      }
    }

    // 3. Vérifier et corriger le niveau de l'utilisateur
    const userProfileRef = db.doc(`artifacts/${appId}/users/${userId}/profile/data`);
    const userProfileDoc = await userProfileRef.get();
    
    if (userProfileDoc.exists()) {
      const profileData = userProfileDoc.data();
      const currentXp = profileData.xp || 0;
      const currentLevel = profileData.level || 1;
      
      // Calcul simple du niveau basé sur l'XP (100 XP par niveau)
      const correctLevel = Math.floor(currentXp / 100) + 1;
      
      if (currentLevel !== correctLevel) {
        logger.info(`🔄 Correction niveau: ${currentLevel} → ${correctLevel} (XP: ${currentXp})`);
        
        await userProfileRef.update({
          level: correctLevel
        });
        
        repairResults.userFixed = true;
      }
    }

    logger.info(`✅ Réparation terminée:`, repairResults);
    
    return {
      success: true,
      message: `Réparation terminée - ${repairResults.friendsFixed} amis corrigés`,
      results: repairResults
    };
    
  } catch (error) {
    logger.error('❌ Erreur réparation système d\'amis:', error);
    throw new Error(`Erreur réparation: ${error.message}`);
  }
});

// Fonction de test pour vérifier le fonctionnement
exports.helloWorld = onRequest((request, response) => {
  corsHandler(request, response, () => {
    logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
  });
});

// ============================================
// NOTIFICATIONS PUSH
// ============================================

/**
 * Envoie une notification push à un utilisateur
 */
exports.sendPushNotification = onCall(async (request) => {
  try {
    const { userId, appId, title, body, data } = request.data;

    if (!userId || !appId || !title || !body) {
      throw new Error('Paramètres manquants');
    }

    // Récupérer le token FCM de l'utilisateur
    const userDoc = await db.collection(`artifacts/${appId}/users`).doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('Utilisateur non trouvé');
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      logger.warn(`⚠️ Pas de FCM token pour ${userId}`);
      return { success: false, error: 'No FCM token' };
    }

    if (!userData.pushNotificationsEnabled) {
      logger.warn(`⚠️ Notifications désactivées pour ${userId}`);
      return { success: false, error: 'Notifications disabled' };
    }

    // Construire le message
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          color: '#8b5cf6',
          icon: 'notification_icon'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Envoyer la notification
    const response = await admin.messaging().send(message);
    logger.info(`✅ Notification envoyée à ${userId}:`, response);

    return { success: true, messageId: response };

  } catch (error) {
    logger.error('❌ Erreur envoi notification push:', error);
    throw new Error(`Erreur envoi notification: ${error.message}`);
  }
});

/**
 * Notification automatique : Territoire perdu
 * Déclenché quand un venueControl change de propriétaire
 */
exports.onTerritoryLost = onDocumentUpdated('artifacts/{appId}/venueControls/{venueId}', async (event) => {
  try {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Vérifier si le contrôleur a changé
    if (before.userId !== after.userId) {
      const previousOwnerId = before.userId;
      const newOwnerId = after.userId;
      const venueName = after.venueName;
      const appId = event.params.appId;

      logger.info(`🏴 Territoire perdu: ${venueName} (${previousOwnerId} → ${newOwnerId})`);

      // Envoyer notification au propriétaire précédent
      await admin.messaging().sendToCondition(
        `userId == '${previousOwnerId}'`,
        {
          notification: {
            title: '🏴 Territoire perdu !',
            body: `${venueName} a été conquis par ${after.username || 'un rival'}`
          },
          data: {
            type: 'territory_lost',
            venueId: event.params.venueId,
            venueName: venueName,
            newOwnerId: newOwnerId
          }
        }
      );

      logger.info(`✅ Notification territoire perdu envoyée à ${previousOwnerId}`);
    }

  } catch (error) {
    logger.error('❌ Erreur notification territoire perdu:', error);
  }
});

/**
 * Notification : Achievement débloqué
 */
exports.sendAchievementNotification = onCall(async (request) => {
  try {
    const { userId, appId, achievementName, achievementDescription, achievementIcon } = request.data;

    await admin.messaging().sendToCondition(
      `userId == '${userId}'`,
      {
        notification: {
          title: `${achievementIcon} Achievement débloqué !`,
          body: `${achievementName}: ${achievementDescription}`
        },
        data: {
          type: 'achievement_unlocked',
          achievementName
        }
      }
    );

    logger.info(`✅ Notification achievement envoyée à ${userId}: ${achievementName}`);

    return { success: true };

  } catch (error) {
    logger.error('❌ Erreur notification achievement:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

/**
 * Notification : Rival à proximité
 */
exports.sendRivalNearbyNotification = onCall(async (request) => {
  try {
    const { userId, appId, rivalName, venueName, distance } = request.data;

    await admin.messaging().sendToCondition(
      `userId == '${userId}'`,
      {
        notification: {
          title: '⚔️ Rival à proximité !',
          body: `${rivalName} est à ${distance}m de ${venueName}`
        },
        data: {
          type: 'rival_nearby',
          rivalName,
          venueName,
          distance: String(distance)
        }
      }
    );

    logger.info(`✅ Notification rival proche envoyée à ${userId}`);

    return { success: true };

  } catch (error) {
    logger.error('❌ Erreur notification rival:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

/**
 * Notification : Battle démarrée
 */
exports.sendBattleStartedNotification = onCall(async (request) => {
  try {
    const { userIds, battleId, venueName } = request.data;

    for (const userId of userIds) {
      await admin.messaging().sendToCondition(
        `userId == '${userId}'`,
        {
          notification: {
            title: '⚔️ Bataille démarrée !',
            body: `Une bataille a commencé à ${venueName}`
          },
          data: {
            type: 'battle_started',
            battleId,
            venueName,
            urgent: 'true'
          }
        }
      );
    }

    logger.info(`✅ Notifications bataille envoyées à ${userIds.length} utilisateurs`);

    return { success: true };

  } catch (error) {
    logger.error('❌ Erreur notification bataille:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

/**
 * Notification : Zone contrôlée
 */
exports.sendZoneControlledNotification = onCall(async (request) => {
  try {
    const { userId, zoneName, zoneType } = request.data;

    const zoneIcon = zoneType === 'street' ? '🏙️' : '🗺️';
    const zoneLabel = zoneType === 'street' ? 'rue' : 'quartier';

    await admin.messaging().sendToCondition(
      `userId == '${userId}'`,
      {
        notification: {
          title: `${zoneIcon} Roi de ${zoneName} !`,
          body: `Vous contrôlez maintenant cette ${zoneLabel}`
        },
        data: {
          type: 'zone_controlled',
          zoneName,
          zoneType
        }
      }
    );

    logger.info(`✅ Notification zone contrôlée envoyée à ${userId}: ${zoneName}`);

    return { success: true };

  } catch (error) {
    logger.error('❌ Erreur notification zone:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
});

/**
 * ========================================
 * BATTLE NOTIFICATIONS
 * ========================================
 */

/**
 * Notification : Bataille démarrée
 * Envoie une notification à tous les participants quand une bataille commence
 */
exports.onBattleStarted = onDocumentCreated('artifacts/{appId}/battles/{battleId}', async (event) => {
  try {
    const battleData = event.data.data();
    const { participants, venueName, battleId } = battleData;

    logger.info(`⚔️ Bataille démarrée: ${battleId} au ${venueName}`);

    // Envoyer notification à chaque participant
    const notificationPromises = participants.map(async (participant) => {
      try {
        // Récupérer le FCM token de l'utilisateur
        const userDoc = await db.collection('users').doc(participant.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
          logger.warn(`⚠️ Pas de FCM token pour ${participant.userId}`);
          return null;
        }

        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: '⚔️ Bataille commencée !',
            body: `Affrontez vos rivaux au ${venueName}`
          },
          data: {
            type: 'battle_started',
            battleId,
            venueName,
            participantCount: participants.length.toString()
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'battles'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        });

        logger.info(`✅ Notification bataille envoyée à ${participant.username}`);
        return true;

      } catch (error) {
        logger.error(`❌ Erreur notification pour ${participant.userId}:`, error);
        return null;
      }
    });

    await Promise.all(notificationPromises);

    logger.info(`✅ Notifications de bataille envoyées à ${participants.length} participants`);

  } catch (error) {
    logger.error('❌ Erreur onBattleStarted:', error);
  }
});

/**
 * Notification : Bataille terminée
 * Notifie tous les participants des résultats quand une bataille se termine
 */
exports.onBattleEnded = onDocumentUpdated('artifacts/{appId}/battles/{battleId}', async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Ne traiter que si le statut passe de 'active' à 'completed'
    if (beforeData.status !== 'active' || afterData.status !== 'completed') {
      return;
    }

    const { participants, scores, winner, venueName, battleId } = afterData;

    logger.info(`🏆 Bataille terminée: ${battleId} au ${venueName}`);

    // Calculer le classement
    const rankings = Object.entries(scores)
      .map(([userId, scoreData]) => ({
        userId,
        username: participants.find(p => p.userId === userId)?.username,
        score: scoreData.score,
        drinks: scoreData.drinks
      }))
      .sort((a, b) => b.score - a.score);

    // Envoyer notification à chaque participant
    const notificationPromises = participants.map(async (participant, index) => {
      try {
        const userDoc = await db.collection('users').doc(participant.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
          logger.warn(`⚠️ Pas de FCM token pour ${participant.userId}`);
          return null;
        }

        const isWinner = participant.userId === winner;
        const userRanking = rankings.findIndex(r => r.userId === participant.userId) + 1;
        const userScore = scores[participant.userId]?.score || 0;

        const title = isWinner ? '🏆 Victoire !' : '⚔️ Bataille terminée';
        const body = isWinner
          ? `Vous avez gagné la bataille au ${venueName} ! 🎉`
          : `Classement: #${userRanking} avec ${userScore} points`;

        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title,
            body
          },
          data: {
            type: 'battle_ended',
            battleId,
            venueName,
            isWinner: isWinner.toString(),
            rank: userRanking.toString(),
            score: userScore.toString()
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'battles'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        });

        logger.info(`✅ Notification résultat envoyée à ${participant.username} (rank: ${userRanking})`);
        return true;

      } catch (error) {
        logger.error(`❌ Erreur notification pour ${participant.userId}:`, error);
        return null;
      }
    });

    await Promise.all(notificationPromises);

    logger.info(`✅ Notifications de résultats envoyées à ${participants.length} participants`);

  } catch (error) {
    logger.error('❌ Erreur onBattleEnded:', error);
  }
});

/**
 * Notification : Score de bataille mis à jour
 * Envoie une notification quand un joueur prend la tête
 */
exports.onBattleScoreUpdate = onDocumentUpdated('artifacts/{appId}/battles/{battleId}', async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Ne traiter que les batailles actives
    if (afterData.status !== 'active') {
      return;
    }

    const { participants, scores, venueName } = afterData;

    // Déterminer l'ancien et le nouveau leader
    const getLeader = (scoresObj) => {
      const entries = Object.entries(scoresObj);
      if (entries.length === 0) return null;
      return entries.reduce((max, curr) => curr[1].score > max[1].score ? curr : max)[0];
    };

    const oldLeader = getLeader(beforeData.scores);
    const newLeader = getLeader(scores);

    // Si changement de leader
    if (oldLeader && newLeader && oldLeader !== newLeader) {
      logger.info(`👑 Nouveau leader: ${newLeader} (était ${oldLeader})`);

      const newLeaderData = participants.find(p => p.userId === newLeader);
      const newLeaderScore = scores[newLeader]?.score || 0;

      // Notifier tous les autres participants
      const notificationPromises = participants
        .filter(p => p.userId !== newLeader)
        .map(async (participant) => {
          try {
            const userDoc = await db.collection('users').doc(participant.userId).get();
            const fcmToken = userDoc.data()?.fcmToken;

            if (!fcmToken) return null;

            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: '👑 Nouveau leader !',
                body: `${newLeaderData.username} prend la tête avec ${newLeaderScore} points`
              },
              data: {
                type: 'battle_leader_change',
                battleId: afterData.battleId,
                newLeader: newLeader,
                newLeaderScore: newLeaderScore.toString()
              },
              android: {
                priority: 'default',
                notification: {
                  sound: 'default',
                  channelId: 'battles'
                }
              }
            });

            return true;

          } catch (error) {
            logger.error(`❌ Erreur notification leader pour ${participant.userId}:`, error);
            return null;
          }
        });

      await Promise.all(notificationPromises);
    }

  } catch (error) {
    logger.error('❌ Erreur onBattleScoreUpdate:', error);
  }
});

// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// Configuration globale
setGlobalOptions({ maxInstances: 10 });
