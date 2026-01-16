import React from 'react';
import { motion } from 'framer-motion';

const NeonBorder = ({ children, color = '#bf00ff', animate = true, className = '' }) => {
  return (
    <motion.div
      className={className}
      style={{
        position: 'relative',
        borderRadius: '50%',
        padding: 4,
        background: `linear-gradient(45deg, ${color}, #ff00ff, #00ffff, ${color})`,
        backgroundSize: '300% 300%'
      }}
      animate={animate ? {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div style={{
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#0f0f0f',
        padding: 2
      }}>
        {children}
      </div>
      
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40, transparent)`,
        filter: 'blur(8px)',
        zIndex: -1
      }} />
    </motion.div>
  );
};

export default NeonBorder;
