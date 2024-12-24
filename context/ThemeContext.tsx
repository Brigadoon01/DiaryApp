import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../types';

const defaultTheme: Theme = {
  name: 'Light',
  backgroundColor: '#ffffff',
  primaryColor: '#3b82f6',
  secondaryColor: '#e2e8f0',
  textColor: '#1a202c',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => void 0,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme) as Theme;
          // Validate the theme structure
          if (
            'name' in parsedTheme &&
            'backgroundColor' in parsedTheme &&
            'primaryColor' in parsedTheme &&
            'secondaryColor' in parsedTheme &&
            'textColor' in parsedTheme
          ) {
            setTheme(parsedTheme);
          }
        }
      } catch (error) {
        console.error('Error loading saved theme:', error);
      }
    };
    loadSavedTheme();
  }, []);

  const updateTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

