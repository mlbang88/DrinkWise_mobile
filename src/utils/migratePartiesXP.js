// Script de migration pour ajouter xpEarned aux anciennes parties
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Migre toutes les parties sans xpEarned en leur attribuant l'XP de l'ancien système
 * Ancien calcul simple : 50 XP base + 5 XP par drink
 */
export async function migratePartiesXP(db, appId, userId) {
    console.log('🔄 Début migration XP des parties...');
    
    try {
        const partiesRef = collection(db, `artifacts/${appId}/users/${userId}/parties`);
        const snapshot = await getDocs(partiesRef);
        
        let migratedCount = 0;
        let skippedCount = 0;
        let totalXPAdded = 0;
        
        const updatePromises = [];
        
        snapshot.forEach((docSnapshot) => {
            const party = docSnapshot.data();
            
            // Si la partie a déjà xpEarned, on skip
            if (party.xpEarned !== undefined) {
                skippedCount++;
                return;
            }
            
            // Calcul XP ancien système (simple)
            const baseXP = 50; // XP de base par soirée
            const drinksCount = party.drinks?.length || 0;
            const drinksXP = drinksCount * 5; // 5 XP par drink
            const xpEarned = baseXP + drinksXP;
            
            // Préparer la mise à jour
            const partyRef = doc(db, `artifacts/${appId}/users/${userId}/parties`, docSnapshot.id);
            updatePromises.push(
                updateDoc(partyRef, { xpEarned })
                    .then(() => {
                        console.log(`✅ Partie ${docSnapshot.id}: +${xpEarned} XP`);
                        return xpEarned;
                    })
            );
            
            migratedCount++;
            totalXPAdded += xpEarned;
        });
        
        // Exécuter toutes les mises à jour
        await Promise.all(updatePromises);
        
        console.log('✅ Migration terminée!');
        console.log(`📊 ${migratedCount} parties migrées`);
        console.log(`⏭️ ${skippedCount} parties déjà migrées`);
        console.log(`⚡ ${totalXPAdded} XP total ajouté`);
        
        return {
            success: true,
            migratedCount,
            skippedCount,
            totalXPAdded
        };
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fonction à appeler depuis la console du navigateur
 * Exemple: window.migrateMyXP()
 */
export function setupMigrationHelper(db, appId, userId) {
    window.migrateMyXP = async () => {
        console.log('🚀 Lancement migration XP...');
        const result = await migratePartiesXP(db, appId, userId);
        if (result.success) {
            console.log('🎉 Migration réussie! Rafraîchis la page pour voir les changements.');
        } else {
            console.error('❌ Échec migration:', result.error);
        }
        return result;
    };
    console.log('✅ Helper installé. Tape: window.migrateMyXP()');
}
