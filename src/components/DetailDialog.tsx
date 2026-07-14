import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { AiSummaryCard } from '@/components/AiSummaryCard'
import { useDetailEnrichment } from '@/hooks/useDetailEnrichment'
import { useDetailStore } from '@/stores/detail'
import type { DetailSection } from '@/types/detail'
import { monoFont } from '@/theme'

const COLLAPSED_LINES = 6

function DetailSectionBlock({ section }: { section: DetailSection }) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(!section.collapsible)
  const isLong = section.collapsible && section.content.length > 300

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {section.title}
      </Typography>
      <Box
        sx={{
          p: 1.5,
          bgcolor: theme.tokens.surface.nested,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          maxHeight: expanded || !isLong ? 'none' : `${COLLAPSED_LINES * 1.5}rem`,
          overflow: expanded || !isLong ? 'visible' : 'hidden',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            lineHeight: 1.7,
            fontFamily: section.mono ? monoFont : undefined,
            whiteSpace: 'pre-wrap',
          }}
        >
          {section.content}
        </Typography>
      </Box>
      {isLong && (
        <Button size="small" onClick={() => setExpanded((v) => !v)} sx={{ mt: 0.5, minWidth: 0, px: 0 }}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </Box>
  )
}

export function DetailDialog() {
  const theme = useTheme()
  const { open, content, hideDetail } = useDetailStore()
  const { extraSections, loading } = useDetailEnrichment(content, open)

  if (!content) return null

  const allSections = [...(content.sections ?? []), ...extraSections]

  return (
    <Dialog
      open={open}
      onClose={hideDetail}
      maxWidth="md"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap>
          {content.badge && (
            <Chip
              label={content.badge.label}
              size="small"
              sx={{
                bgcolor: `${content.badge.color}18`,
                color: content.badge.color,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          )}
          {content.tags?.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.6875rem', color: 'text.secondary' }}
            />
          ))}
        </Stack>
        <Typography variant="h2" sx={{ mt: 1, lineHeight: 1.3 }}>
          {content.title}
        </Typography>
        {content.subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: monoFont, display: 'block', mt: 0.5 }}>
            {content.subtitle}
          </Typography>
        )}
        <IconButton
          onClick={hideDetail}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {content.fields && content.fields.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mb: 2,
              p: 1.5,
              bgcolor: theme.tokens.surface.nested,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {content.fields.map((field) => (
              <Box key={field.label}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {field.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: field.mono ? monoFont : undefined,
                    color: field.highlight ? 'primary.main' : 'text.primary',
                    fontWeight: field.highlight ? 500 : 400,
                  }}
                >
                  {field.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {content.body && (
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
            {content.body}
          </Typography>
        )}

        {content.breakingApiChanges && content.breakingApiChanges.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#F9731630',
              bgcolor: '#F973160A',
            }}
          >
            <Typography variant="caption" sx={{ color: '#F97316', fontWeight: 700, display: 'block', mb: 1 }}>
              Breaking API changes ({content.breakingApiChanges.length})
            </Typography>
            <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
              {content.breakingApiChanges.map((item, i) => (
                <Typography key={i} component="li" variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {allSections.map((section) => (
          <DetailSectionBlock key={section.title} section={section} />
        ))}

        {loading && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: 'text.secondary' }}>
            <CircularProgress size={14} />
            <Typography variant="caption">Loading registry metadata…</Typography>
          </Stack>
        )}

        {content.bullets && content.bullets.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Details
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
              {content.bullets.map((bullet, i) => (
                <Typography key={i} component="li" variant="body2" sx={{ color: 'text.primary' }}>
                  {bullet}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {content.codeBlock && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Code example
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                m: 0,
                bgcolor: theme.tokens.code.bg,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                fontFamily: monoFont,
                fontSize: '0.75rem',
                lineHeight: 1.5,
                overflow: 'auto',
                color: theme.tokens.code.text,
                whiteSpace: 'pre-wrap',
              }}
            >
              {content.codeBlock}
            </Box>
          </Box>
        )}

        {content.summary && (
          <Box sx={{ mb: 2 }}>
            <AiSummaryCard summary={content.summary} />
          </Box>
        )}

        {(content.links?.length || content.sourceUrl) && (
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{ pt: 0.5 }}>
            {content.links?.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 500, fontSize: '0.875rem' }}
              >
                {link.label} <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
            ))}
            {content.sourceUrl && !content.links?.some((l) => l.url === content.sourceUrl) && (
              <Link
                href={content.sourceUrl}
                target="_blank"
                rel="noopener"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 500, fontSize: '0.875rem' }}
              >
                {content.sourceLabel ?? 'Learn more'} <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
