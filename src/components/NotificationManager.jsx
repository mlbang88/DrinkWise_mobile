import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { notificationService } from '../services/notificationService';
import NotificationContainer from './NotificationContainer';

const NotificationManager = () => {
    const { db, user, appId, functions } = useContext(FirebaseContext);
    const [activeNotifications, setActiveNotifications] = useState([]);
    const [permissionStatus, setPermissionStatus] = useState('default');

    useEffect(() => {
        if (!user || !db) return;

        // Vérifier le statut des permissions
        setPermissionStatus(notificationService.getPermissionStatus());

        // Demander la permission si nécessaire
        if (notificationService.getPermissionStatus() === 'default') {
            notificationService.requestPermission().then((granted) => {
                setPermissionStatus(granted ? 'granted' : 'denied');
                if (granted) {
                    console.log('✅ Permissions de notification accordées');
                }
            });
        }

        // Démarrer l'écoute des notifications
        notificationService.startListening(db, appId, user.uid, functions);

        // Ajouter le listener pour les notifications in-app
        const handleNewNotification = (notification) => {
            console.log('🔔 Affichage notification in-app:', notification);
            
            // Ajouter à la liste des notifications actives (max 3)
            setActiveNotifications(prev => {
                // Éviter les doublons
                const exists = prev.find(n => n.id === notification.id);
                if (exists) return prev;
                
                // Garder seulement les 3 dernières
                const newNotifications = [notification, ...prev];
                return newNotifications.slice(0, 3);
            });
        };

        notificationService.addListener(handleNewNotification);

        // Écouter les événements personnalisés pour les notifications in-app
        const handleInAppNotification = (event) => {
            handleNewNotification(event.detail);
        };

        window.addEventListener('showInAppNotification', handleInAppNotification);

        return () => {
            notificationService.stopListening();
            notificationService.removeListener(handleNewNotification);
            window.removeEventListener('showInAppNotification', handleInAppNotification);
        };
    }, [user, db, appId, functions]);

    const handleCloseNotification = (notificationId) => {
        setActiveNotifications(prev => 
            prev.filter(n => n.id !== notificationId)
        );
    };

    const handleMarkAsRead = async (notificationId) => {
        if (user && db) {
            await notificationService.markAsRead(db, appId, user.uid, notificationId);
        }
    };

    // Afficher un bouton pour activer les notifications si refusées
    const showPermissionRequest = permissionStatus === 'denied' || permissionStatus === 'not-supported';

    return (
        <>
            {/* Notifications in-app */}
            <NotificationContainer
                notifications={activeNotifications}
                onClose={handleCloseNotification}
                onMarkAsRead={handleMarkAsRead}
            />

            {/* Bouton pour réactiver les notifications si nécessaire */}
            {showPermissionRequest && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 999,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '12px',
                    padding: 'clamp(12px, 4vw, 16px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    maxWidth: 'calc(100vw - 40px)',
                    width: 'clamp(250px, 80vw, 300px)'
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        marginBottom: '8px'
                    }}>
                        🔔 Activer les notifications
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        marginBottom: '12px',
                        lineHeight: '1.4'
                    }}>
                        Recevez des alertes pour les likes, commentaires et demandes d'amis
                    </div>
                    <button
                        onClick={async () => {
                            const granted = await notificationService.requestPermission();
                            setPermissionStatus(granted ? 'granted' : 'denied');
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    >
                        Activer maintenant
                    </button>
                </div>
            )}
        </>
    );
};

export default NotificationManager;
