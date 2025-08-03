import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Configuration Firebase (remplacez par votre config)
const firebaseConfig = {
  apiKey: "AIzaSyBvOH7dB5KEQUOl7NJD7OjFbGU3BLAz2L4",
  authDomain: "drinkwise-31d3a.firebaseapp.com",
  projectId: "drinkwise-31d3a",
  storageBucket: "drinkwise-31d3a.firebasestorage.app",
  messagingSenderId: "31736983078",
  appId: "1:31736983078:web:8f22aecd123456789abcdef"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixFriendshipRelationships() {
  try {
    console.log("🔧 Début de la correction des relations d'amitié...");
    
    const currentUserId = 'T4mDJvOVKFPJEzBVr3VuWQPPA2x2';
    const friends = ['ym4XJw2yIBTPA5DdjAo74dpE7kj2', 'jVhudRHcWvXzKQjZeuALPYUyDAG2'];
    
    // Vérifier les stats de l'utilisateur actuel
    const currentUserRef = doc(db, 'public_user_stats', currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    
    if (currentUserDoc.exists()) {
      console.log(`✅ Utilisateur actuel (${currentUserId}):`, currentUserDoc.data());
      console.log(`📋 Liste d'amis actuelle:`, currentUserDoc.data().friends || []);
    }
    
    // Pour chaque ami, vérifier et corriger la relation bidirectionnelle
    for (const friendId of friends) {
      console.log(`\n🔍 Vérification de l'ami: ${friendId}`);
      
      const friendRef = doc(db, 'public_user_stats', friendId);
      const friendDoc = await getDoc(friendRef);
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        console.log(`📊 Données de l'ami:`, friendData);
        
        const friendsList = friendData.friends || [];
        console.log(`👥 Liste d'amis de ${friendId}:`, friendsList);
        
        if (!friendsList.includes(currentUserId)) {
          console.log(`❌ ${friendId} n'a PAS ${currentUserId} dans sa liste d'amis`);
          console.log(`🔄 Ajout de ${currentUserId} à la liste d'amis de ${friendId}...`);
          
          try {
            await updateDoc(friendRef, {
              friends: arrayUnion(currentUserId)
            });
            console.log(`✅ Relation bidirectionnelle créée avec ${friendId}`);
          } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour de ${friendId}:`, error);
          }
        } else {
          console.log(`✅ ${friendId} a déjà ${currentUserId} dans sa liste d'amis`);
        }
      } else {
        console.log(`❌ Document public_user_stats introuvable pour ${friendId}`);
      }
    }
    
    console.log("\n🎉 Correction terminée ! Vérification finale...");
    
    // Vérification finale
    for (const friendId of friends) {
      const friendRef = doc(db, 'public_user_stats', friendId);
      const friendDoc = await getDoc(friendRef);
      
      if (friendDoc.exists()) {
        const friendsList = friendDoc.data().friends || [];
        const isBidirectional = friendsList.includes(currentUserId);
        console.log(`🔍 ${friendId} -> friends: [${friendsList.join(', ')}] - Bidirectionnel: ${isBidirectional ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la correction:", error);
  }
}

// Exécuter le script
fixFriendshipRelationships().then(() => {
  console.log("\n✨ Script terminé. Vous pouvez maintenant tester le fil d'actualité.");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});
