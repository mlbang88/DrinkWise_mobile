// Script simple pour ajouter un ami manuellement
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Configuration Firebase (copiez depuis src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBpuJzXf7XhK3QKN8bXQ7Z8Z8Z8Z8Z8Z8Z",
  authDomain: "drinkwise-123456.firebaseapp.com",
  projectId: "drinkwise-123456", 
  storageBucket: "drinkwise-123456.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
  // ⚠️ REMPLACEZ par votre vraie config depuis src/firebase.js
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'my-drinkwise-app'; // ou 'drinkwise' selon votre config

async function addFriendSimple(user1Id, user2Id) {
  console.log(`🤝 Ajout de l'amitié entre ${user1Id} et ${user2Id}`);
  
  try {
    // 1. Récupérer les deux utilisateurs
    const user1StatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user1Id);
    const user2StatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user2Id);
    
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(user1StatsRef),
      getDoc(user2StatsRef)
    ]);
    
    if (!user1Doc.exists() || !user2Doc.exists()) {
      console.error('❌ Un des utilisateurs n\'existe pas');
      return;
    }
    
    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();
    
    console.log(`👤 Utilisateur 1: ${user1Data.username}`);
    console.log(`👤 Utilisateur 2: ${user2Data.username}`);
    
    // 2. Vérifier s'ils sont déjà amis
    const user1Friends = user1Data.friends || [];
    const user2Friends = user2Data.friends || [];
    
    if (user1Friends.includes(user2Id) && user2Friends.includes(user1Id)) {
      console.log('ℹ️ Ils sont déjà amis!');
      return;
    }
    
    // 3. Ajouter aux listes d'amis (public_user_stats)
    if (!user1Friends.includes(user2Id)) {
      await updateDoc(user1StatsRef, {
        friends: arrayUnion(user2Id)
      });
      console.log(`✅ ${user2Data.username} ajouté aux amis de ${user1Data.username}`);
    }
    
    if (!user2Friends.includes(user1Id)) {
      await updateDoc(user2StatsRef, {
        friends: arrayUnion(user1Id)
      });
      console.log(`✅ ${user1Data.username} ajouté aux amis de ${user2Data.username}`);
    }
    
    // 4. Ajouter aux profils privés aussi
    const user1ProfileRef = doc(db, `artifacts/${appId}/users/${user1Id}/profile`);
    const user2ProfileRef = doc(db, `artifacts/${appId}/users/${user2Id}/profile`);
    
    try {
      const user1ProfileDoc = await getDoc(user1ProfileRef);
      if (user1ProfileDoc.exists()) {
        const profileFriends = user1ProfileDoc.data().friends || [];
        if (!profileFriends.includes(user2Id)) {
          await updateDoc(user1ProfileRef, {
            friends: arrayUnion(user2Id)
          });
          console.log(`✅ Profil privé de ${user1Data.username} mis à jour`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Pas de profil privé pour ${user1Data.username}`);
    }
    
    try {
      const user2ProfileDoc = await getDoc(user2ProfileRef);
      if (user2ProfileDoc.exists()) {
        const profileFriends = user2ProfileDoc.data().friends || [];
        if (!profileFriends.includes(user1Id)) {
          await updateDoc(user2ProfileRef, {
            friends: arrayUnion(user1Id)
          });
          console.log(`✅ Profil privé de ${user2Data.username} mis à jour`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Pas de profil privé pour ${user2Data.username}`);
    }
    
    // 5. Supprimer les demandes d'amitié en cours
    const requestsQuery = query(
      collection(db, `artifacts/${appId}/friend_requests`),
      where('from', 'in', [user1Id, user2Id]),
      where('to', 'in', [user1Id, user2Id])
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    
    for (const requestDoc of requestsSnapshot.docs) {
      await deleteDoc(requestDoc.ref);
      console.log(`🗑️ Demande d'amitié supprimée: ${requestDoc.id}`);
    }
    
    console.log(`🎉 Amitié créée avec succès entre ${user1Data.username} et ${user2Data.username}!`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function listAllUsers() {
  console.log('👥 Utilisateurs disponibles:');
  console.log('============================');
  
  const snapshot = await getDocs(collection(db, `artifacts/${appId}/public_user_stats`));
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`📝 ID: ${doc.id}`);
    console.log(`   Username: ${data.username}`);
    console.log(`   Nom: ${data.displayName || 'N/A'}`);
    console.log(`   Amis: ${(data.friends || []).length}`);
    console.log('   ---');
  });
}

// 🚀 UTILISATION:
// 1. Modifiez la firebaseConfig avec vos vraies données
// 2. Remplacez les IDs par les vrais IDs des utilisateurs
// 3. Exécutez: node add-friend-simple.js

async function main() {
  console.log('🤝 Script d\'ajout d\'ami DrinkWise');
  console.log('=================================\n');
  
  // Lister tous les utilisateurs disponibles
  await listAllUsers();
  
  console.log('\n💡 Pour ajouter un ami, décommentez la ligne ci-dessous et remplacez les IDs:');
  console.log('// await addFriendSimple("VOTRE_USER_ID", "USER_ID_DE_VOTRE_AMI");');
  
  // 👇 DÉCOMMENTEZ ET MODIFIEZ CETTE LIGNE AVEC LES VRAIS IDS:
  // await addFriendSimple("YOUR_USER_ID_HERE", "FRIEND_USER_ID_HERE");
}

main().catch(console.error);
