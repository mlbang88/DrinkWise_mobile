/**
 * Script pour ajouter les coordonnées manquantes dans venueControls
 * À exécuter une seule fois pour corriger les données existantes
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCuBHlPBTMl-3LNfPgI8mPYZHBRJhN5U20",
    authDomain: "drinkwise-31d3a.firebaseapp.com",
    projectId: "drinkwise-31d3a",
    storageBucket: "drinkwise-31d3a.firebasestorage.app",
    messagingSenderId: "945517157816",
    appId: "1:945517157816:web:f16e52c62e651fa29e20b2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'drinkwise';

async function fixVenueControls() {
    console.log('🔧 Début de la correction des venueControls...');
    
    try {
        // Récupérer tous les venueControls
        const controlsRef = collection(db, `artifacts/${appId}/venueControls`);
        const controlsSnap = await getDocs(controlsRef);
        
        console.log(`📊 ${controlsSnap.size} documents venueControls trouvés`);
        
        let updated = 0;
        let skipped = 0;
        
        for (const controlDoc of controlsSnap.docs) {
            const controlData = controlDoc.data();
            
            // Si les coordonnées existent déjà, passer
            if (controlData.coordinates) {
                skipped++;
                continue;
            }
            
            // Récupérer les infos du lieu depuis venues
            const venueRef = doc(db, `artifacts/${appId}/venues`, controlData.placeId);
            const venueSnap = await getDoc(venueRef);
            
            if (!venueSnap.exists()) {
                console.warn(`⚠️ Lieu ${controlData.placeId} non trouvé dans venues`);
                continue;
            }
            
            const venueData = venueSnap.data();
            
            // Mettre à jour avec les coordonnées et l'adresse
            await updateDoc(doc(db, `artifacts/${appId}/venueControls`, controlDoc.id), {
                coordinates: venueData.coordinates,
                venueAddress: venueData.address
            });
            
            console.log(`✅ Mis à jour: ${controlData.venueName}`);
            updated++;
        }
        
        console.log(`\n🎉 Terminé!`);
        console.log(`   - ${updated} documents mis à jour`);
        console.log(`   - ${skipped} documents déjà à jour`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Exécuter
fixVenueControls()
    .then(() => {
        console.log('\n✨ Script terminé avec succès');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Erreur fatale:', error);
        process.exit(1);
    });
