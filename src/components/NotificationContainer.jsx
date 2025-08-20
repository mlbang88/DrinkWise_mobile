import React from 'react';
import InAppNotification from './InAppNotification';

const NotificationContainer = ({ notifications, onClose, onMarkAsRead }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification, index) => (
        <InAppNotification
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onMarkAsRead={onMarkAsRead}
          style={{
            zIndex: 9999 - index, // Notifications plus récentes au-dessus
            marginBottom: '0.5rem'
          }}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
