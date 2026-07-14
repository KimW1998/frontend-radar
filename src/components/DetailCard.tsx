import { Box, IconButton, type SxProps, type Theme } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { ReactNode } from 'react'
import type { DetailContent } from '@/types/detail'
import { useDetailStore } from '@/stores/detail'

interface DetailCardProps {
  detail: DetailContent
  children: ReactNode
  sx?: SxProps<Theme>
}

export function DetailCard({ detail, children, sx }: DetailCardProps) {
  const showDetail = useDetailStore((s) => s.showDetail)

  return (
    <Box
      onClick={() => showDetail(detail)}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { transform: 'translateY(-1px)' },
        ...sx,
      }}
    >
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          showDetail(detail)
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'text.secondary',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': { color: 'primary.main' },
          zIndex: 1,
        }}
        aria-label="More information"
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
      {children}
    </Box>
  )
}
