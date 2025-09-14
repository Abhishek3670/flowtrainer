import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import adminTheme from './adminTheme';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      card: string;
      cardHover: string;
    };
  }
  // Allow configuration using `createTheme`
  interface ThemeOptions {
    customShadows?: {
      card?: string;
      cardHover?: string;
    };
  }
}

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

const AdminThemeProvider: React.FC<AdminThemeProviderProps> = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
    const baseTheme = createTheme({
      ...adminTheme,
      palette: {
        ...adminTheme.palette,
        mode: prefersDarkMode ? 'dark' : 'light',
      },
      customShadows: {
        card: '0 2px 8px rgba(0,0,0,0.05)',
        cardHover: '0 4px 12px rgba(0,0,0,0.1)',
      },
    });

    // Extend the theme with custom components or overrides
    return createTheme(baseTheme, {
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: baseTheme.palette.background.default,
              color: baseTheme.palette.text.primary,
              lineHeight: 1.5,
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: baseTheme.palette.background.paper,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: baseTheme.palette.divider,
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: baseTheme.palette.action.hover,
                },
              },
            },
            a: {
              color: baseTheme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          },
        },
      },
    });
  }, [prefersDarkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </EmotionThemeProvider>
    </MuiThemeProvider>
  );
};

export default AdminThemeProvider;
