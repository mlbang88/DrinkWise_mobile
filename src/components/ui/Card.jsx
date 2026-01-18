import React from 'react';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, SPACING, withOpacity } from '../../styles/designSystem';

/**
 * Card - Composant carte universel
 * 
 * @example
 * <Card variant="glass" padding="lg">Contenu</Card>
 * <Card variant="elevated" onClick={handleClick}>Clickable card</Card>
 */
const Card = ({ 
  children, 
  variant = 'default',  // default, glass, elevated
  padding = 'md',       // sm, md, lg, none
  onClick = null,
  hoverable = false,
  style = {},
  ...props 
}) => {
  const variants = {
    default: {
      background: COLORS.neutral[900],
      border: `1px solid ${COLORS.neutral[800]}`,
      boxShadow: 'none',
    },
    glass: {
      background: GRADIENTS.darkGlass,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${withOpacity(COLORS.white, 0.08)}`,
      boxShadow: SHADOWS.sm,
    },
    elevated: {
      background: COLORS.neutral[900],
      border: 'none',
      boxShadow: SHADOWS.xl,
    },
    gradient: {
      background: GRADIENTS.purpleGlass,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${withOpacity(COLORS.primary[500], 0.2)}`,
      boxShadow: SHADOWS.glow,
    },
  };

  const paddings = {
    none: '0',
    sm: SPACING.md,
    md: SPACING.lg,
    lg: SPACING.xl,
  };

  return (
    <div
      style={{
        ...variants[variant],
        padding: paddings[padding],
        borderRadius: RADIUS.lg,
        cursor: onClick || hoverable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = SHADOWS.xl;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow;
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
