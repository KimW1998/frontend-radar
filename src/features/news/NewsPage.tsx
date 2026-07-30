import { useMemo, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
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
import { type CuratedSource } from '@/types/knowledge'
import { QueryErrorState } from '@/components/QueryErrorState'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { matchesFilter } from '@/stores'
import { cardSx } from '@/theme'
import { ArticleCard, FeaturedCard } from '@/features/news/article-ui'

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
  const { data, isLoading, isError, isFetching, refetch, isRefetching } = useKnowledgeData()
  const [topicFilters, setTopicFilters] = useState<FilterCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.readArticles.filter((article) =>
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
      <QueryErrorState
        title="Couldn't load articles"
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
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
          Articles, deep dives, and community posts — curated frontend reading without release noise.
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
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              No articles loaded yet.
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              RSS feeds load via /api/rss on Netlify. Run netlify dev locally, or check filters.
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
