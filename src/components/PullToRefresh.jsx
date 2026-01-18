import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { t } from '../utils/i18n';

/**
 * PullToRefresh - Composant amélioré pour pull-to-refresh
 * Avec animation fluide et feedback visuel
 */
const PullToRefresh = ({ onRefresh, children, threshold = 80 }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [canPull, setCanPull] = useState(false);
  const controls = useAnimation();

  // Vérifier si on peut pull (scroll est en haut)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setCanPull(scrollTop === 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTouchStart = (e) => {
    if (canPull && !isRefreshing) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (!canPull || isRefreshing || touchStart === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStart;

    // Ne pull que vers le bas
    if (distance > 0) {
      // Résistance progressive (effet élastique)
      const resistance = Math.min(distance / 2.5, threshold * 1.5);
      setPullDistance(resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!canPull || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        // Animation de retour
        await controls.start({
          y: 0,
          opacity: 0,
          transition: { duration: 0.3 }
        });
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset animation si pas assez tiré
      setPullDistance(0);
    }
    
    setTouchStart(0);
  };

  // Calculer la rotation de l'icône selon le pull distance
  const iconRotation = (pullDistance / threshold) * 360;
  const iconOpacity = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      {/* Indicateur de pull */}
      <motion.div
        animate={controls}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: `${Math.min(pullDistance, threshold * 1.5)}px`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '10px',
          zIndex: 50,
          pointerEvents: 'none',
          opacity: iconOpacity
        }}
      >
        <motion.div
          animate={{
            scale: isReady ? 1.2 : 1,
            rotate: isRefreshing ? 360 : iconRotation
          }}
          transition={{
            rotate: isRefreshing ? {
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            } : {
              duration: 0.2
            },
            scale: { duration: 0.2 }
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isReady ? '#bf00ff' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isReady 
              ? '0 4px 20px rgba(191, 0, 255, 0.4)'
              : '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          <RefreshCw 
            size={20} 
            color={isReady ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
          />
        </motion.div>

        {/* Texte indicatif */}
        {pullDistance > 20 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '-25px',
              fontSize: '12px',
              color: isReady ? '#bf00ff' : 'rgba(255, 255, 255, 0.6)',
              fontWeight: isReady ? '600' : '400'
            }}
          >
            {isRefreshing ? t('feed.refreshing') : isReady ? t('feed.releaseToRefresh') : t('feed.pullToRefresh')}
          </motion.div>
        )}
      </motion.div>

      {/* Contenu avec translation */}
      <motion.div
        animate={{
          y: Math.min(pullDistance * 0.3, threshold * 0.4)
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
