import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import SyncIcon from '@mui/icons-material/Sync'
import { useQueryClient } from '@tanstack/react-query'
import { assertRepoInUserList } from '@/lib/github-repo-access'
import { isGitHubOAuthConfigured, startGitHubOAuth } from '@/services/github-auth'
import {
  fetchGitHubRepoFiles,
  fetchGitHubUserRepos,
  resolveGitHubStackFiles,
  type GitHubUserRepoOption,
} from '@/services/github-repo'
import type { StackImportResult } from '@/services/stack-import'
import { useGitHubAuthStore, useSettingsStore } from '@/stores'
import type { GitHubSyncConfig } from '@/types/github-sync'
import { monoFont } from '@/theme'

interface GitHubSyncPanelProps {
  githubSync?: GitHubSyncConfig
  onBeforeSync?: () => void
  onImportSuccess?: (result: StackImportResult) => void
  compact?: boolean
}

function splitFullName(fullName: string): { owner: string; repo: string } | null {
  const slash = fullName.indexOf('/')
  if (slash <= 0) return null
  return {
    owner: fullName.slice(0, slash),
    repo: fullName.slice(slash + 1),
  }
}

export function GitHubSyncPanel({
  githubSync,
  onBeforeSync,
  onImportSuccess,
  compact = false,
}: GitHubSyncPanelProps) {
  const queryClient = useQueryClient()
  const oauthConfigured = isGitHubOAuthConfigured()
  const accessToken = useGitHubAuthStore((s) => s.accessToken)
  const login = useGitHubAuthStore((s) => s.login)
  const authNotice = useGitHubAuthStore((s) => s.authNotice)
  const setAuthNotice = useGitHubAuthStore((s) => s.setAuthNotice)
  const disconnect = useGitHubAuthStore((s) => s.disconnect)
  const { setGitHubSync, applyGitHubImport } = useSettingsStore()

  const [branch, setBranch] = useState(githubSync?.branch ?? 'main')
  const [packageJsonPath, setPackageJsonPath] = useState(githubSync?.packageJsonPath ?? 'package.json')
  const [lockfilePath, setLockfilePath] = useState(githubSync?.lockfilePath ?? 'package-lock.json')
  const [showAdvanced, setShowAdvanced] = useState(!compact)
  const [syncing, setSyncing] = useState(false)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [userRepos, setUserRepos] = useState<GitHubUserRepoOption[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubUserRepoOption | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setUserRepos([])
      setSelectedRepo(null)
      return
    }

    let cancelled = false
    setLoadingRepos(true)

    fetchGitHubUserRepos(accessToken)
      .then((repos) => {
        if (!cancelled) setUserRepos(repos)
      })
      .catch(() => {
        if (!cancelled) setUserRepos([])
      })
      .finally(() => {
        if (!cancelled) setLoadingRepos(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!githubSync || userRepos.length === 0) return
    const match = assertRepoInUserList(userRepos, githubSync.owner, githubSync.repo)
    if (match) {
      setSelectedRepo(match)
      setBranch(githubSync.branch)
    }
  }, [githubSync, userRepos])

  const buildConfig = (): GitHubSyncConfig | null => {
    if (!selectedRepo) return null
    const parts = splitFullName(selectedRepo.fullName)
    if (!parts) return null
    return {
      owner: parts.owner,
      repo: parts.repo,
      branch: branch.trim() || selectedRepo.defaultBranch || 'main',
      packageJsonPath: packageJsonPath.trim() || 'package.json',
      lockfilePath: lockfilePath.trim() || 'package-lock.json',
    }
  }

  const handleConnect = () => {
    try {
      startGitHubOAuth(`${window.location.pathname}${window.location.search}`)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not start GitHub login',
      })
    }
  }

  const syncNow = async () => {
    if (!accessToken) {
      setMessage({
        type: 'error',
        text: 'Connect your GitHub account first — imports always use your login.',
      })
      return
    }

    if (!selectedRepo) {
      setMessage({
        type: 'error',
        text: 'Select one of your repositories from the list — manual URLs are not allowed.',
      })
      return
    }

    const parts = splitFullName(selectedRepo.fullName)
    if (!parts) {
      setMessage({ type: 'error', text: 'Could not read the selected repository.' })
      return
    }

    const allowed = assertRepoInUserList(userRepos, parts.owner, parts.repo)
    if (!allowed) {
      setMessage({
        type: 'error',
        text: 'That repository is not in your connected GitHub account.',
      })
      return
    }

    const config = buildConfig()
    if (!config) {
      setMessage({ type: 'error', text: 'Could not read the selected repository.' })
      return
    }

    onBeforeSync?.()
    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetchGitHubRepoFiles(config, accessToken)
      const resolved = resolveGitHubStackFiles(response, config)

      if (!resolved.packageJson) {
        setMessage({
          type: 'error',
          text: resolved.errors.join(' ') || 'Could not fetch package.json from GitHub.',
        })
        return
      }

      const result = applyGitHubImport({
        packageJson: resolved.packageJson,
        lockfile: resolved.lockfile ?? undefined,
        githubSync: {
          ...config,
          lockfilePath: resolved.lockfilePath ?? config.lockfilePath,
        },
      })

      if (result.matched.length === 0) {
        setMessage({ type: 'error', text: 'Synced from GitHub but no tracked packages matched.' })
        return
      }

      setGitHubSync({
        ...config,
        lockfilePath: resolved.lockfilePath ?? config.lockfilePath,
        lastSyncedAt: new Date().toISOString(),
      })

      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onImportSuccess?.(result)

      setMessage({
        type: 'success',
        text: `Imported ${result.matched.length} packages from ${config.owner}/${config.repo}${resolved.lockfilePath ? ` (${resolved.lockfilePath})` : ''}.`,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'GitHub sync failed',
      })
    } finally {
      setSyncing(false)
    }
  }

  const importReady = Boolean(accessToken && selectedRepo && oauthConfigured)

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <GitHubIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="h3" sx={{ fontSize: compact ? '1rem' : undefined }}>
          Link from GitHub
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Sign in with <strong>your</strong> GitHub account, then pick a repository from your list.
        You cannot paste someone else&apos;s repo URL — only repos your account can access are shown.
      </Typography>

      {authNotice && (
        <Alert
          severity={authNotice.startsWith('Connected') ? 'success' : 'error'}
          sx={{ mb: 2 }}
          onClose={() => setAuthNotice(null)}
        >
          {authNotice}
        </Alert>
      )}

      {!oauthConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          GitHub login is not configured on this deployment yet. Ask the site admin to add OAuth env
          vars (see README). You can still paste package.json manually below.
        </Alert>
      )}

      {oauthConfigured && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          {accessToken && login ? (
            <>
              <Chip
                icon={<GitHubIcon />}
                label={`Connected as @${login}`}
                color="primary"
                variant="outlined"
                sx={{ fontFamily: monoFont }}
              />
              <Button size="small" startIcon={<LinkOffIcon />} onClick={disconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button variant="outlined" startIcon={<GitHubIcon />} onClick={handleConnect}>
              Connect GitHub
            </Button>
          )}
        </Stack>
      )}

      <Stack spacing={2}>
        {accessToken && (
          <>
            {loadingRepos ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Loading your repositories…
                </Typography>
              </Stack>
            ) : userRepos.length === 0 ? (
              <Alert severity="info">
                No repositories found for this GitHub account, or the list could not be loaded.
              </Alert>
            ) : (
              <Autocomplete
                options={userRepos}
                value={selectedRepo}
                onChange={(_, value) => {
                  setSelectedRepo(value)
                  if (value) setBranch(value.defaultBranch)
                }}
                getOptionLabel={(option) => option.fullName}
                isOptionEqualToValue={(a, b) => a.fullName === b.fullName}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.fullName}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontFamily: monoFont }}>
                        {option.fullName}
                      </Typography>
                      {option.private && (
                        <Chip label="private" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Your repository"
                    placeholder="Select from your GitHub repos"
                    size="small"
                    required
                  />
                )}
              />
            )}
          </>
        )}

        {compact && !showAdvanced && selectedRepo && (
          <Button size="small" onClick={() => setShowAdvanced(true)} sx={{ alignSelf: 'flex-start' }}>
            Customize branch & file paths
          </Button>
        )}

        {showAdvanced && selectedRepo && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="package.json path"
              value={packageJsonPath}
              onChange={(e) => setPackageJsonPath(e.target.value)}
              size="small"
              sx={{ flex: 1, '& input': { fontFamily: monoFont } }}
            />
            <TextField
              label="Lockfile path"
              value={lockfilePath}
              onChange={(e) => setLockfilePath(e.target.value)}
              size="small"
              sx={{ flex: 1, '& input': { fontFamily: monoFont } }}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={syncNow}
            disabled={syncing || !importReady}
          >
            {syncing ? 'Importing…' : 'Import from GitHub'}
          </Button>
          {githubSync?.lastSyncedAt && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Last synced {new Date(githubSync.lastSyncedAt).toLocaleString()}
            </Typography>
          )}
        </Stack>

        {message && (
          <Alert severity={message.type === 'info' ? 'info' : message.type}>{message.text}</Alert>
        )}
      </Stack>
    </Box>
  )
}

export function GitHubSyncDivider() {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ my: 2.5 }}>
      <Divider sx={{ flex: 1 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        or paste manually
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Stack>
  )
}
