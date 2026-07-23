import { useMemo, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import HubIcon from '@mui/icons-material/Hub'
import type { CuratedSource, KnowledgeArticle } from '@/types/knowledge'
import { TONE_COLORS, TONE_LABELS } from '@/types/knowledge'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { DetailCard } from '@/components/DetailCard'
import { buildArticleDetail } from '@/lib/detail-builders'
import { cardSx } from '@/theme'

export function TanStackPage() {
  const theme = useTheme()
  const { data, isLoading, isError, isFetching } = useKnowledgeData()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArticles = useMemo(() => {
    if (!data) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return data.tanStackArticles
    return data.tanStackArticles.filter((article) =>
      [article.title, article.excerpt, article.source].some((field) => field.toLowerCase().includes(q)),
    )
  }, [data, searchQuery])

  if (isLoading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Gathering TanStack updates…
        </Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Couldn't load TanStack reading</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Check your connection and try again.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: 3 }}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <HubIcon sx={{ color: '#06B6D4' }} />
          <Typography variant="h1">TanStack</Typography>
          <Chip
            label="Router · Query · Table · Start"
            size="small"
            sx={{
              height: 24,
              bgcolor: alpha('#06B6D4', 0.12),
              color: '#06B6D4',
              fontWeight: 600,
            }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 600 }}>
          Routing APIs, query hooks, table primitives, and release notes — a dedicated feed for the TanStack ecosystem.
          {isFetching && ' Refreshing…'}
        </Typography>

        <TextField
          size="small"
          placeholder="Search TanStack articles…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />,
            },
          }}
          sx={{ width: 280, mb: 2.5, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
        />

        {filteredArticles.length === 0 ? (
          <Box sx={{ ...cardSx(theme), textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {searchQuery ? 'No articles match your search.' : 'No TanStack articles loaded yet.'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {searchQuery
                ? 'Try a different search term.'
                : 'RSS and GitHub release feeds load via Netlify functions. Use the doc links on the right.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {filteredArticles.map((article) => (
              <TanStackArticleCard key={article.id} article={article} />
            ))}
          </Stack>
        )}
      </Box>

      <Box>
        <Typography variant="h3" sx={{ mb: 0.5 }}>Docs & releases</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Official references for new Router, Query, and Table APIs.
        </Typography>
        <Stack spacing={1}>
          {data.tanStackSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function TanStackArticleCard({ article }: { article: KnowledgeArticle }) {
  const theme = useTheme()
  const toneColor = TONE_COLORS[article.tone]

  return (
    <DetailCard
      detail={buildArticleDetail(article)}
      sx={{
        ...cardSx(theme),
        pr: 5,
        borderLeft: '3px solid #06B6D4',
      }}
    >
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

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, lineHeight: 1.6 }}>
        {article.excerpt}
      </Typography>

      <Link
        href={article.sourceUrl}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        sx={{ fontSize: '0.8125rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        Read <OpenInNewIcon sx={{ fontSize: 13 }} />
      </Link>
    </DetailCard>
  )
}

function SourceCard({ source }: { source: CuratedSource }) {
  const theme = useTheme()

  return (
    <Box
      component="a"
      href={source.url}
      target="_blank"
      rel="noopener"
      sx={{
        ...cardSx(theme),
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        p: 1.5,
        borderColor: alpha('#06B6D4', 0.2),
        '&:hover': { borderColor: alpha('#06B6D4', 0.45) },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{source.emoji}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
            {source.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
            {source.description}
          </Typography>
        </Box>
        <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled', mt: 0.25 }} />
      </Stack>
    </Box>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
