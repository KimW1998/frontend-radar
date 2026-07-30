import { Stack, Typography } from '@mui/material'
import { CopyUpgradeButton } from '@/components/CopyUpgradeButton'
import { monoFont } from '@/theme'

interface UpgradeCommandRowProps {
  command: string
  compact?: boolean
}

export function UpgradeCommandRow({ command, compact }: UpgradeCommandRowProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      onClick={(e) => e.stopPropagation()}
      sx={{
        mt: compact ? 0 : 1,
        px: 1,
        py: 0.5,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: monoFont,
          color: 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {command}
      </Typography>
      <CopyUpgradeButton command={command} />
    </Stack>
  )
}
