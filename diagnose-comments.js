const admin = require('firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drinkwise-31d3a-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function diagnoseComments() {
  console.log('🔍 DIAGNOSTIC DU SYSTÈME DE COMMENTAIRES');
  console.log('=====================================');
  
  const appId = 'drinkwise-mobile-app';
  
  try {
    // 1. Vérifier les interactions existantes
    console.log('\n📊 1. ÉTAT DES INTERACTIONS:');
    const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const allInteractions = await interactionsRef.get();
    
    console.log(`Total interactions: ${allInteractions.docs.length}`);
    
    // Compter par type
    const stats = { likes: 0, comments: 0, congratulations: 0 };
    const userStats = {};
    
    allInteractions.docs.forEach(doc => {
      const data = doc.data();
      stats[data.type] = (stats[data.type] || 0) + 1;
      
      if (!userStats[data.userId]) {
        userStats[data.userId] = { likes: 0, comments: 0, congratulations: 0 };
      }
      userStats[data.userId][data.type]++;
    });
    
    console.log('Par type:', stats);
    
    // 2. Vérifier les commentaires spécifiquement
    console.log('\n💬 2. COMMENTAIRES DÉTAILLÉS:');
    const comments = await interactionsRef.where('type', '==', 'comment').get();
    
    console.log(`Nombre de commentaires: ${comments.docs.length}`);
    
    comments.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. "${data.content}" par ${data.userId} sur item ${data.itemId}`);
    });
    
    // 3. Vérifier les amis de ML
    console.log('\n👥 3. AMIS DE ML:');
    const mlId = 'x6BFSJJCIbNQ2D6FCIR3W8Hg2vH3';
    const mlStats = await db.doc(`artifacts/${appId}/public_user_stats/${mlId}`).get();
    
    if (mlStats.exists()) {
      const friends = mlStats.data().friends || [];
      console.log(`ML a ${friends.length} amis:`, friends);
      
      // Vérifier si les amis peuvent voir les interactions de ML
      console.log('\n🔐 4. VISIBILITÉ DES INTERACTIONS:');
      
      for (const friendId of friends) {
        const friendStats = await db.doc(`artifacts/${appId}/public_user_stats/${friendId}`).get();
        if (friendStats.exists()) {
          const friendFriends = friendStats.data().friends || [];
          const isBidirectional = friendFriends.includes(mlId);
          console.log(`- ${friendId}: ${isBidirectional ? '✅ Bidirectionnel' : '❌ Unidirectionnel'}`);
        }
      }
    }
    
    // 5. Tester une récupération d'interactions
    console.log('\n🧪 5. TEST RÉCUPÉRATION INTERACTIONS:');
    const testItemId = 'vgf3V1ZIjpXrCzkbpzmI'; // Un exemple d'item
    
    const itemInteractions = await interactionsRef
      .where('itemId', '==', testItemId)
      .get();
    
    console.log(`Interactions pour item ${testItemId}: ${itemInteractions.docs.length}`);
    
    itemInteractions.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.type}: ${data.userId} ${data.content || ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
  
  process.exit(0);
}

diagnoseComments();
