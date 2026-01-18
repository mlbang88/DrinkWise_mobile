import React from 'react';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, SPACING, ANIMATIONS, TYPOGRAPHY } from '../../styles/designSystem';
import LoadingIcon from '../LoadingIcon';

/**
 * Button - Composant bouton universel
 * 
 * @example
 * <Button variant="primary" size="lg">Créer une soirée</Button>
 * <Button variant="outline" onClick={handleClick}>Annuler</Button>
 * <Button variant="ghost" loading>Chargement...</Button>
 */
const Button = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  children,
  onClick,
  style = {},
  ...props
}) => {
  const variants = {
    primary: {
      background: GRADIENTS.primary,
      color: COLORS.white,
      border: 'none',
      boxShadow: SHADOWS.glow,
    },
    secondary: {
      background: COLORS.neutral[800],
      color: COLORS.white,
      border: `1px solid ${COLORS.neutral[700]}`,
    },
    outline: {
      background: 'transparent',
      color: COLORS.primary[500],
      border: `2px solid ${COLORS.primary[500]}`,
    },
    ghost: {
      background: 'transparent',
      color: COLORS.primary[400],
      border: 'none',
    },
  };

  const sizes = {
    sm: { padding: `${SPACING.sm} ${SPACING.md}`, fontSize: TYPOGRAPHY.fontSize.sm },
    md: { padding: `${SPACING.md} ${SPACING.lg}`, fontSize: TYPOGRAPHY.fontSize.base },
    lg: { padding: `${SPACING.lg} ${SPACING.xl}`, fontSize: TYPOGRAPHY.fontSize.lg },
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        ...variants[variant],
        ...sizes[size],
        borderRadius: RADIUS.md,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        transition: `all ${ANIMATIONS.duration.normal}`,
        ...style,
      }}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === 'left' && !loading && icon}
      {loading && <LoadingIcon size="sm" />}
      {children}
      {icon && iconPosition === 'right' && !loading && icon}
    </button>
  );
};

export default Button;
