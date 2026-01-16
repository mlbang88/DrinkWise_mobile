import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 8, className = '' }) => {
  return (
    <motion.div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(191,0,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        overflow: 'hidden'
      }}
      animate={{
        backgroundPosition: ['-200% 0', '200% 0']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div style={{
      background: 'rgba(20, 20, 20, 0.98)',
      border: '1px solid rgba(191, 0, 255, 0.3)',
      borderRadius: 20,
      padding: 24,
      marginBottom: 16
    }}>
      <SkeletonLoader height={24} width="60%" style={{ marginBottom: 12 }} />
      <SkeletonLoader height={16} width="90%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="70%" />
    </div>
  );
};

export default SkeletonLoader;
