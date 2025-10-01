import React from 'react';
import InAppNotification from './InAppNotification';

const NotificationContainer = ({ notifications, onClose, onMarkAsRead }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px',
      pointerEvents: 'none'
    }}>
      {notifications.map((notification, index) => (
        <InAppNotification
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onMarkAsRead={onMarkAsRead}
          style={{
            zIndex: 9999 - index,
            pointerEvents: 'auto',
            transform: `translateY(${index * 4}px)`,
            opacity: Math.max(0.8, 1 - index * 0.1)
          }}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
