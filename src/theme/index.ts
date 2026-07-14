import { createTheme, alpha, type Theme } from '@mui/material/styles'
import type { ColorMode } from './tokens'
import { darkTokens, lightTokens } from './tokens'

declare module '@mui/material/styles' {
  interface Theme {
    tokens: typeof darkTokens
    colorMode: ColorMode
  }
  interface ThemeOptions {
    tokens?: typeof darkTokens
    colorMode?: ColorMode
  }
}

const sharedTypography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  h1: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' },
  h2: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' },
  h3: { fontSize: '1rem', fontWeight: 600 },
  body1: { fontSize: '0.875rem', lineHeight: 1.6 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
  caption: { fontSize: '0.75rem' },
}

const sharedComponents = (theme: Theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor:
          theme.colorMode === 'dark' ? '#2A2A2E #0A0A0B' : '#D4D4D8 #FAFAFA',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.colorMode === 'dark' ? '#2A2A2E' : '#D4D4D8',
          borderRadius: 3,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 500, fontSize: '0.75rem' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none' as const, fontWeight: 500 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.15s ease',
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.14),
          },
        },
      },
    },
  },
})

export function getTheme(mode: ColorMode): Theme {
  const tokens = mode === 'dark' ? darkTokens : lightTokens

  if (mode === 'dark') {
    return createTheme({
      colorMode: mode,
      tokens,
      palette: {
        mode: 'dark',
        primary: { main: '#3B82F6' },
        secondary: { main: '#8B5CF6' },
        success: { main: '#22C55E' },
        warning: { main: '#EAB308' },
        error: { main: '#EF4444' },
        info: { main: '#06B6D4' },
        background: { default: '#0A0A0B', paper: '#111113' },
        text: { primary: '#EDEDEF', secondary: '#8B8B8E' },
        divider: '#1F1F23',
      },
      typography: {
        ...sharedTypography,
        caption: { ...sharedTypography.caption, color: '#8B8B8E' },
      },
      shape: { borderRadius: 10 },
      components: sharedComponents(
        createTheme({ palette: { mode: 'dark' }, colorMode: mode, tokens }),
      ),
    })
  }

  return createTheme({
    colorMode: mode,
    tokens,
    palette: {
      mode: 'light',
      primary: { main: '#2563EB' },
      secondary: { main: '#7C3AED' },
      success: { main: '#16A34A' },
      warning: { main: '#CA8A04' },
      error: { main: '#DC2626' },
      info: { main: '#0891B2' },
      background: { default: '#FAFAFA', paper: '#FFFFFF' },
      text: { primary: '#18181B', secondary: '#71717A' },
      divider: '#E4E4E7',
    },
    typography: {
      ...sharedTypography,
      caption: { ...sharedTypography.caption, color: '#71717A' },
    },
    shape: { borderRadius: 10 },
    components: sharedComponents(
      createTheme({ palette: { mode: 'light' }, colorMode: mode, tokens }),
    ),
  })
}

export const monoFont = '"JetBrains Mono", monospace'

export function cardSx(theme: Theme) {
  return {
    p: 2,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      borderColor: theme.tokens.border.strong,
      boxShadow:
        theme.colorMode === 'dark'
          ? '0 4px 24px rgba(0,0,0,0.2)'
          : '0 4px 24px rgba(0,0,0,0.04)',
    },
  }
}
