import React, { useContext, useState } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

const NotificationTest = () => {
    const { db, user, appId, functions } = useContext(FirebaseContext);
    const [isLoading, setIsLoading] = useState(false);

    const createTestNotification = async (type) => {
        if (!user || !db) return;
        
        setIsLoading(true);
        try {
            const testData = {
                like: {
                    type: 'like',
                    data: {
                        userName: 'TestUser',
                        userId: 'test-user-id',
                        itemId: 'test-item-id',
                        itemType: 'party',
                        itemTitle: 'Soirée Test'
                    }
                },
                comment: {
                    type: 'comment',
                    data: {
                        userName: 'TestUser',
                        userId: 'test-user-id',
                        itemId: 'test-item-id',
                        itemType: 'party',
                        itemTitle: 'Soirée Test',
                        content: 'Ceci est un commentaire de test pour vérifier les notifications!'
                    }
                },
                friend_request: {
                    type: 'friend_request',
                    data: {
                        userName: 'TestUser',
                        userId: 'test-user-id',
                        requestId: 'test-request-id'
                    }
                },
                friend_accepted: {
                    type: 'friend_accepted',
                    data: {
                        userName: 'TestUser',
                        userId: 'test-user-id'
                    }
                }
            };

            const notificationData = {
                ...testData[type],
                timestamp: serverTimestamp(),
                read: false,
                displayed: false
            };

            await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/notifications`), notificationData);
            
            console.log(`✅ Notification test ${type} créée`);
        } catch (error) {
            console.error('❌ Erreur création notification test:', error);
        }
        setIsLoading(false);
    };

    const testPermissions = async () => {
        const status = notificationService.getPermissionStatus();
        console.log('📱 Statut permissions:', status);
        
        if (status === 'default') {
            const granted = await notificationService.requestPermission();
            console.log('📱 Permission accordée:', granted);
        }
    };

    const markAllAsRead = async () => {
        setIsLoading(true);
        try {
            await notificationService.markAllAsRead(db, appId, user.uid);
            console.log('✅ Toutes les notifications marquées comme lues');
        } catch (error) {
            console.error('❌ Erreur marquage:', error);
        }
        setIsLoading(false);
    };

    const showCustomNotification = () => {
        const customNotification = {
            id: 'custom-test-' + Date.now(),
            type: 'custom',
            data: {
                userName: 'Test Personnalisé',
                content: 'Notification personnalisée de test'
            },
            timestamp: { toDate: () => new Date() }
        };
        
        notificationService.createInAppNotification(customNotification);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: 'clamp(16px, 5vw, 24px)',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{
                fontSize: 'clamp(20px, 6vw, 28px)',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                🔔 Test des Notifications
            </h1>

            {/* Statut des permissions */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(16px, 5vw, 20px)',
                marginBottom: '20px'
            }}>
                <h3 style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    marginBottom: '12px'
                }}>
                    📱 Permissions
                </h3>
                <p style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    marginBottom: '12px',
                    color: '#ccc'
                }}>
                    Statut: {notificationService.getPermissionStatus()}
                </p>
                <button
                    onClick={testPermissions}
                    disabled={isLoading}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: 'clamp(8px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                        color: 'white',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        cursor: 'pointer',
                        minHeight: '44px'
                    }}
                >
                    Vérifier Permissions
                </button>
            </div>

            {/* Tests de notifications */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(16px, 5vw, 20px)',
                marginBottom: '20px'
            }}>
                <h3 style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    marginBottom: '16px'
                }}>
                    🧪 Créer des Notifications Test
                </h3>
                
                <div style={{
                    display: 'grid',
                    gap: 'clamp(8px, 3vw, 12px)',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                }}>
                    <button
                        onClick={() => createTestNotification('like')}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px'
                        }}
                    >
                        ❤️ Test Like
                    </button>
                    
                    <button
                        onClick={() => createTestNotification('comment')}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px'
                        }}
                    >
                        💬 Test Commentaire
                    </button>
                    
                    <button
                        onClick={() => createTestNotification('friend_request')}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px'
                        }}
                    >
                        👥 Test Demande Ami
                    </button>
                    
                    <button
                        onClick={() => createTestNotification('friend_accepted')}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px'
                        }}
                    >
                        ✅ Test Ami Accepté
                    </button>
                </div>
            </div>

            {/* Tests personnalisés */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(16px, 5vw, 20px)',
                marginBottom: '20px'
            }}>
                <h3 style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    marginBottom: '16px'
                }}>
                    🎨 Tests Personnalisés
                </h3>
                
                <div style={{
                    display: 'flex',
                    gap: 'clamp(8px, 3vw, 12px)',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={showCustomNotification}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px',
                            flex: '1',
                            minWidth: '150px'
                        }}
                    >
                        🎨 Notification In-App
                    </button>
                    
                    <button
                        onClick={markAllAsRead}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: 'clamp(8px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                            color: 'white',
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            cursor: 'pointer',
                            minHeight: '44px',
                            flex: '1',
                            minWidth: '150px'
                        }}
                    >
                        ✅ Marquer Tout Lu
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: 'clamp(16px, 5vw, 20px)'
            }}>
                <h3 style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    color: '#22c55e',
                    marginBottom: '12px'
                }}>
                    📋 Instructions
                </h3>
                <ul style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    lineHeight: '1.5',
                    color: '#22c55e',
                    margin: 0,
                    paddingLeft: '20px'
                }}>
                    <li>Cliquez sur les boutons pour créer des notifications test</li>
                    <li>Les notifications apparaîtront en haut à droite de l'écran</li>
                    <li>Les notifications natives s'affichent si les permissions sont accordées</li>
                    <li>Utilisez "Marquer Tout Lu" pour nettoyer vos notifications</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationTest;
