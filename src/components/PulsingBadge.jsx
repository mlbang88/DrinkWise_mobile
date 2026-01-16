import React from 'react';
import { motion } from 'framer-motion';

const PulsingBadge = ({ children, color = '#ff00ff', size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 20, height: 20, fontSize: 10 },
    md: { width: 24, height: 24, fontSize: 12 },
    lg: { width: 32, height: 32, fontSize: 14 }
  };

  const sizeStyle = sizes[size] || sizes.md;

  return (
    <motion.div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizeStyle.width,
        height: sizeStyle.height,
        borderRadius: '50%',
        background: color,
        color: 'white',
        fontSize: sizeStyle.fontSize,
        fontWeight: 'bold',
        boxShadow: `0 0 10px ${color}`
      }}
      animate={{
        scale: [1, 1.2, 1],
        boxShadow: [
          `0 0 10px ${color}`,
          `0 0 20px ${color}`,
          `0 0 10px ${color}`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
      
      {/* Ripple effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0
        }}
        animate={{
          scale: [1, 1.8],
          opacity: [0.8, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </motion.div>
  );
};

export default PulsingBadge;
