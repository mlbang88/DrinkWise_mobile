const admin = require('firebase-admin');
const serviceAccount = require('./drinkwise-31d3a-firebase-adminsdk-pk8k6-96c86c8b84.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const appId = 'my-drinkwise-app';

async function checkFriendships() {
  console.log('🔍 Recherche des liens d\'amitié Vinch/ML...\n');
  
  // 1. Chercher dans public_user_stats pour trouver les IDs
  console.log('=== ÉTAPE 1: Identification des utilisateurs ===');
  const statsSnapshot = await db.collection(`artifacts/${appId}/public_user_stats`).get();
  
  let vinchId = null, mlId = null;
  
  statsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const username = data.username?.toLowerCase();
    
    console.log(`Utilisateur: ${data.username} (ID: ${doc.id})`);
    console.log(`  Amis: [${(data.friends || []).join(', ')}]`);
    
    if (username === 'vinch') {
      vinchId = doc.id;
      console.log('✅ Vinch trouvé - ID:', vinchId);
    }
    if (username === 'ml') {
      mlId = doc.id;
      console.log('✅ ML trouvé - ID:', mlId);
    }
    console.log('');
  });
  
  if (!vinchId || !mlId) {
    console.log('❌ Impossible de trouver les deux utilisateurs');
    return;
  }
  
  console.log('\n=== ÉTAPE 2: Vérification des profils privés ===');
  
  // 2. Vérifier les profils privés
  try {
    const vinchProfile = await db.doc(`artifacts/${appId}/users/${vinchId}/profile/data`).get();
    if (vinchProfile.exists()) {
      console.log('📋 Profil privé Vinch - Amis:', vinchProfile.data().friends || []);
    } else {
      console.log('⚠️ Profil privé Vinch non trouvé');
    }
  } catch (e) {
    console.log('⚠️ Erreur lecture profil Vinch:', e.message);
  }
  
  try {
    const mlProfile = await db.doc(`artifacts/${appId}/users/${mlId}/profile/data`).get();
    if (mlProfile.exists()) {
      console.log('📋 Profil privé ML - Amis:', mlProfile.data().friends || []);
    } else {
      console.log('⚠️ Profil privé ML non trouvé');
    }
  } catch (e) {
    console.log('⚠️ Erreur lecture profil ML:', e.message);
  }
  
  console.log('\n=== ÉTAPE 3: Historique des demandes d\'amitié ===');
  
  // 3. Chercher dans les demandes d'amitié
  const requestsSnapshot = await db.collection(`artifacts/${appId}/friend_requests`).get();
  
  let foundRequests = [];
  requestsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if ((data.from === vinchId && data.to === mlId) || 
        (data.from === mlId && data.to === vinchId)) {
      foundRequests.push({
        id: doc.id,
        from: data.from,
        to: data.to,
        status: data.status,
        timestamp: data.timestamp?.toDate()
      });
    }
  });
  
  if (foundRequests.length > 0) {
    foundRequests.forEach(req => {
      console.log('📨 Demande d\'amitié trouvée:', req);
    });
  } else {
    console.log('🔍 Aucune demande d\'amitié trouvée entre Vinch et ML');
  }
  
  console.log('\n=== ANALYSE BIDIRECTIONNELLE ===');
  
  // Analyse de la bidirectionnalité
  const vinchStats = await db.doc(`artifacts/${appId}/public_user_stats/${vinchId}`).get();
  const mlStats = await db.doc(`artifacts/${appId}/public_user_stats/${mlId}`).get();
  
  const vinchFriends = vinchStats.exists() ? vinchStats.data().friends || [] : [];
  const mlFriends = mlStats.exists() ? mlStats.data().friends || [] : [];
  
  const vinchHasML = vinchFriends.includes(mlId);
  const mlHasVinch = mlFriends.includes(vinchId);
  
  console.log(`Vinch a ML comme ami: ${vinchHasML ? '✅' : '❌'}`);
  console.log(`ML a Vinch comme ami: ${mlHasVinch ? '✅' : '❌'}`);
  console.log(`Amitié bidirectionnelle: ${vinchHasML && mlHasVinch ? '✅ OUI' : '❌ NON'}`);
  
  console.log('\n=== CHEMINS FIREBASE CONSOLE ===');
  console.log('Pour voir directement dans Firebase Console:');
  console.log('1. Stats publiques Vinch:', `artifacts/my-drinkwise-app/public_user_stats/${vinchId}`);
  console.log('2. Stats publiques ML:', `artifacts/my-drinkwise-app/public_user_stats/${mlId}`);
  console.log('3. Profil privé Vinch:', `artifacts/my-drinkwise-app/users/${vinchId}/profile/data`);
  console.log('4. Profil privé ML:', `artifacts/my-drinkwise-app/users/${mlId}/profile/data`);
  console.log('5. Demandes d\'amitié:', `artifacts/my-drinkwise-app/friend_requests`);
}

checkFriendships().catch(console.error);
