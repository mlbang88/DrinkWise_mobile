const admin = require('firebase-admin');

// Configuration Firebase
const serviceAccount = require('./functions/service-account-key.json'); // Vous devez avoir ce fichier

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const appId = 'my-drinkwise-app';

async function addFriendManually(user1Id, user2Id) {
  console.log(`🤝 Ajout manuel de l'amitié entre ${user1Id} et ${user2Id}`);
  
  try {
    // 1. Vérifier que les deux utilisateurs existent
    const user1StatsRef = db.doc(`artifacts/${appId}/public_user_stats/${user1Id}`);
    const user2StatsRef = db.doc(`artifacts/${appId}/public_user_stats/${user2Id}`);
    
    const [user1Doc, user2Doc] = await Promise.all([
      user1StatsRef.get(),
      user2StatsRef.get()
    ]);
    
    if (!user1Doc.exists()) {
      console.error(`❌ Utilisateur 1 introuvable: ${user1Id}`);
      return false;
    }
    
    if (!user2Doc.exists()) {
      console.error(`❌ Utilisateur 2 introuvable: ${user2Id}`);
      return false;
    }
    
    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();
    
    console.log(`✅ Utilisateur 1: ${user1Data.username} (${user1Id})`);
    console.log(`✅ Utilisateur 2: ${user2Data.username} (${user2Id})`);
    
    // 2. Vérifier s'ils sont déjà amis
    const user1Friends = user1Data.friends || [];
    const user2Friends = user2Data.friends || [];
    
    if (user1Friends.includes(user2Id)) {
      console.log(`ℹ️ ${user1Data.username} a déjà ${user2Data.username} comme ami`);
    } else {
      console.log(`➕ Ajout de ${user2Data.username} aux amis de ${user1Data.username}`);
    }
    
    if (user2Friends.includes(user1Id)) {
      console.log(`ℹ️ ${user2Data.username} a déjà ${user1Data.username} comme ami`);
    } else {
      console.log(`➕ Ajout de ${user1Data.username} aux amis de ${user2Data.username}`);
    }
    
    // 3. Mettre à jour les listes d'amis dans public_user_stats
    const batch = db.batch();
    
    // Ajouter user2 aux amis de user1 (si pas déjà présent)
    if (!user1Friends.includes(user2Id)) {
      batch.update(user1StatsRef, {
        friends: admin.firestore.FieldValue.arrayUnion(user2Id)
      });
    }
    
    // Ajouter user1 aux amis de user2 (si pas déjà présent)
    if (!user2Friends.includes(user1Id)) {
      batch.update(user2StatsRef, {
        friends: admin.firestore.FieldValue.arrayUnion(user1Id)
      });
    }
    
    // 4. Mettre à jour les profils privés aussi
    const user1ProfileRef = db.doc(`artifacts/${appId}/users/${user1Id}/profile`);
    const user2ProfileRef = db.doc(`artifacts/${appId}/users/${user2Id}/profile`);
    
    const [user1ProfileDoc, user2ProfileDoc] = await Promise.all([
      user1ProfileRef.get(),
      user2ProfileRef.get()
    ]);
    
    if (user1ProfileDoc.exists()) {
      const user1ProfileFriends = user1ProfileDoc.data().friends || [];
      if (!user1ProfileFriends.includes(user2Id)) {
        batch.update(user1ProfileRef, {
          friends: admin.firestore.FieldValue.arrayUnion(user2Id)
        });
      }
    }
    
    if (user2ProfileDoc.exists()) {
      const user2ProfileFriends = user2ProfileDoc.data().friends || [];
      if (!user2ProfileFriends.includes(user1Id)) {
        batch.update(user2ProfileRef, {
          friends: admin.firestore.FieldValue.arrayUnion(user1Id)
        });
      }
    }
    
    // 5. Supprimer les demandes d'amitié en cours (si elles existent)
    const requestsSnapshot = await db.collection(`artifacts/${appId}/friend_requests`)
      .where('from', 'in', [user1Id, user2Id])
      .where('to', 'in', [user1Id, user2Id])
      .get();
    
    requestsSnapshot.docs.forEach(doc => {
      console.log(`🗑️ Suppression de la demande d'amitié: ${doc.id}`);
      batch.delete(doc.ref);
    });
    
    // 6. Exécuter toutes les modifications
    await batch.commit();
    
    console.log(`✅ Amitié créée avec succès entre ${user1Data.username} et ${user2Data.username}!`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'ami:', error);
    return false;
  }
}

// Fonction pour lister les utilisateurs disponibles
async function listUsers() {
  console.log('👥 Liste des utilisateurs disponibles:');
  
  const snapshot = await db.collection(`artifacts/${appId}/public_user_stats`).get();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id} - ${data.username} (${data.displayName || 'Pas de nom d\'affichage'})`);
  });
}

// Exemples d'utilisation:
async function main() {
  console.log('🚀 Script d\'ajout manuel d\'amis DrinkWise');
  console.log('=====================================\n');
  
  // Lister tous les utilisateurs
  await listUsers();
  
  console.log('\n💡 Pour ajouter un ami, utilisez:');
  console.log('addFriendManually("USER_ID_1", "USER_ID_2");');
  console.log('\n📝 Remplacez USER_ID_1 et USER_ID_2 par les vrais IDs des utilisateurs\n');
  
  // Exemple (décommentez et modifiez les IDs selon vos besoins):
  // await addFriendManually('VOTRE_USER_ID', 'USER_ID_DE_VOTRE_AMI');
}

// Export des fonctions pour utilisation
module.exports = { addFriendManually, listUsers };

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
