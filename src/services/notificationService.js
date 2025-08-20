// Mobile notifications service for DrinkWise
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, getDocs } from 'firebase/firestore';

export class NotificationService {
    constructor() {
        this.notifications = [];
        this.listeners = [];
        this.unsubscribe = null;
        this.isSupported = false;
        this.indexReady = false;
        this.init();
    }

    async init() {
        // Check if notifications are supported
        if ('Notification' in window) {
            this.isSupported = true;
            
            // Request permission if not yet granted
            if (Notification.permission === 'default') {
                await this.requestPermission();
            }
        }
    }

    async requestPermission() {
        if (!this.isSupported) return false;
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    // Check if index is available
    async checkIndex(db, appId, userId) {
        try {
            const notificationsRef = collection(db, `artifacts/${appId}/users/${userId}/notifications`);
            const q = query(
                notificationsRef,
                where('read', '==', false),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            
            await getDocs(q);
            this.indexReady = true;
            console.log('✅ Notifications index available');
            return true;
        } catch (error) {
            if (error.code === 'failed-precondition') {
                console.log('⏳ Notifications index being created...');
                this.indexReady = false;
                return false;
            }
            console.error('❌ Index check error:', error);
            return false;
        }
    }

    // Listen for new notifications for a user
    async startListening(db, appId, userId, functions) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        // Check index availability
        await this.checkIndex(db, appId, userId);

        const notificationsRef = collection(db, `artifacts/${appId}/users/${userId}/notifications`);
        
        let q;
        if (this.indexReady) {
            // Use optimized query with index
            q = query(
                notificationsRef,
                where('read', '==', false),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            console.log('🔔 Using optimized query with index');
        } else {
            // Fallback: get all notifications and filter client-side
            q = query(
                notificationsRef,
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            console.log('🔔 Using fallback without index');
        }

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const notification = { id: change.doc.id, ...change.doc.data() };
                    
                    // If index not ready, filter client-side
                    if (!this.indexReady && notification.read) {
                        return; // Ignore already read notifications
                    }
                    
                    this.handleNewNotification(notification, db, appId, userId);
                }
            });
        });

        console.log('🔔 Notification service started');
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    async handleNewNotification(notification, db, appId, userId) {
        console.log('🔔 Nouvelle notification:', notification);

        // Afficher la notification native si possible
        if (this.isSupported && Notification.permission === 'granted') {
            this.showNativeNotification(notification);
        }

        // Notifier les composants React
        this.notifyListeners(notification);

        // Marquer comme affichée après 1 seconde
        setTimeout(async () => {
            try {
                await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/notifications`, notification.id), {
                    displayed: true,
                    displayedAt: new Date()
                });
            } catch (error) {
                console.error('Erreur mise à jour notification:', error);
            }
        }, 1000);
    }

    showNativeNotification(notification) {
        const { type, data } = notification;
        let title = '';
        let body = '';
        let icon = '🔔';

        switch (type) {
            case 'like':
                title = '❤️ Nouveau J\'aime';
                body = `${data.userName} a aimé votre ${data.itemType === 'party' ? 'soirée' : 'publication'}`;
                icon = '❤️';
                break;
            case 'comment':
                title = '💬 Nouveau Commentaire';
                body = `${data.userName}: "${data.content}"`;
                icon = '💬';
                break;
            case 'friend_request':
                title = '👥 Demande d\'Ami';
                body = `${data.userName} vous a envoyé une demande d'ami`;
                icon = '👥';
                break;
            case 'friend_accepted':
                title = '✅ Ami Accepté';
                body = `${data.userName} a accepté votre demande d'ami`;
                icon = '✅';
                break;
            default:
                title = 'DrinkWise';
                body = notification.message || 'Nouvelle notification';
        }

        const nativeNotification = new Notification(title, {
            body,
            icon: '/icon-192.webp',
            badge: '/icon-96.webp',
            tag: `drinkwise-${notification.id}`,
            requireInteraction: false,
            silent: false
        });

        // Auto-fermer après 5 secondes
        setTimeout(() => {
            nativeNotification.close();
        }, 5000);

        // Gérer le clic sur la notification
        nativeNotification.onclick = () => {
            window.focus();
            nativeNotification.close();
            
            // Naviguer vers la page appropriée si possible
            if (type === 'friend_request') {
                // Rediriger vers la page des amis
                window.location.hash = '#/friends';
            } else if (data.itemId) {
                // Rediriger vers le feed
                window.location.hash = '#/feed';
            }
        };
    }

    // Ajouter un listener pour les composants React
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Supprimer un listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    // Notifier tous les listeners
    notifyListeners(notification) {
        this.listeners.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('Erreur lors de la notification du listener:', error);
            }
        });
    }

    // Marquer une notification comme lue
    async markAsRead(db, appId, userId, notificationId) {
        try {
            await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/notifications`, notificationId), {
                read: true,
                readAt: new Date()
            });
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    }

    // Marquer toutes les notifications comme lues
    async markAllAsRead(db, appId, userId) {
        try {
            const markAllRead = httpsCallable(functions, 'markAllNotificationsAsRead');
            await markAllRead({ userId });
            console.log('✅ Toutes les notifications marquées comme lues');
        } catch (error) {
            console.error('Erreur lors du marquage global:', error);
        }
    }

    // Obtenir le statut des permissions
    getPermissionStatus() {
        if (!this.isSupported) return 'not-supported';
        return Notification.permission;
    }

    isPermissionBlocked() {
        return this.isSupported && Notification.permission === 'denied';
    }

    getPermissionHelp() {
        if (!this.isSupported) {
            return 'Les notifications ne sont pas supportées par ce navigateur.';
        }
        
        switch (Notification.permission) {
            case 'denied':
                return 'Permissions bloquées. Cliquez sur l\'icône 🔒 à côté de l\'URL pour les réactiver.';
            case 'granted':
                return 'Notifications autorisées ✅';
            default:
                return 'Cliquez pour demander les permissions de notification.';
        }
    }

    // Créer une notification in-app personnalisée
    createInAppNotification(notification) {
        const event = new CustomEvent('showInAppNotification', {
            detail: notification
        });
        window.dispatchEvent(event);
    }
}

// Instance singleton
export const notificationService = new NotificationService();
