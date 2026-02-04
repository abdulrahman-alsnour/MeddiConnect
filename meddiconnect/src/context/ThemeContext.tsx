import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('patientGeneralSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setMode(parsed.theme || 'light');
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    }

    // Also check for doctor settings
    const savedDoctorSettings = localStorage.getItem('doctorGeneralSettings');
    if (savedDoctorSettings) {
      try {
        const parsed = JSON.parse(savedDoctorSettings);
        setMode(parsed.theme || 'light');
      } catch (error) {
        console.error('Error loading doctor theme:', error);
      }
    }
  }, []);

  // Determine actual theme based on mode
  const actualTheme = useMemo(() => {
    if (mode === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode]);

  // Create MUI theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: actualTheme,
          primary: {
            main: actualTheme === 'dark' ? '#90caf9' : '#2196f3',
          },
          secondary: {
            main: actualTheme === 'dark' ? '#f48fb1' : '#f50057',
          },
          background: {
            default: actualTheme === 'dark' ? '#121212' : '#f5f5f5',
            paper: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: actualTheme === 'dark' ? '#ffffff' : '#000000',
            secondary: actualTheme === 'dark' ? '#b0b0b0' : '#666666',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 500,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [actualTheme]
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = {
    mode,
    setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

