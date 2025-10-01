// Phase 2B Modern Theme System
export const glassEffects = {
  // Glass morphism containers
  glassPrimary: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  glassSecondary: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
  glassAccent: 'linear-gradient(135deg, rgba(139, 69, 255, 0.3), rgba(99, 39, 215, 0.2))',
  
  // Backdrop filters
  blurLight: 'blur(15px)',
  blurMedium: 'blur(20px)',
  blurHeavy: 'blur(25px)',
  
  // Borders
  borderLight: '1px solid rgba(255, 255, 255, 0.2)',
  borderMedium: '1px solid rgba(255, 255, 255, 0.25)',
  borderAccent: '1px solid rgba(139, 69, 255, 0.4)',
  
  // Shadows
  shadowSmall: '0 4px 12px rgba(0, 0, 0, 0.1)',
  shadowMedium: '0 8px 20px rgba(0, 0, 0, 0.15)',
  shadowLarge: '0 12px 40px rgba(0, 0, 0, 0.2)',
  shadowAccent: '0 8px 25px rgba(139, 69, 255, 0.3)'
};

export const gradients = {
  // Text gradients
  textPrimary: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
  textAccent: 'linear-gradient(135deg, #e879f9, #c084fc)',
  textSuccess: 'linear-gradient(135deg, #10b981, #34d399)',
  textError: 'linear-gradient(135deg, #ef4444, #f87171)',
  
  // Background gradients
  bgPrimary: 'linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.9))',
  bgSecondary: 'linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(45, 45, 80, 0.9))',
  
  // Button gradients
  buttonPrimary: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  buttonSecondary: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  buttonSuccess: 'linear-gradient(135deg, #10b981, #059669)',
  buttonError: 'linear-gradient(135deg, #ef4444, #dc2626)'
};

export const spacing = {
  // Modern spacing scale
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px'
};

export const borderRadius = {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
  full: '50%'
};

export const typography = {
  // Modern font weights and sizes
  fontWeights: {
    normal: '500',
    medium: '600',
    semibold: '700',
    bold: '800'
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px'
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '-0.01em',
    wide: '0.01em'
  }
};

// Legacy theme objects for compatibility
export const lightTheme = {
  ...glassEffects,
  ...gradients,
  background: gradients.bgPrimary,
  text: gradients.textPrimary,
  primary: gradients.buttonPrimary
};

export const darkTheme = {
  ...glassEffects,
  ...gradients,
  background: gradients.bgSecondary,
  text: gradients.textPrimary,
  primary: gradients.buttonSecondary
};