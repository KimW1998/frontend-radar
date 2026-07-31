import { Alert, Button, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'

export function TrackedPackagesEmptyBanner() {
  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button component={Link} to="/settings" size="small" color="inherit">
          Choose packages
        </Button>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
        No packages are being monitored
      </Typography>
      <Typography variant="body2">
        You imported dependencies but none are checked for tracking. Open Settings → Tracked packages and
        select at least one package to populate the dashboard.
      </Typography>
    </Alert>
  )
}
