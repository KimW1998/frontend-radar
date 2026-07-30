import { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Collapse,
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import RadarIcon from '@mui/icons-material/Radar'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import HubIcon from '@mui/icons-material/Hub'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import RefreshIcon from '@mui/icons-material/Refresh'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { DataSourcesIndicator } from '@/components/DataSourcesIndicator'
import { DetailDialog } from '@/components/DetailDialog'
import { ProjectSwitcher } from '@/components/ProjectSwitcher'
import type { DataSourceStatus } from '@/types'
import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useUiStore } from '@/stores'

const DRAWER_WIDTH = 260

interface NavChild {
  label: string
  path: string
  icon: ReactNode
}

interface NavGroup {
  id: string
  label: string
  icon: ReactNode
  children: NavChild[]
}

const TOP_NAV = [{ label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 20 }} /> }]

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'reading',
    label: 'Reading',
    icon: <AutoStoriesIcon sx={{ fontSize: 20 }} />,
    children: [
      { label: 'Articles', path: '/news', icon: <NewspaperIcon sx={{ fontSize: 18 }} /> },
      { label: 'Release notes', path: '/news/releases', icon: <NewReleasesIcon sx={{ fontSize: 18 }} /> },
      { label: 'TanStack', path: '/tanstack', icon: <HubIcon sx={{ fontSize: 18 }} /> },
    ],
  },
]

const BOTTOM_NAV = [{ label: 'Settings', path: '/settings', icon: <SettingsIcon sx={{ fontSize: 20 }} /> }]

const READING_PATHS = ['/news', '/news/releases', '/tanstack']

import { SECTION_NAV_LINKS } from '@/data/dashboard-sections'

interface AppLayoutProps {
  children: ReactNode
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: string
  dataSources?: DataSourceStatus[]
}

export function AppLayout({ children, onRefresh, isRefreshing, lastUpdated, dataSources }: AppLayoutProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const { sidebarOpen, toggleSidebar, closeSidebar, colorMode, toggleColorMode } = useUiStore()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const isDashboard = pathname === '/'
  const isReadingSection = READING_PATHS.includes(pathname)

  const [readingOpen, setReadingOpen] = useState(isReadingSection)

  useEffect(() => {
    if (isReadingSection) setReadingOpen(true)
  }, [isReadingSection])

  useEffect(() => {
    if (!isDesktop) closeSidebar()
  }, [pathname, isDesktop, closeSidebar])

  const handleNavClick = () => {
    if (!isDesktop) closeSidebar()
  }

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
        variant={isDesktop ? 'persistent' : 'temporary'}
        open={sidebarOpen}
        onClose={closeSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          ...(isDesktop && {
            width: sidebarOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
          }),
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

        <ProjectSwitcher />

        <List sx={{ px: 1, py: 1 }}>
          {TOP_NAV.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={pathname === item.path}
              onClick={handleNavClick}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { fontSize: '0.8125rem', fontWeight: 500 } }}
              />
            </ListItemButton>
          ))}

          {NAV_GROUPS.map((group) => {
            const groupActive = group.children.some((child) => pathname === child.path)
            const open = group.id === 'reading' ? readingOpen : false

            return (
              <Box key={group.id} sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => setReadingOpen((prev) => !prev)}
                  selected={groupActive}
                  sx={{
                    borderRadius: 2,
                    bgcolor: groupActive ? 'action.selected' : undefined,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: groupActive ? 'primary.main' : 'text.secondary' }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.label}
                    slotProps={{ primary: { fontSize: '0.8125rem', fontWeight: 600 } }}
                  />
                  {open ? (
                    <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  )}
                </ListItemButton>

                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 1 }}>
                    {group.children.map((child) => (
                      <ListItemButton
                        key={child.path}
                        component={Link}
                        to={child.path}
                        selected={pathname === child.path}
                        onClick={handleNavClick}
                        sx={{
                          borderRadius: 2,
                          mb: 0.25,
                          pl: 2.5,
                          minHeight: 36,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: 'text.secondary' }}>{child.icon}</ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          slotProps={{ primary: { fontSize: '0.75rem', fontWeight: 500 } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )
          })}

          {BOTTOM_NAV.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={pathname === item.path}
              onClick={handleNavClick}
              sx={{ borderRadius: 2, mb: 0.5, mt: 0.5 }}
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
            {SECTION_NAV_LINKS.map((link) => (
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
            px: { xs: 2, sm: 3 },
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

        <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: 2.5, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
      <DetailDialog />
    </Box>
  )
}
