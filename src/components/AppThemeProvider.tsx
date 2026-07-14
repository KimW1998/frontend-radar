import { useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useUiStore } from '@/stores'
import { getTheme } from '@/theme'

interface AppThemeProviderProps {
  children: React.ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const colorMode = useUiStore((s) => s.colorMode)
  const theme = useMemo(() => getTheme(colorMode), [colorMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
