// Test pour ajouter des badges à une soirée existante
import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';

const testAddBadgesToParty = async () => {
    console.log("🧪 Test: Ajout de badges à une soirée");
    
    // Récupérer une soirée existante
    const partiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
    const partiesSnapshot = await getDocs(partiesRef);
    
    if (partiesSnapshot.empty) {
        console.log("❌ Aucune soirée trouvée");
        return;
    }
    
    const firstParty = partiesSnapshot.docs[0];
    const partyId = firstParty.id;
    const partyData = firstParty.data();
    
    console.log("📋 Soirée sélectionnée:", { partyId, partyData });
    
    // Ajouter des badges de test
    const testBadges = ['first_party', 'drinks_1'];
    
    const partyDoc = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyId);
    await updateDoc(partyDoc, {
        unlockedBadges: testBadges
    });
    
    console.log("✅ Badges de test ajoutés à la soirée:", testBadges);
    
    // Vérifier la mise à jour
    const updatedParty = await getDoc(partyDoc);
    console.log("🔍 Soirée mise à jour:", updatedParty.data());
};

// Pour exécuter le test, décommentez et appelez cette fonction dans la console
// testAddBadgesToParty();
