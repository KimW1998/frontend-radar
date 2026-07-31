import { useState, type MouseEvent, type ReactNode } from 'react'
import { Button, Snackbar, type ButtonProps } from '@mui/material'

interface CopyTextButtonProps extends Omit<ButtonProps, 'onClick'> {
  text: string
  copiedLabel?: string
  snackbarMessage?: string
}

export function CopyTextButton({
  text,
  children,
  copiedLabel = 'Copied!',
  snackbarMessage,
  disabled,
  ...buttonProps
}: CopyTextButtonProps & { children: ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
  }

  return (
    <>
      <Button {...buttonProps} disabled={disabled || copied} onClick={handleCopy}>
        {copied ? copiedLabel : children}
      </Button>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={snackbarMessage ?? 'Copied to clipboard'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
