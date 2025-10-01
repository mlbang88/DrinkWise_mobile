import React, { useState, useEffect } from 'react';

/**
 * Composant Phase 2C pour gérer les transitions entre pages avec animations avancées
 */
const PageTransition = ({ 
  children, 
  isActive = true, 
  direction = 'fade',
  duration = 400,
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasEntered(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive, delay]);

  const getTransitionStyle = () => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      position: 'relative',
      backfaceVisibility: 'hidden',
      willChange: 'transform, opacity',
    };

    if (!isVisible || !isActive) {
      switch (direction) {
        case 'slide-left':
          return { 
            ...baseStyle, 
            transform: 'translateX(100%) translateZ(0)', 
            opacity: 0,
            filter: 'blur(2px)'
          };
        case 'slide-right':
          return { 
            ...baseStyle, 
            transform: 'translateX(-100%) translateZ(0)', 
            opacity: 0,
            filter: 'blur(2px)'
          };
        case 'slide-up':
          return { 
            ...baseStyle, 
            transform: 'translateY(30px) translateZ(0) scale(0.98)', 
            opacity: 0,
            filter: 'blur(1px)'
          };
        case 'slide-down':
          return { 
            ...baseStyle, 
            transform: 'translateY(-30px) translateZ(0) scale(0.98)', 
            opacity: 0,
            filter: 'blur(1px)'
          };
        case 'scale':
          return { 
            ...baseStyle, 
            transform: 'scale(0.92) translateZ(0)', 
            opacity: 0,
            filter: 'blur(3px)'
          };
        case 'zoom':
          return { 
            ...baseStyle, 
            transform: 'scale(1.08) translateZ(0)', 
            opacity: 0,
            filter: 'blur(2px)'
          };
        case 'flip':
          return { 
            ...baseStyle, 
            transform: 'rotateY(90deg) translateZ(0)', 
            opacity: 0,
            transformOrigin: 'center center',
            transformStyle: 'preserve-3d'
          };
        case 'elastic':
          return { 
            ...baseStyle, 
            transform: 'translateY(40px) scale(0.9) translateZ(0)', 
            opacity: 0,
            filter: 'blur(2px)',
            transition: `all ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`
          };
        default: // fade
          return { 
            ...baseStyle, 
            transform: 'translateY(20px) translateZ(0) scale(0.99)', 
            opacity: 0,
            filter: 'blur(1px)'
          };
      }
    }

    // État actif - animation d'entrée spéciale pour certains types
    const activeTransition = direction === 'elastic' 
      ? `all ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`
      : `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

    return { 
      ...baseStyle, 
      transform: 'translateX(0) translateY(0) scale(1) translateZ(0) rotateY(0deg)', 
      opacity: 1,
      filter: 'blur(0px)',
      transition: activeTransition
    };
  };

  // Animation d'apparition échelonnée pour les enfants
  const childrenWithAnimation = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    return React.cloneElement(child, {
      style: {
        ...child.props.style,
        animationDelay: hasEntered ? `${index * 50}ms` : '0ms',
        animation: hasEntered ? 'slideInChild 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' : 'none'
      }
    });
  });

  return (
    <>
      <div style={getTransitionStyle()}>
        {childrenWithAnimation}
      </div>
      
      <style>
        {`
          @keyframes slideInChild {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          /* Optimisations de performance */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Accélération matérielle pour les transitions */
          .page-transition {
            transform: translateZ(0);
            will-change: transform, opacity;
          }
        `}
      </style>
    </>
  );
};

export default PageTransition;