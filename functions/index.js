/**
 * Fonctions Cloud Firebase pour DrinkWise
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require('cors');

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
