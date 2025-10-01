import React from 'react';

/**
 * Indicateur de chargement de page avec animation
 */
export const PageLoader = ({ message = "Chargement..." }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '2rem'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f4f6',
      borderTop: '4px solid #a855f7',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    }}/>
    <p style={{
      color: '#a855f7',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      margin: 0
    }}>{message}</p>
  </div>
);

/**
 * Skeleton loader pour le contenu
 */
export const SkeletonLoader = ({ lines = 3, height = "20px" }) => (
  <div style={{ padding: '1rem 0' }}>
    {Array.from({ length: lines }, (_, i) => (
      <div 
        key={i} 
        style={{ 
          height,
          width: i === lines - 1 ? '70%' : '100%',
          backgroundColor: '#e5e7eb',
          borderRadius: '8px',
          marginBottom: '12px',
          animation: 'pulse 1.5s infinite'
        }} 
      />
    ))}
  </div>
);

/**
 * Loading overlay pour les actions
 */
export const LoadingOverlay = ({ isVisible, message = "Traitement..." }) => {
  if (!isVisible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '2rem',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '280px',
        margin: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '1rem'
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                background: '#a855f7',
                borderRadius: '50%',
                animation: `pulse 1.4s infinite ${i * 0.2}s`
              }}
            />
          ))}
        </div>
        <p style={{
          color: '#374151',
          fontSize: '16px',
          fontWeight: '500',
          margin: 0
        }}>{message}</p>
      </div>
    </div>
  );
};

/**
 * Indicateur de refresh pull-to-refresh
 */
export const PullToRefreshIndicator = ({ isVisible, progress = 0 }) => {
  if (!isVisible) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: '-50px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(168, 85, 247, 0.9)',
      borderRadius: '50%',
      zIndex: 10
    }}>
      <div style={{ 
        fontSize: '20px',
        color: 'white',
        fontWeight: 'bold',
        transform: `rotate(${progress * 360}deg)`,
        opacity: Math.min(progress * 2, 1)
      }}>
        ↻
      </div>
    </div>
  );
};