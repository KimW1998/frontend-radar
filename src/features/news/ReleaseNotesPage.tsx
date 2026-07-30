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
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import { FILTER_LABELS, type FilterCategory } from '@/types'
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

export function ReleaseNotesPage() {
  const theme = useTheme()
  const { data, isLoading, isError, isFetching, refetch, isRefetching } = useKnowledgeData()
  const [topicFilters, setTopicFilters] = useState<FilterCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.releaseArticles.filter((article) =>
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
          Loading release notes from GitHub…
        </Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <QueryErrorState
        title="Couldn't load release notes"
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    )
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <NewReleasesIcon sx={{ color: '#22C55E' }} />
        <Typography variant="h1">Release notes</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 560 }}>
        Changelogs from your watchlist packages on GitHub — useful reference, not daily reading.
        {isFetching && ' Refreshing…'}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search releases…"
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
            No release notes match — try clearing filters.
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
  )
}
