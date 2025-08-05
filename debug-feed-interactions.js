const admin = require('firebase-admin');

// Initialiser Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const appId = 'drinkwise-mobile-app';

async function debugFeedInteractions() {
  try {
    console.log('🔍 ANALYSE DES INTERACTIONS DANS LA BASE DE DONNÉES');
    console.log('================================================');
    
    // Récupérer toutes les interactions
    const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const snapshot = await interactionsRef.orderBy('timestamp', 'desc').limit(20).get();
    
    console.log(`📊 Nombre total d'interactions récentes: ${snapshot.docs.length}`);
    console.log('');
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || 'No timestamp';
      
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   UserId: ${data.userId}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   ItemId: ${data.itemId}`);
      console.log(`   Content: ${data.content || 'N/A'}`);
      console.log(`   OwnerId: ${data.ownerId}`);
      console.log(`   Timestamp: ${timestamp}`);
      console.log('   ---');
    });
    
    console.log('');
    console.log('🔍 STATISTIQUES PAR UTILISATEUR:');
    
    const userStats = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!userStats[data.userId]) {
        userStats[data.userId] = { likes: 0, comments: 0, congratulations: 0 };
      }
      userStats[data.userId][data.type]++;
    });
    
    Object.keys(userStats).forEach(userId => {
      const stats = userStats[userId];
      const isML = userId === 'ym4XJw2yIBTPA5DdjAo74dpE7kj2';
      const isVinch = userId === 'T4mDJvOVKFPJEzBVr3VuWQPPA2x2';
      const userLabel = isML ? '(ML)' : isVinch ? '(Vinch)' : '(Autre)';
      
      console.log(`${userId} ${userLabel}:`);
      console.log(`  - Likes: ${stats.likes}`);
      console.log(`  - Comments: ${stats.comments}`);
      console.log(`  - Congratulations: ${stats.congratulations}`);
    });
    
    console.log('');
    console.log('🔍 RECHERCHE SPÉCIFIQUE COMMENTAIRES DE VINCH:');
    
    const vinchComments = await interactionsRef
      .where('userId', '==', 'T4mDJvOVKFPJEzBVr3VuWQPPA2x2')
      .where('type', '==', 'comment')
      .get();
      
    console.log(`📝 Commentaires de Vinch trouvés: ${vinchComments.docs.length}`);
    
    vinchComments.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. "${data.content}" sur item ${data.itemId}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

debugFeedInteractions();
