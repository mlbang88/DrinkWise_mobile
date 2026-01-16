// Utilitaire pour vérifier le statut des index Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { logger } from '../utils/logger';

export class IndexChecker {
    static async checkNotificationIndex(db, appId, userId) {
        logger.debug('indexChecker: Checking notification index', { userId });
        
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
            logger.info('indexChecker: Notification index available');
            return true;
            
        } catch (error) {
            if (error.code === 'failed-precondition') {
                logger.debug('indexChecker: Index being created');
                return false;
            }
            logger.error('indexChecker: Index check error', { error: error.message });
            return false;
        }
    }
    
    static async waitForIndex(db, appId, userId, maxAttempts = 10) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            logger.debug('indexChecker: Checking index attempt', { attempt, maxAttempts });
            
            const isReady = await this.checkNotificationIndex(db, appId, userId);
            if (isReady) {
                logger.info('indexChecker: Index ready');
                return true;
            }
            
            // Attendre 10 secondes avant le prochain essai
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        logger.warn('indexChecker: Index not ready after max attempts', { maxAttempts });
        return false;
    }
}

export default IndexChecker;
