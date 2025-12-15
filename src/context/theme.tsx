import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextData {
  isDarkMode: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    primary: string;
    error: string;
    success: string;
  };
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';

  const colors = isDarkMode
    ? {
        // Tema escuro
        background: '#202026',
        surface: '#2a2a30',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#3a3a40',
        card: '#2a2a30',
        primary: '#65a653',
        error: '#ff6b6b',
        success: '#8ED36D',
      }
    : {
        // Tema claro
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#e0e0e0',
        card: '#ffffff',
        primary: '#65a653',
        error: '#ff6b6b',
        success: '#8ED36D',
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
