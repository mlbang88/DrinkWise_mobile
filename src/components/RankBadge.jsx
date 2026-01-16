import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const RankBadge = ({ rank, label, color, glow = true, size = 'md' }) => {
  const sizes = {
    sm: { badge: 40, icon: 20, fontSize: 12 },
    md: { badge: 60, icon: 32, fontSize: 16 },
    lg: { badge: 80, icon: 40, fontSize: 20 }
  };

  const sizeStyle = sizes[size] || sizes.md;

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <motion.div
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: rank * 0.1
      }}
    >
      {/* Badge circle */}
      <motion.div
        style={{
          width: sizeStyle.badge,
          height: sizeStyle.badge,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: sizeStyle.icon,
          boxShadow: glow ? `0 0 20px ${color}` : 'none',
          border: '3px solid rgba(255, 255, 255, 0.3)'
        }}
        whileHover={{ scale: 1.1 }}
        animate={rank <= 3 ? {
          boxShadow: [
            `0 0 20px ${color}`,
            `0 0 40px ${color}`,
            `0 0 20px ${color}`
          ]
        } : {}}
        transition={rank <= 3 ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        {getRankIcon(rank)}
      </motion.div>

      {/* Label */}
      {label && (
        <span style={{
          fontSize: sizeStyle.fontSize,
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: glow ? `0 0 10px ${color}` : 'none'
        }}>
          {label}
        </span>
      )}

      {/* Podium glow for top 3 */}
      {rank <= 3 && (
        <motion.div
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}40, transparent)`,
            filter: 'blur(12px)',
            zIndex: -1
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

RankBadge.propTypes = {
  rank: PropTypes.number.isRequired,
  label: PropTypes.string,
  color: PropTypes.string,
  glow: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

RankBadge.defaultProps = {
  color: '#bf00ff',
  glow: true,
  size: 'md'
};

export default RankBadge;
