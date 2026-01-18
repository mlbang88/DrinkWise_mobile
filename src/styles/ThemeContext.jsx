// ThemeContext.jsx - Aligné avec visual-system.css
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

// Thème aligné avec les variables CSS de visual-system.css
const theme = {
  // Backgrounds
  background: '#0f0f0f', // --bg-app
  surface: 'rgba(15, 15, 15, 0.95)', // --bg-surface
  elevated: 'rgba(20, 20, 20, 0.98)', // --bg-elevated
  
  // Gradients neon
  gradientPrimary: 'linear-gradient(135deg, #bf00ff 0%, #ff00ff 100%)', // --gradient-primary
  gradientSecondary: 'linear-gradient(135deg, #00ffff 0%, #00d4ff 100%)', // --gradient-secondary
  gradientSuccess: 'linear-gradient(135deg, #00ff88 0%, #00ffcc 100%)', // --gradient-success
  
  // Accents neon
  neonCyan: '#00ffff',
  neonMagenta: '#ff00ff',
  neonPurple: '#bf00ff',
  neonGreen: '#00ff88',
  neonPink: '#ff0080',
  
  // Textes
  text: '#ffffff', // --text-primary
  textSecondary: '#e0e0e0', // --text-secondary
  textTertiary: '#b0b0b0', // --text-tertiary
  textMuted: '#808080', // --text-muted
  
  // Legacy (pour compatibilité)
  primary: '#bf00ff',
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);