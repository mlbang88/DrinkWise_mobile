import React from 'react';
import { motion } from 'framer-motion';

const StatusDot = ({ status = 'offline', size = 'md', pulse = true }) => {
  const sizes = {
    sm: 8,
    md: 12,
    lg: 16
  };

  const colors = {
    online: '#00ff88',
    offline: '#808080',
    away: '#ffaa00',
    busy: '#ff0080'
  };

  const dotSize = sizes[size] || sizes.md;
  const color = colors[status] || colors.offline;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}`
        }}
        animate={pulse && status === 'online' ? {
          boxShadow: [
            `0 0 10px ${color}`,
            `0 0 20px ${color}`,
            `0 0 10px ${color}`
          ]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {pulse && status === 'online' && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            opacity: 0
          }}
          animate={{
            scale: [1, 2],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </div>
  );
};

export default StatusDot;
