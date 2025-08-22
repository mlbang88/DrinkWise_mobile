// Correctif manuel pour le niveau utilisateur
// À ajouter temporairement dans HomePage.jsx pour correction immédiate

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { levelUtils } from '../utils/levelUtils';

export const fixUserLevelManually = async (db, user, appId, setMessageBox) => {
    try {
        console.log("🔧 Correction manuelle du niveau...");
        
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        const userSnap = await getDoc(userProfileRef);
        
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
            console.log(`🔄 Correction: ${currentLevel} → ${correctLevel}`);
            
            await updateDoc(userProfileRef, {
                level: correctLevel
            });
            
            setMessageBox?.({
                message: `Niveau corrigé: ${currentLevel} → ${correctLevel}`,
                type: 'success'
            });
            
            console.log("✅ Niveau corrigé avec succès !");
        } else {
            setMessageBox?.({
                message: "Niveau déjà correct",
                type: 'info'
            });
            console.log("✅ Niveau déjà correct");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de la correction:", error);
        setMessageBox?.({
            message: "Erreur lors de la correction du niveau",
            type: 'error'
        });
    }
};
