import React from 'react';
import { motion } from 'framer-motion';

const GlowingCard = ({ 
  children, 
  color = '#bf00ff', 
  intensity = 'medium',
  hover = true,
  className = ''
}) => {
  const intensities = {
    low: '0 0 10px',
    medium: '0 0 20px',
    high: '0 0 40px'
  };

  const shadowIntensity = intensities[intensity] || intensities.medium;

  return (
    <motion.div
      className={className}
      style={{
        background: 'rgba(20, 20, 20, 0.95)',
        border: `2px solid ${color}40`,
        borderRadius: '20px',
        padding: '24px',
        boxShadow: `${shadowIntensity} ${color}60`,
        transition: 'all 0.3s ease'
      }}
      whileHover={hover ? {
        scale: 1.02,
        boxShadow: `0 0 30px ${color}80, inset 0 0 20px ${color}20`,
        borderColor: `${color}60`
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
};

export default GlowingCard;
