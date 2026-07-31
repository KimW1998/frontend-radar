import { useEffect, useState } from 'react'
import { Chip, Collapse, IconButton, Stack, Typography, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSearch } from '@tanstack/react-router'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { DetailCard } from '@/components/DetailCard'
import { SeverityBadge } from '@/components/Badges'
import { buildTransitiveDependencyDetail } from '@/lib/detail-builders'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { cardSx, monoFont } from '@/theme'

interface TransitiveDependenciesSectionProps {
  items: TransitiveDependencyInsight[]
}

function sortTransitiveItems(items: TransitiveDependencyInsight[]): TransitiveDependencyInsight[] {
  return [...items].sort((a, b) => {
    const vulnDelta = (b.vulnerabilityCount > 0 ? 1 : 0) - (a.vulnerabilityCount > 0 ? 1 : 0)
    if (vulnDelta !== 0) return vulnDelta
    return a.depth - b.depth || a.npmPackage.localeCompare(b.npmPackage)
  })
}

function collapsedSummary(items: TransitiveDependencyInsight[], withVulns: TransitiveDependencyInsight[]): string {
  if (withVulns.length > 0) {
    return `${items.length} transitive packages scanned · ${withVulns.length} with advisories`
  }
  return `${items.length} transitive packages scanned · no advisories in scanned set`
}

export function TransitiveDependenciesSection({ items }: TransitiveDependenciesSectionProps) {
  const theme = useTheme()
  const isConfigured = useIsStackConfigured()
  const { focus } = useSearch({ from: '/' })
  const [expanded, setExpanded] = useState(false)
  const sortedItems = sortTransitiveItems(items)
  const withVulns = items.filter((item) => item.vulnerabilityCount > 0)
  const emptyVariant = resolveSectionEmpty(items.length, withVulns.length, {
    requiresConfig: true,
    isConfigured,
  })
  const section = DASHBOARD_SECTIONS.transitive
  const isCollapsible = items.length > 0

  useEffect(() => {
    if (focus && items.some((item) => item.id === focus)) {
      setExpanded(true)
    }
  }, [focus, items])

  const listContent = (
    <Stack spacing={1}>
      {emptyVariant === 'all-clear' && (
        <EmptySectionState
          variant="all-clear"
          title="No transitive advisories in scanned dependencies"
          description={`Scanned ${items.length} transitive packages (depth ≤ 2) from your lockfile.`}
        />
      )}
      {sortedItems.map((item) => (
        <DetailCard
          key={item.id}
          detail={buildTransitiveDependencyDetail(item)}
          sx={{ ...cardSx(theme), p: 2, pr: 5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
            {item.highestSeverity && <SeverityBadge severity={item.highestSeverity} />}
            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
              {item.npmPackage}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
              {item.version}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: item.topAdvisoryId ? 1 : 0 }}>
            Required by {item.requiredBy.join(', ')} · depth {item.depth}
            {item.vulnerabilityCount > 0 && ` · ${item.vulnerabilityCount} advisory(ies)`}
          </Typography>
          {item.topAdvisoryId && (
            <Chip
              size="small"
              label={item.topAdvisoryId}
              sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
            />
          )}
        </DetailCard>
      ))}
    </Stack>
  )

  return (
    <Stack id={section.id} spacing={2} sx={{ mb: 4 }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1}
        component={isCollapsible ? 'button' : 'div'}
        type={isCollapsible ? 'button' : undefined}
        onClick={isCollapsible ? () => setExpanded((open) => !open) : undefined}
        sx={{
          width: '100%',
          p: 0,
          border: 0,
          bgcolor: 'transparent',
          textAlign: 'left',
          cursor: isCollapsible ? 'pointer' : 'default',
          '&:hover': isCollapsible ? { '& .transitive-toggle': { color: 'primary.main' } } : undefined,
        }}
      >
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h2" sx={{ color: 'text.primary' }}>
            {section.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {section.subtitle}
          </Typography>
          {isCollapsible && !expanded && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              {collapsedSummary(items, withVulns)}
            </Typography>
          )}
        </Stack>
        {isCollapsible && (
          <IconButton
            className="transitive-toggle"
            size="small"
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide transitive dependencies' : 'Show transitive dependencies'}
            onClick={(event) => {
              event.stopPropagation()
              setExpanded((open) => !open)
            }}
            sx={{
              mt: 0.25,
              color: 'text.secondary',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease, color 0.15s ease',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
      </Stack>

      {!isCollapsible ? (
        <EmptySectionState
          variant={isConfigured ? 'all-clear' : 'not-configured'}
          title={isConfigured ? 'Import a lockfile to analyze transitive dependencies' : undefined}
          description={
            isConfigured
              ? 'Paste or sync a lockfile in Settings so Frontend Radar can walk your dependency tree.'
              : undefined
          }
        />
      ) : (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {listContent}
        </Collapse>
      )}
    </Stack>
  )
}
