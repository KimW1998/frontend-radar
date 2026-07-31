import { Box, Button, Typography, useTheme } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import { Link } from '@tanstack/react-router'
import type { SectionEmptyVariant } from '@/lib/section-empty'
import { cardSx } from '@/theme'

const COPY: Record<
  SectionEmptyVariant,
  { title: string; description: string; showSetupLink?: boolean }
> = {
  filtered: {
    title: 'No matches for current filters',
    description: 'Try clearing category filters or your search query.',
  },
  'all-clear': {
    title: 'All clear',
    description: 'Nothing to report here right now.',
  },
  'not-configured': {
    title: 'Set up this project first',
    description:
      'Import your package.json to compare installed versions and run vulnerability checks.',
    showSetupLink: true,
  },
}

const ICONS: Record<SectionEmptyVariant, React.ReactNode> = {
  filtered: <FilterListOffIcon sx={{ fontSize: 28, color: 'text.secondary' }} />,
  'all-clear': <CheckCircleOutlineIcon sx={{ fontSize: 28, color: 'success.main' }} />,
  'not-configured': <SettingsSuggestIcon sx={{ fontSize: 28, color: 'primary.main' }} />,
}

interface EmptySectionStateProps {
  variant: SectionEmptyVariant
  title?: string
  description?: string
  onClearFilters?: () => void
  actionLabel?: string
  actionTo?: string
}

export function EmptySectionState({
  variant,
  title,
  description,
  onClearFilters,
  actionLabel,
  actionTo,
}: EmptySectionStateProps) {
  const theme = useTheme()
  const copy = COPY[variant]

  return (
    <Box sx={{ ...cardSx(theme), textAlign: 'center', py: 3, px: 2 }}>
      <Box sx={{ mb: 1 }}>{ICONS[variant]}</Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title ?? copy.title}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        {description ?? copy.description}
      </Typography>
      {variant === 'filtered' && onClearFilters && (
        <Button size="small" variant="outlined" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
      {copy.showSetupLink && (
        <Button
          size="small"
          variant="contained"
          component={Link}
          to={actionTo ?? '/onboarding'}
        >
          {actionLabel ?? 'Set up project'}
        </Button>
      )}
    </Box>
  )
}
