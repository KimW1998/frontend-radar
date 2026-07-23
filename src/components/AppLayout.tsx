import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import RadarIcon from '@mui/icons-material/Radar'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import HubIcon from '@mui/icons-material/Hub'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import RefreshIcon from '@mui/icons-material/Refresh'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { DataSourcesIndicator } from '@/components/DataSourcesIndicator'
import { DetailDialog } from '@/components/DetailDialog'
import type { DataSourceStatus } from '@/types'
import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useUiStore } from '@/stores'

const DRAWER_WIDTH = 240

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: 'Read', path: '/news', icon: <NewspaperIcon sx={{ fontSize: 20 }} /> },
  { label: 'TanStack', path: '/tanstack', icon: <HubIcon sx={{ fontSize: 20 }} /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon sx={{ fontSize: 20 }} /> },
]

const SECTION_LINKS = [
  { label: 'Executive Summary', hash: '#executive-summary' },
  { label: 'Health Score', hash: '#health-score' },
  { label: 'Dependencies', hash: '#dependency-watchlist' },
  { label: 'Node.js', hash: '#node-upgrade' },
  { label: 'Security', hash: '#security-center' },
  { label: 'Breaking Changes', hash: '#breaking-changes' },
]

interface AppLayoutProps {
  children: ReactNode
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: string
  dataSources?: DataSourceStatus[]
}

export function AppLayout({ children, onRefresh, isRefreshing, lastUpdated, dataSources }: AppLayoutProps) {
  const theme = useTheme()
  const { sidebarOpen, toggleSidebar, colorMode, toggleColorMode } = useUiStore()
  const routerState = useRouterState()
  const isDashboard = routerState.location.pathname === '/'

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: theme.tokens.gradient.hero,
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
            backgroundImage: theme.tokens.gradient.sidebar,
            borderRight: '1px solid',
            borderColor: 'divider',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              }}
            >
              <RadarIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Frontend Radar
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Dev Intelligence
              </Typography>
            </Box>
          </Stack>
        </Box>

        <List sx={{ px: 1, py: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={routerState.location.pathname === item.path}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { fontSize: '0.8125rem', fontWeight: 500 } }}
              />
            </ListItemButton>
          ))}
        </List>

        {isDashboard && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
                display: 'block',
                fontWeight: 600,
              }}
            >
              Sections
            </Typography>
            {SECTION_LINKS.map((link) => (
              <Typography
                key={link.hash}
                component="a"
                href={link.hash}
                variant="caption"
                sx={{
                  display: 'block',
                  py: 0.4,
                  color: 'text.secondary',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <DataSourcesIndicator sources={dataSources} />
              {colorMode === 'dark' ? (
                <DarkModeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              ) : (
                <LightModeIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              )}
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {colorMode === 'dark' ? 'Dark' : 'Light'}
              </Typography>
            </Stack>
            <Switch size="small" checked={colorMode === 'light'} onChange={toggleColorMode} />
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={toggleSidebar} sx={{ color: 'text.secondary' }}>
              <MenuIcon fontSize="small" />
            </IconButton>
            {lastUpdated && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Updated {new Date(lastUpdated).toLocaleString()}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton size="small" onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
                {colorMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            {onRefresh && (
              <Tooltip title="Refresh data">
                <IconButton size="small" onClick={onRefresh} disabled={isRefreshing} sx={{ color: 'text.secondary' }}>
                  {isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        <Box component="main" sx={{ flex: 1, px: 3, py: 2.5, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
      <DetailDialog />
    </Box>
  )
}
