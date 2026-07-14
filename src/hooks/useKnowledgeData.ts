import { useQuery } from '@tanstack/react-query'
import { fetchKnowledgeData } from '@/services/knowledge'

export function useKnowledgeData(enabled = true) {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: fetchKnowledgeData,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    enabled,
  })
}
