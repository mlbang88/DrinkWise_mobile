import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

/**
 * useOnlineStatus - Hook pour détecter l'état de connexion
 * Retourne true si en ligne, false si hors ligne
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * OfflineIndicator - Bannière d'indication du mode hors ligne
 * Apparaît automatiquement quand la connexion est perdue
 */
const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Délai avant de cacher la bannière quand on revient en ligne
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '12px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        animation: isOnline ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-out',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {isOnline ? (
          <>
            <span>✓</span>
            <span>{t('error.online')}</span>
          </>
        ) : (
          <>
            <span>⚠</span>
            <span>{t('error.offline')}</span>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;
