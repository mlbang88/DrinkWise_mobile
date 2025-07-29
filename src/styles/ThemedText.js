// ThemedText.js
import React from 'react';
import { useTheme } from './ThemeContext.jsx';

const ThemedText = ({ style, ...props }) => {
  const { theme } = useTheme();

  return (
    <span
      style={{ color: theme.text, ...style }}
      {...props}
    />
  );
};

export default ThemedText;