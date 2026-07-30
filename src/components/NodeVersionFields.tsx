import { Box, Stack, TextField, Typography } from '@mui/material'
import { monoFont } from '@/theme'

interface NodeVersionFieldsProps {
  nodeVersion: string
  enginesNodeRequirement?: string
  onNodeVersionChange: (value: string) => void
  nodeHelperText?: string
  compact?: boolean
}

export function NodeVersionFields({
  nodeVersion,
  enginesNodeRequirement,
  onNodeVersionChange,
  nodeHelperText = 'We may pre-fill from package.json engines.node. Always confirm with node -v.',
  compact,
}: NodeVersionFieldsProps) {
  return (
    <Stack spacing={2}>
      {enginesNodeRequirement ? (
        <Box>
          <TextField
            label="Project requires (from package.json)"
            value={enginesNodeRequirement}
            size={compact ? 'small' : 'medium'}
            fullWidth={!compact}
            InputProps={{ readOnly: true }}
            sx={{
              maxWidth: compact ? 360 : undefined,
              '& input': { fontFamily: monoFont, color: 'text.secondary' },
            }}
            helperText="What the app declares in engines.node — not necessarily what you run"
          />
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          No engines.node found in package.json yet.
        </Typography>
      )}

      <TextField
        label="Node version you run"
        value={nodeVersion}
        onChange={(e) => onNodeVersionChange(e.target.value)}
        size={compact ? 'small' : 'medium'}
        placeholder="e.g. 22.14.0"
        sx={{
          width: compact ? 280 : 320,
          '& input': { fontFamily: monoFont },
        }}
        helperText={nodeHelperText}
      />
    </Stack>
  )
}

interface NodeRequirementBannerProps {
  enginesNodeRequirement?: string
  nodeVersion: string
}

export function NodeRequirementBanner({ enginesNodeRequirement, nodeVersion }: NodeRequirementBannerProps) {
  if (!enginesNodeRequirement && !nodeVersion) return null

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 0.5, sm: 3 }}
      sx={{
        mb: 2,
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {enginesNodeRequirement && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Project requires{' '}
          <Typography component="span" variant="caption" sx={{ fontFamily: monoFont, color: 'text.primary' }}>
            {enginesNodeRequirement}
          </Typography>
        </Typography>
      )}
      {nodeVersion && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          You run{' '}
          <Typography component="span" variant="caption" sx={{ fontFamily: monoFont, color: 'primary.main', fontWeight: 600 }}>
            v{nodeVersion}
          </Typography>
        </Typography>
      )}
    </Stack>
  )
}
