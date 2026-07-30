import { describe, expect, it } from 'vitest'
import { assertRepoInUserList, findUserRepo } from '@/lib/github-repo-access'

const repos = [
  { fullName: 'alice/portal', private: false, defaultBranch: 'main' },
  { fullName: 'acme-corp/design-system', private: true, defaultBranch: 'develop' },
]

describe('github repo access helpers', () => {
  it('finds a repo the user owns or can access', () => {
    expect(findUserRepo(repos, 'alice', 'portal')).toEqual(repos[0])
  })

  it('rejects repos not in the user list', () => {
    expect(assertRepoInUserList(repos, 'bob', 'secret-app')).toBeNull()
  })
})
