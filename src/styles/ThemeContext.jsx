// ThemeContext.js
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

const theme = {
  background: '#222',
  text: '#fff',
  primary: '#1e90ff',
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => useContext(ThemeContext);