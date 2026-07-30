import { describe, expect, it } from 'vitest'
import { parseGitHubRepoInput } from '@/lib/parse-github-repo'

describe('parseGitHubRepoInput', () => {
  it('parses owner/repo shorthand', () => {
    expect(parseGitHubRepoInput('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' })
  })

  it('parses github.com URLs', () => {
    expect(parseGitHubRepoInput('https://github.com/vitejs/vite')).toEqual({
      owner: 'vitejs',
      repo: 'vite',
    })
  })

  it('returns null for invalid input', () => {
    expect(parseGitHubRepoInput('not-a-repo')).toBeNull()
  })
})
