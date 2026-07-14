import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  id?: string
}

export function SectionCard({ title, subtitle, action, children, id }: SectionCardProps) {
  return (
    <Box id={id} sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  )
}
