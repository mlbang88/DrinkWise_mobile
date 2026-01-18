import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { t } from '../utils/i18n';

/**
 * ErrorRetry - Composant d'affichage d'erreur avec retry
 * Affiche un message d'erreur élégant avec bouton de réessai
 */
const ErrorRetry = ({ 
  error, 
  onRetry, 
  title,
  showDetails = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        minHeight: '300px'
      }}
    >
      {/* Icône d'erreur avec animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1
        }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}
      >
        <AlertCircle size={40} color="#ef4444" />
      </motion.div>

      {/* Titre */}
      <h3 
        style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '12px'
        }}
      >
        {title || t('error.generic')}
      </h3>

      {/* Message d'erreur */}
      <p 
        style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          maxWidth: '400px',
          marginBottom: showDetails && error ? '12px' : '24px',
          lineHeight: '1.5'
        }}
      >
        {t('error.networkMessage')}
      </p>

      {/* Détails de l'erreur (optionnel) */}
      {showDetails && error && (
        <details 
          style={{
            marginBottom: '24px',
            maxWidth: '400px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer'
          }}
        >
          <summary style={{ marginBottom: '8px', userSelect: 'none' }}>
            Détails techniques
          </summary>
          <pre 
            style={{
              textAlign: 'left',
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflow: 'auto',
              maxWidth: '100%'
            }}
          >
            {error.message || JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}

      {/* Bouton de retry avec animation */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#bf00ff',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(191, 0, 255, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <RefreshCw size={20} />
        <span>{t('error.retry')}</span>
      </motion.button>
    </motion.div>
  );
};

/**
 * InlineErrorRetry - Version compacte pour erreurs inline
 */
export const InlineErrorRetry = ({ error, onRetry, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
      
      <div style={{ flex: 1 }}>
        <p style={{ 
          fontSize: '14px', 
          color: '#ef4444', 
          margin: 0,
          fontWeight: '500'
        }}>
          {message || error?.message || t('error.generic')}
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {t('error.retry')}
      </motion.button>
    </motion.div>
  );
};

export default ErrorRetry;
