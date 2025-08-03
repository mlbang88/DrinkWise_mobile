// Script de debug pour vérifier les relations d'amitié
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Remplacez par votre config Firebase
  // Vous pouvez la trouver dans src/firebase.js
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugFriendships() {
  const appId = 'drinkwise';
  const currentUserId = 'your-user-id'; // Remplacez par votre ID utilisateur
  
  try {
    // Récupérer les stats publiques de l'utilisateur actuel
    const currentUserStats = await getDoc(doc(db, `artifacts/${appId}/public_user_stats/${currentUserId}`));
    console.log('Mes stats publiques:', currentUserStats.data());
    
    if (currentUserStats.exists()) {
      const myFriends = currentUserStats.data().friends || [];
      console.log('Mes amis:', myFriends);
      
      for (const friendId of myFriends) {
        // Récupérer les stats publiques de chaque ami
        const friendStats = await getDoc(doc(db, `artifacts/${appId}/public_user_stats/${friendId}`));
        if (friendStats.exists()) {
          const friendData = friendStats.data();
          console.log(`Ami ${friendId}:`, friendData);
          console.log(`Est-ce que ${friendId} m'a comme ami?`, friendData.friends?.includes(currentUserId));
        }
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

debugFriendships();
