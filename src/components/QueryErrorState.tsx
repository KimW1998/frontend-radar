import { Box, Button, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

interface QueryErrorStateProps {
  title: string
  message?: string
  onRetry: () => void
  isRetrying?: boolean
}

export function QueryErrorState({
  title,
  message = 'Check your network connection and try again.',
  onRetry,
  isRetrying,
}: QueryErrorStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {message}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Retrying…' : 'Try again'}
      </Button>
    </Box>
  )
}
