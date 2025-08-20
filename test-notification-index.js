// Script de test pour les notifications après déploiement de l'index
const admin = require('firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drinkwise-31d3a-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function testNotificationIndex() {
  console.log('🧪 TEST DE L\'INDEX NOTIFICATIONS');
  console.log('================================');
  
  const appId = 'drinkwise-mobile-app';
  const testUserId = 'x6BFSJJCIbNQ2D6FCIR3W8Hg2vH3'; // ML
  
  try {
    // 1. Créer une notification de test
    console.log('\n📝 1. Création d\'une notification de test...');
    const testNotification = {
      type: 'like',
      title: '❤️ Test Like',
      body: 'TestUser a aimé votre soirée',
      data: {
        userName: 'TestUser',
        itemType: 'party',
        itemId: 'test-party-123'
      },
      read: false,
      timestamp: admin.firestore.Timestamp.now(),
      userId: 'test-user-456'
    };
    
    const notificationRef = await db
      .collection(`artifacts/${appId}/users/${testUserId}/notifications`)
      .add(testNotification);
    
    console.log(`✅ Notification créée avec ID: ${notificationRef.id}`);
    
    // 2. Tester la requête avec index
    console.log('\n🔍 2. Test de la requête avec index...');
    try {
      const query = db
        .collection(`artifacts/${appId}/users/${testUserId}/notifications`)
        .where('read', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(5);
      
      const snapshot = await query.get();
      console.log(`✅ Requête réussie ! ${snapshot.docs.length} notifications trouvées`);
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.type}: ${data.title}`);
      });
      
    } catch (error) {
      if (error.code === 9) {
        console.log('⏳ Index encore en cours de création...');
        console.log('   URL pour créer l\'index:', error.message.match(/https:\/\/[^\s]+/)?.[0]);
      } else {
        console.error('❌ Erreur requête:', error);
      }
    }
    
    // 3. Tester la requête fallback (sans index)
    console.log('\n🔄 3. Test de la requête fallback...');
    try {
      const fallbackQuery = db
        .collection(`artifacts/${appId}/users/${testUserId}/notifications`)
        .orderBy('timestamp', 'desc')
        .limit(10);
      
      const fallbackSnapshot = await fallbackQuery.get();
      console.log(`✅ Requête fallback réussie ! ${fallbackSnapshot.docs.length} notifications`);
      
      const unreadCount = fallbackSnapshot.docs.filter(doc => !doc.data().read).length;
      console.log(`   ${unreadCount} notifications non lues (filtrage côté client)`);
      
    } catch (error) {
      console.error('❌ Erreur requête fallback:', error);
    }
    
    // 4. Nettoyer la notification de test
    console.log('\n🧹 4. Nettoyage...');
    await notificationRef.delete();
    console.log('✅ Notification de test supprimée');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
  
  process.exit(0);
}

testNotificationIndex();
