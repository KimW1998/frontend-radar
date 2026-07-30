import { useState, type MouseEvent } from 'react'
import { IconButton, Snackbar, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { monoFont } from '@/theme'

interface CopyUpgradeButtonProps {
  command: string
  label?: string
  size?: 'small' | 'medium'
}

export function CopyUpgradeButton({ command, label = 'Copy upgrade command', size = 'small' }: CopyUpgradeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = command
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
    }
  }

  return (
    <>
      <Tooltip title={copied ? 'Copied!' : label}>
        <IconButton
          size={size}
          onClick={handleCopy}
          aria-label={label}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ContentCopyIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={
          <span style={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>{command}</span>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
