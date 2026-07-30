import { Card, CardContent, Typography } from '@mui/material'
import { GitHubSyncPanel } from '@/components/GitHubSyncPanel'
import type { StackImportResult } from '@/services/stack-import'
import type { GitHubImportPayload } from '@/types/stack-import-ui'
import type { GitHubSyncConfig } from '@/types/github-sync'

interface GitHubSyncCardProps {
  projectName: string
  githubSync?: GitHubSyncConfig
  onImportSuccess?: (result: StackImportResult, files: GitHubImportPayload) => void
}

export function GitHubSyncCard({ projectName, githubSync, onImportSuccess }: GitHubSyncCardProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h3" sx={{ mb: 0.5 }}>
          GitHub sync — {projectName}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Each teammate connects their own GitHub account to import from their repositories.
          Re-sync anytime after linking a repo to a project.
        </Typography>
        <GitHubSyncPanel githubSync={githubSync} onImportSuccess={onImportSuccess} />
      </CardContent>
    </Card>
  )
}
