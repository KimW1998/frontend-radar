import { Box, CircularProgress, Skeleton, Typography } from '@mui/material'
import { SectionCard } from '@/components/SectionCard'

interface SectionSkeletonProps {
  title: string
  subtitle?: string
  id?: string
  rows?: number
}

export function SectionSkeleton({ title, subtitle, id, rows = 3 }: SectionSkeletonProps) {
  return (
    <SectionCard title={title} subtitle={subtitle} id={id}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Loading live data…
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gap: 1 }}>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={i === 0 ? 88 : 64} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </SectionCard>
  )
}
