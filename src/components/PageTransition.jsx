import React from 'react';

/**
 * Composant pour gérer les transitions entre pages
 */
const PageTransition = ({ 
  children, 
  isActive = true, 
  direction = 'fade',
  duration = 300 
}) => {
  const getTransitionStyle = () => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      position: 'relative'
    };

    if (!isActive) {
      switch (direction) {
        case 'slide-left':
          return { ...baseStyle, transform: 'translateX(100%)', opacity: 0 };
        case 'slide-right':
          return { ...baseStyle, transform: 'translateX(-100%)', opacity: 0 };
        case 'scale':
          return { ...baseStyle, transform: 'scale(0.95)', opacity: 0 };
        default: // fade
          return { ...baseStyle, transform: 'translateY(10px)', opacity: 0 };
      }
    }

    return { ...baseStyle, transform: 'translateX(0) translateY(0) scale(1)', opacity: 1 };
  };

  return (
    <div style={getTransitionStyle()}>
      {children}
    </div>
  );
};

export default PageTransition;