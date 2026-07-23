import { Box, Chip, Stack, TextField, Typography, useTheme, alpha } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { FILTER_LABELS, type FilterCategory } from '@/types'
import { useFilterStore } from '@/stores'

const ALL_FILTERS: FilterCategory[] = [
  'security',
  'react',
  'typescript',
  'node',
  'testing',
  'ui-libraries',
  'infrastructure',
]

export function FilterBar() {
  const theme = useTheme()
  const { activeFilters, searchQuery, toggleFilter, clearFilters, setSearchQuery } =
    useFilterStore()

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: alpha(theme.palette.background.default, 0.85),
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        mb: 2,
        mx: -3,
        px: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Search updates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />,
            },
          }}
          sx={{
            width: 240,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              fontSize: '0.8125rem',
              borderRadius: 2,
            },
          }}
        />

        <Typography variant="caption" sx={{ color: 'text.secondary', mx: 0.5 }}>
          Filter:
        </Typography>

        {ALL_FILTERS.map((filter) => {
          const active = activeFilters.includes(filter)
          return (
            <Chip
              key={filter}
              label={FILTER_LABELS[filter]}
              size="small"
              onClick={() => toggleFilter(filter)}
              sx={{
                height: 28,
                fontSize: '0.75rem',
                cursor: 'pointer',
                bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                color: active ? 'primary.main' : 'text.secondary',
                border: '1px solid',
                borderColor: active ? alpha(theme.palette.primary.main, 0.3) : 'divider',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            />
          )
        })}

        {(activeFilters.length > 0 || searchQuery) && (
          <Chip
            label="Clear"
            size="small"
            onClick={clearFilters}
            sx={{
              height: 28,
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: 'error.main',
              bgcolor: alpha(theme.palette.error.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.2),
            }}
          />
        )}
      </Stack>
    </Box>
  )
}
