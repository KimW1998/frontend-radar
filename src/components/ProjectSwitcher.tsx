import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useSettingsStore } from '@/stores'

export function ProjectSwitcher() {
  const activeProject = useActiveProject()
  const { projects, setActiveProject } = useSettingsStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  if (projects.length === 0) {
    return (
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button
          component={Link}
          to="/onboarding"
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          fullWidth
          sx={{ justifyContent: 'flex-start' }}
        >
          Add your first project
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
          display: 'block',
          mb: 0.75,
        }}
      >
        Project
      </Typography>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ExpandMoreIcon />}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          textAlign: 'left',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 1,
        }}
      >
        <Stack sx={{ minWidth: 0, alignItems: 'flex-start' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
            {activeProject?.name ?? 'Select project'}
          </Typography>
          {activeProject && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {getConfiguredPackageCount(activeProject.configuredVersions)} packages
              {activeProject.nodeVersion ? ` · Node ${activeProject.nodeVersion}` : ''}
            </Typography>
          )}
        </Stack>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {projects.map((project) => (
          <MenuItem
            key={project.id}
            selected={project.id === activeProject?.id}
            onClick={() => {
              setActiveProject(project.id)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {project.id === activeProject?.id ? (
                <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              ) : (
                <FolderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={project.name}
              secondary={`${getConfiguredPackageCount(project.configuredVersions)} packages`}
              slotProps={{
                primary: { fontSize: '0.8125rem', fontWeight: 500 },
                secondary: { fontSize: '0.6875rem' },
              }}
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          component={Link}
          to="/onboarding?new=1"
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText primary="Add project" slotProps={{ primary: { fontSize: '0.8125rem' } }} />
        </MenuItem>
      </Menu>
    </Box>
  )
}
