// Script de correction du niveau utilisateur
// À exécuter dans la console du navigateur

const fixUserLevel = async () => {
    try {
        console.log("🔧 Début de la correction du niveau utilisateur...");
        
        // Récupérer les services Firebase depuis le contexte
        const { db, user, appId } = window.firebaseContext || {};
        
        if (!db || !user || !appId) {
            console.error("❌ Services Firebase non disponibles");
            return;
        }
        
        // Importer les modules nécessaires
        const { doc, getDoc, updateDoc } = window.firestore;
        const { levelUtils } = window.levelUtilsModule || {};
        
        if (!levelUtils) {
            console.error("❌ levelUtils non disponible");
            return;
        }
        
        // Récupérer le profil utilisateur
        const userDoc = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        const userSnap = await getDoc(userDoc);
        
        if (!userSnap.exists()) {
            console.error("❌ Profil utilisateur non trouvé");
            return;
        }
        
        const userData = userSnap.data();
        const currentXp = userData.xp || 0;
        const currentLevel = userData.level || 1;
        const correctLevel = levelUtils.calculateLevel(currentXp);
        
        console.log("📊 État actuel:", {
            xp: currentXp,
            levelInDB: currentLevel,
            correctLevel: correctLevel
        });
        
        if (currentLevel !== correctLevel) {
            console.log(`🔄 Correction nécessaire: ${currentLevel} → ${correctLevel}`);
            
            await updateDoc(userDoc, {
                level: correctLevel
            });
            
            console.log("✅ Niveau corrigé avec succès !");
        } else {
            console.log("✅ Niveau déjà correct, aucune action nécessaire");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de la correction:", error);
    }
};

// Exposer la fonction globalement pour pouvoir l'appeler
window.fixUserLevel = fixUserLevel;

console.log("🛠️ Script de correction du niveau chargé. Exécutez 'fixUserLevel()' pour corriger.");
