import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon = '🎉', title, message, action, className = '' }) => {
  return (
    <motion.div
      className={className}
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'rgba(20, 20, 20, 0.95)',
        border: '2px dashed rgba(191, 0, 255, 0.3)',
        borderRadius: '24px',
        margin: '20px'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        style={{ fontSize: '80px', marginBottom: '20px' }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {icon}
      </motion.div>
      
      <h3 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '12px',
        textShadow: '0 0 20px rgba(191, 0, 255, 0.5)'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '16px',
        color: '#e0e0e0',
        marginBottom: '24px',
        lineHeight: '1.6'
      }}>
        {message}
      </p>
      
      {action && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
