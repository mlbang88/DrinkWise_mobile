// Utilitaire pour vérifier le statut des index Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export class IndexChecker {
    static async checkNotificationIndex(db, appId, userId) {
        console.log('🔍 Vérification de l\'index notifications...');
        
        try {
            // Tenter la requête avec l'index
            const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
            
            const notificationsRef = collection(db, `artifacts/${appId}/users/${userId}/notifications`);
            const q = query(
                notificationsRef,
                where('read', '==', false),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            
            await getDocs(q);
            console.log('✅ Index notifications disponible');
            return true;
            
        } catch (error) {
            if (error.code === 'failed-precondition') {
                console.log('⏳ Index notifications en cours de création...');
                return false;
            }
            console.error('❌ Erreur vérification index:', error);
            return false;
        }
    }
    
    static async waitForIndex(db, appId, userId, maxAttempts = 10) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 Tentative ${attempt}/${maxAttempts} de vérification de l'index...`);
            
            const isReady = await this.checkNotificationIndex(db, appId, userId);
            if (isReady) {
                console.log('✅ Index prêt !');
                return true;
            }
            
            // Attendre 10 secondes avant le prochain essai
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        console.log('⚠️ Index toujours pas prêt après 10 tentatives');
        return false;
    }
}

export default IndexChecker;
