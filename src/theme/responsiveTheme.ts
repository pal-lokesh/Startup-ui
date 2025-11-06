import { createTheme, ThemeOptions } from '@mui/material/styles';

// Responsive breakpoints
export const breakpoints = {
  xs: 0,      // Mobile (portrait)
  sm: 480,    // Mobile (landscape) / Small tablets
  md: 768,    // Tablets
  lg: 1024,   // Desktop
  xl: 1440,   // Large desktop
  xxl: 1920,  // 4K / Ultrawide
} as const;

// Calculate responsive font sizes using clamp()
// clamp(min, preferred, max)
const fluidTypography = {
  h1: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    lineHeight: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontWeight: 700,
  },
  h2: {
    fontSize: 'clamp(1.75rem, 4vw, 3rem)',
    lineHeight: 'clamp(2.25rem, 5vw, 3.75rem)',
    fontWeight: 700,
  },
  h3: {
    fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
    lineHeight: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 600,
  },
  h4: {
    fontSize: 'clamp(1.25rem, 3vw, 2rem)',
    lineHeight: 'clamp(1.75rem, 3.5vw, 2.5rem)',
    fontWeight: 600,
  },
  h5: {
    fontSize: 'clamp(1.125rem, 2.5vw, 1.75rem)',
    lineHeight: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: 600,
  },
  h6: {
    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
    lineHeight: 'clamp(1.375rem, 2.5vw, 2rem)',
    fontWeight: 600,
  },
  body1: {
    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
    lineHeight: 'clamp(1.25rem, 2vw, 1.5rem)',
  },
  body2: {
    fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
    lineHeight: 'clamp(1.125rem, 1.75vw, 1.375rem)',
  },
  button: {
    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
    lineHeight: 'clamp(1.25rem, 2vw, 1.5rem)',
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: 'clamp(0.625rem, 1vw, 0.75rem)',
    lineHeight: 'clamp(0.875rem, 1.5vw, 1.125rem)',
  },
  overline: {
    fontSize: 'clamp(0.625rem, 1vw, 0.75rem)',
    lineHeight: 'clamp(0.875rem, 1.5vw, 1.125rem)',
    textTransform: 'uppercase' as const,
  },
};

// Responsive spacing function
// Uses viewport units for dynamic scaling
export const getResponsiveSpacing = (base: number): string => {
  // Base spacing in rem, scales with viewport
  return `clamp(${base * 0.5}rem, ${base}vw, ${base * 1.5}rem)`;
};

// Responsive spacing scale
export const spacing = {
  xs: getResponsiveSpacing(0.5),   // ~0.5rem - 0.75rem
  sm: getResponsiveSpacing(1),     // ~1rem - 1.5rem
  md: getResponsiveSpacing(1.5),    // ~1.5rem - 2.25rem
  lg: getResponsiveSpacing(2),      // ~2rem - 3rem
  xl: getResponsiveSpacing(3),      // ~3rem - 4.5rem
  xxl: getResponsiveSpacing(4),     // ~4rem - 6rem
};

// Create responsive theme
export const createResponsiveTheme = () => {
  return createTheme({
    breakpoints: {
      values: breakpoints,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      ...fluidTypography,
      // Responsive font sizes for specific components
      subtitle1: {
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        lineHeight: 'clamp(1.375rem, 2.5vw, 1.75rem)',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
        lineHeight: 'clamp(1.25rem, 2vw, 1.5rem)',
        fontWeight: 500,
      },
    },
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    // Note: shape.borderRadius expects a number, not a string
    // Responsive border radius is handled via component overrides below
    components: {
      // Responsive AppBar
      MuiAppBar: {
        styleOverrides: {
          root: {
            height: 'clamp(56px, 8vh, 64px)',
          },
        },
      },
      // Responsive Toolbar
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: 'clamp(56px, 8vh, 64px) !important',
            padding: 'clamp(8px, 1vw, 16px)',
          },
        },
      },
      // Responsive Buttons
      MuiButton: {
        styleOverrides: {
          root: {
            padding: 'clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px)',
            minHeight: 'clamp(36px, 5vh, 48px)',
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            borderRadius: 'clamp(4px, 0.5vw, 8px)',
          },
        },
      },
      // Responsive Cards
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 'clamp(8px, 1vw, 12px)',
            padding: 'clamp(12px, 2vw, 24px)',
          },
        },
      },
      // Responsive Inputs
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            },
          },
        },
      },
      // Responsive Icons
      MuiIconButton: {
        styleOverrides: {
          root: {
            padding: 'clamp(8px, 1vw, 12px)',
            '& .MuiSvgIcon-root': {
              fontSize: 'clamp(20px, 2.5vw, 24px)',
            },
          },
        },
      },
      // Responsive Drawer
      MuiDrawer: {
        styleOverrides: {
          paper: {
            width: 'clamp(240px, 30vw, 280px)',
          },
        },
      },
      // Responsive Paper
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 'clamp(4px, 0.5vw, 8px)',
          },
        },
      },
      // Responsive Typography
      MuiTypography: {
        styleOverrides: {
          root: {
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          },
        },
      },
    },
  });
};

export default createResponsiveTheme;
