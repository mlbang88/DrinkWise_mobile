import React from 'react';

const NotificationTester = () => {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'clamp(16px, 5vw, 24px)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        � Notifications
      </h1>
      
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '20px'
      }}>
        Fonctionnalité temporairement désactivée
      </p>
      
      <p style={{
        fontSize: '14px',
        color: '#9ca3af'
      }}>
        Cette page sera réactivée plus tard
      </p>
    </div>
  );
};

export default NotificationTester;
