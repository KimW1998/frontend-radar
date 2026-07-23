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
import MenuBookIcon from '@mui/icons-material/MenuBook'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { FILTER_LABELS, type FilterCategory } from '@/types'
import {
  TONE_COLORS,
  TONE_LABELS,
  type CuratedSource,
  type KnowledgeArticle,
} from '@/types/knowledge'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { isTanStackKnowledgeArticle } from '@/services/knowledge'
import { matchesFilter } from '@/stores'
import { DetailCard } from '@/components/DetailCard'
import { buildArticleDetail } from '@/lib/detail-builders'
import { cardSx } from '@/theme'

const TOPIC_FILTERS: FilterCategory[] = [
  'react',
  'typescript',
  'node',
  'testing',
  'ui-libraries',
  'infrastructure',
]

export function NewsPage() {
  const theme = useTheme()
  const { data, isLoading, isError, isFetching } = useKnowledgeData()
  const [topicFilters, setTopicFilters] = useState<FilterCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.articles
      .filter((article) => !isTanStackKnowledgeArticle(article))
      .filter((article) =>
      matchesFilter(article.topics, topicFilters, searchQuery, [
        article.title,
        article.excerpt,
        article.source,
      ]),
    )
  }, [data, topicFilters, searchQuery])

  const [featured, ...rest] = filtered

  if (isLoading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Gathering today's frontend reading…
        </Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Couldn't load articles</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Check your connection and try again.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 3 }}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <AutoStoriesIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h1">Read</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 560 }}>
          Stay in the loop with frontend — curated articles, blogs, and release notes.
          No action items, just good reading.
          {isFetching && ' Refreshing…'}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="Search articles…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />,
              },
            }}
            sx={{ width: 240, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
          />
          {TOPIC_FILTERS.map((topic) => {
            const active = topicFilters.includes(topic)
            return (
              <Chip
                key={topic}
                label={FILTER_LABELS[topic]}
                size="small"
                onClick={() =>
                  setTopicFilters(
                    active ? topicFilters.filter((t) => t !== topic) : [...topicFilters, topic],
                  )
                }
                sx={{
                  height: 28,
                  cursor: 'pointer',
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'background.paper',
                  color: active ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: active ? alpha(theme.palette.primary.main, 0.3) : 'divider',
                }}
              />
            )
          })}
        </Stack>

        {filtered.length === 0 ? (
          <Box sx={{ ...cardSx(theme), textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nothing matches — try clearing filters.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {featured && <FeaturedCard article={featured} />}
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </Stack>
        )}
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
          <MenuBookIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="h3">Go-to sources</Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Classic reading list — the places senior frontenders actually check.
        </Typography>
        <Stack spacing={1}>
          {data.curatedSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function FeaturedCard({ article }: { article: KnowledgeArticle }) {
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

function ArticleCard({ article }: { article: KnowledgeArticle }) {
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
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{source.emoji}</Typography>
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

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
