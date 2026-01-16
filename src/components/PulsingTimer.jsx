import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const PulsingTimer = ({ timeLeft, totalTime, color = '#ff0080', urgent = false }) => {
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useEffect(() => {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage < 20) {
      setPulseIntensity(2); // Pulse rapide
    } else if (percentage < 50) {
      setPulseIntensity(1.5); // Pulse moyen
    } else {
      setPulseIntensity(1); // Pulse normal
    }
  }, [timeLeft, totalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / totalTime) * 100;
  const getColor = () => {
    if (percentage < 20) return '#ff0080'; // Rouge neon
    if (percentage < 50) return '#ffaa00'; // Orange neon
    return color; // Couleur normale
  };

  const currentColor = getColor();

  return (
    <motion.div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 24px',
        borderRadius: '16px',
        background: 'rgba(20, 20, 20, 0.95)',
        border: `2px solid ${currentColor}`,
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}
      animate={{
        scale: percentage < 20 ? [1, 1.05, 1] : [1],
        boxShadow: [
          `0 0 20px ${currentColor}80`,
          `0 0 40px ${currentColor}`,
          `0 0 20px ${currentColor}80`
        ]
      }}
      transition={{
        duration: 1 / pulseIntensity,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Background progress bar */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          background: `linear-gradient(90deg, ${currentColor}20, ${currentColor}40)`,
          zIndex: 0
        }}
        initial={{ width: '100%' }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Time text */}
      <span style={{ position: 'relative', zIndex: 1, textShadow: `0 0 10px ${currentColor}` }}>
        ⏱️ {formatTime(timeLeft)}
      </span>

      {/* Glow effect */}
      {percentage < 20 && (
        <motion.div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '16px',
            background: `radial-gradient(circle, ${currentColor}60, transparent)`,
            filter: 'blur(10px)',
            zIndex: -1
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity
          }}
        />
      )}
    </motion.div>
  );
};

PulsingTimer.propTypes = {
  timeLeft: PropTypes.number.isRequired,
  totalTime: PropTypes.number.isRequired,
  color: PropTypes.string,
  urgent: PropTypes.bool
};

export default PulsingTimer;
