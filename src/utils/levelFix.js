// Correctif manuel pour le niveau utilisateur
// À ajouter temporairement dans HomePage.jsx pour correction immédiate

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { calculateLevel } from '../utils/levelUtils';
import { logger } from './logger.js';

export const fixUserLevelManually = async (db, user, appId, setMessageBox) => {
    try {
        logger.info('LEVEL', 'Correction manuelle du niveau...');
        
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        const userSnap = await getDoc(userProfileRef);
        
        if (!userSnap.exists()) {
            logger.error('LEVEL', 'Profil utilisateur non trouvé');
            return;
        }
        
        const userData = userSnap.data();
        const currentXp = userData.xp || 0;
        const currentLevel = userData.level || 1;
        const correctLevel = calculateLevel(currentXp);
        
        logger.info('LEVEL', 'État actuel', {
            xp: currentXp,
            levelInDB: currentLevel,
            correctLevel: correctLevel
        });
        
        if (currentLevel !== correctLevel) {
            logger.info('LEVEL', `Correction: ${currentLevel} → ${correctLevel}`);
            
            await updateDoc(userProfileRef, {
                level: correctLevel
            });
            
            setMessageBox?.({
                message: `Niveau corrigé: ${currentLevel} → ${correctLevel}`,
                type: 'success'
            });
            
            logger.info('LEVEL', 'Niveau corrigé avec succès !');
        } else {
            setMessageBox?.({
                message: "Niveau déjà correct",
                type: 'info'
            });
            logger.info('LEVEL', 'Niveau déjà correct');
        }
        
    } catch (error) {
        logger.error('LEVEL', 'Erreur lors de la correction', error);
        setMessageBox?.({
            message: "Erreur lors de la correction du niveau",
            type: 'error'
        });
    }
};

