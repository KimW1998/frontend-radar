import { Chip, Link, Stack, Typography, useTheme, alpha } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { KnowledgeArticle } from '@/types/knowledge'
import { TONE_COLORS, TONE_LABELS } from '@/types/knowledge'
import { DetailCard } from '@/components/DetailCard'
import { buildArticleDetail } from '@/lib/detail-builders'
import { cardSx } from '@/theme'

export function FeaturedCard({ article }: { article: KnowledgeArticle }) {
  const theme = useTheme()
  const toneColor = TONE_COLORS[article.tone]

  return (
    <DetailCard
      detail={buildArticleDetail(article)}
      sx={{
        ...cardSx(theme),
        p: 3,
        pr: 5,
        background: `linear-gradient(135deg, ${alpha(toneColor, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 60%)`,
        borderColor: alpha(toneColor, 0.25),
      }}
    >
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
        <Chip label="Featured" size="small" sx={{ bgcolor: alpha(toneColor, 0.15), color: toneColor, fontWeight: 600 }} />
        <Chip label={article.source} size="small" sx={{ bgcolor: theme.tokens.surface.hover }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
          {formatDate(article.publishedAt)} · {article.readTimeMinutes} min read
        </Typography>
      </Stack>
      <Typography variant="h2" sx={{ mb: 1, lineHeight: 1.3 }}>
        {article.title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.7 }}>
        {article.excerpt}
      </Typography>
      <ReadLink url={article.sourceUrl} />
    </DetailCard>
  )
}

export function ArticleCard({ article }: { article: KnowledgeArticle }) {
  const theme = useTheme()
  const toneColor = TONE_COLORS[article.tone]

  return (
    <DetailCard detail={buildArticleDetail(article)} sx={{ ...cardSx(theme), pr: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.75} flexWrap="wrap" useFlexGap>
        <Chip
          label={TONE_LABELS[article.tone]}
          size="small"
          sx={{ height: 20, fontSize: '0.6875rem', bgcolor: `${toneColor}18`, color: toneColor }}
        />
        <Chip label={article.source} size="small" sx={{ height: 20, fontSize: '0.6875rem', bgcolor: theme.tokens.surface.hover }} />
        <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
          {formatDate(article.publishedAt)} · {article.readTimeMinutes} min
        </Typography>
      </Stack>

      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.4 }}>
        {article.title}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, lineHeight: 1.6 }}>
        {article.excerpt}
      </Typography>

      <ReadLink url={article.sourceUrl} />
    </DetailCard>
  )
}

function ReadLink({ url }: { url: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      sx={{
        fontSize: '0.875rem',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      Read article <OpenInNewIcon sx={{ fontSize: 14 }} />
    </Link>
  )
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
