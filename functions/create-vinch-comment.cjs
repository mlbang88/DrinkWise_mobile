const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drinkwise-31d3a-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function createVinchComment() {
  console.log('🎭 Création d\'un commentaire de Vinch...');
  
  const appId = 'drinkwise-mobile-app'; // Corriger l'appId
  const itemId = 'my-vgf3V1ZIjpXrCzkbpzmI'; // Un post de ML
  const vinchId = 'T4mDJvOVKFPJEzBVr3VuWQPPA2x2';
  
  try {
    // Créer un commentaire de Vinch
    const commentRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const newComment = await commentRef.add({
      itemId: itemId,
      userId: vinchId,
      type: 'comment',
      content: 'Salut ML ! Super soirée mon pote ! 🍻 Comment ça va ?',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Commentaire de Vinch créé avec ID:', newComment.id);
    console.log('🔍 Détails du commentaire:');
    console.log('  - itemId:', itemId);
    console.log('  - userId:', vinchId);
    console.log('  - content: "Salut ML ! Super soirée mon pote ! 🍻 Comment ça va ?"');
    
    console.log('🎯 Maintenant, testez dans l\'app - vous devriez voir ce commentaire !');
    
  } catch (error) {
    console.error('❌ Erreur création commentaire:', error);
  }
  
  process.exit(0);
}

createVinchComment();
