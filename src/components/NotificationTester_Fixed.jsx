import React, { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { notificationService } from '../services/notificationService';

const NotificationTester = () => {
  const { user, db } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);

  const testNotifications = [
    {
      type: 'like',
      title: '❤️ Nouveau J\'aime',
      body: 'Pierre a aimé votre soirée "Anniversaire 25 ans"',
      data: {
        userName: 'Pierre',
        itemType: 'party',
        itemId: 'test-party-123'
      }
    },
    {
      type: 'comment',
      title: '💬 Nouveau Commentaire',
      body: 'Marie: "Super soirée ! Merci pour l\'invitation 🎉"',
      data: {
        userName: 'Marie',
        content: 'Super soirée ! Merci pour l\'invitation 🎉',
        itemType: 'party',
        itemId: 'test-party-123'
      }
    },
    {
      type: 'friend_request',
      title: '👥 Demande d\'Ami',
      body: 'Alex vous a envoyé une demande d\'ami',
      data: {
        userName: 'Alex',
        userId: 'test-user-456'
      }
    },
    {
      type: 'achievement',
      title: '🏆 Nouveau Badge',
      body: 'Félicitations ! Vous avez débloqué le badge "Responsable"',
      data: {
        badgeName: 'Responsable',
        badgeDescription: 'Organisé 5 soirées sans incident'
      }
    }
  ];

  const sendTestNotification = async (notificationData) => {
    if (!user) {
      alert('Veuillez vous connecter pour tester les notifications');
      return;
    }

    setIsLoading(true);
    try {
      // Déclencher une notification in-app
      window.dispatchEvent(new CustomEvent('showInAppNotification', {
        detail: {
          id: `test-${Date.now()}`,
          type: notificationData.type,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          timestamp: { toDate: () => new Date() },
          read: false
        }
      }));

      // Afficher une notification native si les permissions sont accordées
      if (notificationService.getPermissionStatus() === 'granted') {
        notificationService.showNativeNotification(
          notificationData.title,
          {
            body: notificationData.body,
            icon: '/icon-192.webp',
            badge: '/icon-48.webp',
            tag: notificationData.type,
            requireInteraction: false,
            actions: [
              { action: 'view', title: 'Voir' },
              { action: 'dismiss', title: 'Ignorer' }
            ]
          }
        );
      }

      console.log('✅ Notification de test envoyée:', notificationData.type);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      alert('Erreur lors de l\'envoi de la notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testPermissionStatus = () => {
    const status = notificationService.getPermissionStatus();
    const help = notificationService.getPermissionHelp();
    
    alert(`Statut: ${status}\n\n${help}`);
  };

  const forceRefreshPermissions = () => {
    window.location.reload();
  };

  const requestPermissions = async () => {
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        alert('✅ Permissions accordées !');
      } else {
        // Vérifier si les permissions sont définitivement bloquées
        if (Notification.permission === 'denied') {
          alert('❌ Permissions bloquées !\n\nPour réactiver :\n1. Cliquez sur l\'icône 🔒/🛡️ à côté de l\'URL\n2. Autorisez les notifications\n3. Rechargez la page');
        } else {
          alert('❌ Permissions refusées');
        }
      }
    } catch (error) {
      console.error('Erreur permissions:', error);
      alert('❌ Erreur lors de la demande de permissions');
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'clamp(16px, 5vw, 24px)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        🧪 Test des Notifications
      </h1>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        color: 'white'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
          Status des Permissions
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          Statut actuel: <strong>{notificationService.getPermissionStatus()}</strong>
        </p>
        
        {notificationService.getPermissionStatus() === 'denied' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              🚫 Permissions Bloquées
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.4' }}>
              Les notifications ont été bloquées. Pour les réactiver :
            </p>
            <ol style={{ margin: '0', paddingLeft: '16px', fontSize: '12px', lineHeight: '1.4' }}>
              <li>Cliquez sur l'icône 🔒 ou 🛡️ à côté de l'URL</li>
              <li>Sélectionnez "Autoriser" pour les notifications</li>
              <li>Rechargez la page (F5)</li>
            </ol>
          </div>
        )}
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {notificationService.getPermissionStatus() === 'default' && (
            <button
              onClick={requestPermissions}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Demander les permissions
            </button>
          )}
          
          {notificationService.getPermissionStatus() === 'denied' && (
            <button
              onClick={forceRefreshPermissions}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Recharger la page
            </button>
          )}
          
          <button
            onClick={testPermissionStatus}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Vérifier le statut
          </button>
        </div>
        
        {notificationService.getPermissionStatus() === 'granted' && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            marginTop: '12px'
          }}>
            ✅ Notifications autorisées - Vous recevrez les notifications natives !
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gap: '12px'
      }}>
        {testNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={() => sendTestNotification(notification)}
            disabled={isLoading}
            style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '4px',
              color: '#1f2937'
            }}>
              {notification.title}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              {notification.body}
            </div>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Instructions:</strong>
        </p>
        <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px' }}>
          <li>Cliquez sur un type de notification pour la tester</li>
          <li>Les notifications in-app apparaîtront toujours en haut à droite</li>
          <li>Les notifications natives nécessitent l'autorisation du navigateur</li>
          <li>Vous pouvez fermer les notifications en cliquant dessus</li>
        </ul>
        
        {notificationService.getPermissionStatus() === 'denied' && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '8px',
            marginTop: '8px'
          }}>
            <p style={{ margin: '0 0 4px 0', color: '#dc2626', fontWeight: '600', fontSize: '11px' }}>
              ⚠️ Notifications Bloquées
            </p>
            <p style={{ margin: '0', color: '#7f1d1d', fontSize: '11px', lineHeight: '1.3' }}>
              Les notifications natives sont bloquées, mais les notifications in-app fonctionnent normalement.
              Pour débloquer : cliquez sur 🔒 à côté de l'URL → Autorisez les notifications → Rechargez (F5)
            </p>
          </div>
        )}
        
        {notificationService.getPermissionStatus() === 'granted' && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '8px',
            marginTop: '8px'
          }}>
            <p style={{ margin: '0', color: '#15803d', fontWeight: '600', fontSize: '11px' }}>
              ✅ Vous recevrez des notifications natives ET in-app !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTester;
