import { Button } from '@mui/material'
import SnoozeIcon from '@mui/icons-material/Snooze'
import { DEFAULT_SNOOZE_DAYS } from '@/lib/alert-snooze'
import { useSettingsStore } from '@/stores'

interface SnoozeAlertButtonProps {
  alertKey: string
  days?: number
  size?: 'small' | 'medium'
}

export function SnoozeAlertButton({ alertKey, days = DEFAULT_SNOOZE_DAYS, size = 'small' }: SnoozeAlertButtonProps) {
  const snoozeAlert = useSettingsStore((s) => s.snoozeAlert)

  return (
    <Button
      size={size}
      variant="text"
      color="inherit"
      startIcon={<SnoozeIcon fontSize="small" />}
      onClick={(event) => {
        event.stopPropagation()
        snoozeAlert(alertKey, days)
      }}
      sx={{ color: 'text.secondary', flexShrink: 0 }}
    >
      Snooze {days}d
    </Button>
  )
}
