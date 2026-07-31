import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563EB',
        light: '#3B82F6',
        dark: '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isLight ? '#F8FAFC' : '#1E293B',
        light: isLight ? '#FFFFFF' : '#334155',
        dark: isLight ? '#E2E8F0' : '#0F172A',
        contrastText: isLight ? '#0F172A' : '#F8FAFC',
      },
      background: {
        default: isLight ? '#F8FAFC' : '#0F172A',
        paper: isLight ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: isLight ? '#0F172A' : '#F1F5F9',
        secondary: isLight ? '#475569' : '#94A3B8',
      },
      success: {
        main: '#22C55E',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#F59E0B',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#EF4444',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#3B82F6',
        contrastText: '#FFFFFF',
      },
      divider: isLight ? '#E2E8F0' : '#334155',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isLight 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
            backgroundImage: 'none',
            border: `1px solid ${isLight ? '#E2E8F0' : '#334155'}`,
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
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isLight ? '#E2E8F0' : '#334155'}`,
          },
        },
      },
    },
  });
};
