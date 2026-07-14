import { useEffect, useState } from 'react'
import { enrichNpmPackage } from '@/services/detail-enrichment'
import type { DetailContent, DetailSection } from '@/types/detail'

export function useDetailEnrichment(content: DetailContent | null, open: boolean) {
  const [extraSections, setExtraSections] = useState<DetailSection[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !content?.enrich) {
      setExtraSections([])
      setLoading(false)
      return
    }

    let cancelled = false

    if (content.enrich.type === 'npm-package') {
      setLoading(true)
      enrichNpmPackage(content.enrich.packageName)
        .then((sections) => {
          if (!cancelled) setExtraSections(sections)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [open, content?.enrich?.type, content?.enrich?.packageName])

  return { extraSections, loading }
}
