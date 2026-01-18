/**
 * DrinkWise Design System
 * Système de design centralisé pour garantir la cohérence visuelle
 * Version: 1.0.0
 */

// ============================================================================
// COLORS - Palette de couleurs principale
// ============================================================================

export const COLORS = {
  // Brand Primary (Violet - Identité principale)
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',  // PRIMARY MAIN - Utiliser pour boutons, liens, accents
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Accent (Orange-Rose - Énergie et actions secondaires)
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // ACCENT MAIN
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Success (Vert - Validation, succès)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // SUCCESS MAIN
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning (Jaune-Ambre - Attention, avertissements)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // WARNING MAIN
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error (Rouge - Erreurs, danger)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // ERROR MAIN
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info (Bleu - Information)
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // INFO MAIN
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutrals (Gris - Backgrounds, textes)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',  // BACKGROUND MAIN - Background principal de l'app
  },

  // Special
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// ============================================================================
// GRADIENTS - Dégradés prédéfinis (MAXIMUM 5)
// ============================================================================

export const GRADIENTS = {
  // Gradient principal (violet) - Pour éléments importants
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primaryDark: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5b21b6 100%)',
  
  // Gradient accent (orange) - Pour actions secondaires
  accent: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  
  // Gradient success (vert)
  success: 'linear-gradient(135deg, #22c55e 0%, #86efac 100%)',
  
  // Backgrounds glass effect
  darkGlass: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(15, 15, 15, 0.6) 100%)',
  purpleGlass: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(109, 40, 217, 0.08) 100%)',
  
  // Text gradients
  textPrimary: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
  textGold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
};

// ============================================================================
// SPACING - Système 8pt grid
// ============================================================================

export const SPACING = {
  xs: '4px',    // Très petit espacement
  sm: '8px',    // Petit espacement
  md: '16px',   // Espacement moyen (défaut)
  lg: '24px',   // Grand espacement
  xl: '32px',   // Très grand espacement
  xxl: '48px',  // Espacement majeur
  xxxl: '64px', // Espacement énorme
};

// ============================================================================
// BORDER RADIUS - Arrondis standardisés
// ============================================================================

export const RADIUS = {
  none: '0',
  sm: '8px',    // Petits éléments
  md: '12px',   // Cards standard
  lg: '16px',   // Large cards
  xl: '20px',   // Modals
  xxl: '24px',  // Large modals
  full: '9999px', // Cercles parfaits
};

// ============================================================================
// SHADOWS - Ombres portées
// ============================================================================

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Glows (pour éléments lumineux)
  glow: '0 0 20px rgba(168, 85, 247, 0.4)',
  glowStrong: '0 0 40px rgba(168, 85, 247, 0.6)',
  glowAccent: '0 0 20px rgba(249, 115, 22, 0.4)',
};

// ============================================================================
// TYPOGRAPHY - Système typographique
// ============================================================================

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  
  // Font sizes (scale harmonique)
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================================================
// Z-INDEX - Gestion des couches
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
};

// ============================================================================
// BREAKPOINTS - Points de rupture responsive
// ============================================================================

export const BREAKPOINTS = {
  xs: '320px',   // Mobile petit
  sm: '640px',   // Mobile
  md: '768px',   // Tablette
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Très large desktop
};

// ============================================================================
// ANIMATIONS - Durées et easings
// ============================================================================

export const ANIMATIONS = {
  // Durées
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Easing functions
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ============================================================================
// HELPERS - Fonctions utilitaires
// ============================================================================

/**
 * Génère un style responsive avec clamp()
 * @param {string} min - Taille minimum
 * @param {string} ideal - Taille idéale (vw)
 * @param {string} max - Taille maximum
 * @returns {string} - Style clamp()
 */
export const responsiveSize = (min, ideal, max) => {
  return `clamp(${min}, ${ideal}, ${max})`;
};

/**
 * Applique une opacité à une couleur
 * @param {string} color - Couleur hex
 * @param {number} opacity - Opacité (0-1)
 * @returns {string} - Couleur rgba
 */
export const withOpacity = (color, opacity) => {
  // Convertir hex en rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Génère un media query
 * @param {string} breakpoint - Nom du breakpoint
 * @returns {string} - Media query string
 */
export const mediaQuery = (breakpoint) => {
  return `@media (min-width: ${BREAKPOINTS[breakpoint]})`;
};

// ============================================================================
// PRESETS - Styles prédéfinis courants
// ============================================================================

export const PRESETS = {
  // Effet glass (glassmorphism)
  glass: {
    background: withOpacity(COLORS.neutral[900], 0.7),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${withOpacity(COLORS.white, 0.08)}`,
  },
  
  // Card elevated
  cardElevated: {
    background: COLORS.neutral[900],
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.xl,
    padding: SPACING.lg,
  },
  
  // Text gradient primary
  textGradient: {
    background: GRADIENTS.textPrimary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  // Bouton gradient
  buttonGradient: {
    background: GRADIENTS.primary,
    color: COLORS.white,
    border: 'none',
    borderRadius: RADIUS.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    cursor: 'pointer',
    transition: `all ${ANIMATIONS.duration.normal} ${ANIMATIONS.easing.easeInOut}`,
  },
};

// Export tout par défaut pour import facilité
export default {
  COLORS,
  GRADIENTS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  Z_INDEX,
  BREAKPOINTS,
  ANIMATIONS,
  PRESETS,
  // Helpers
  responsiveSize,
  withOpacity,
  mediaQuery,
};
