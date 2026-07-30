/** Shared dashboard section titles — used in cards, sidebar jump links, and loading skeletons */

export const DASHBOARD_SECTIONS = {
  healthScore: {
    id: 'health-score',
    title: 'Stack health score',
    subtitle: 'How healthy your installed packages and Node version are (0–100)',
    navLabel: 'Stack health',
  },
  executiveSummary: {
    id: 'executive-summary',
    title: 'What needs attention',
    subtitle: 'Priority actions — security fixes, updates, and breaking changes',
    navLabel: 'Needs attention',
  },
  dependencies: {
    id: 'dependency-watchlist',
    title: 'Your packages vs latest',
    subtitle: 'What you have installed compared to the newest available versions',
    navLabel: 'Package versions',
  },
  upgradePlan: {
    id: 'upgrade-plan',
    title: 'Suggested upgrade order',
    subtitle: 'Which packages to update first based on peer dependencies between your tracked packages',
    navLabel: 'Upgrade order',
  },
  node: {
    id: 'node-upgrade',
    title: 'Your Node.js runtime',
    subtitle: 'Whether your Node version is still supported and when support ends',
    navLabel: 'Node.js runtime',
  },
  security: {
    id: 'security-center',
    title: 'Known vulnerabilities',
    subtitle: 'CVEs and advisories that affect your installed package versions',
    navLabel: 'Vulnerabilities',
  },
  breakingChanges: {
    id: 'breaking-changes',
    title: 'Major upgrades & migrations',
    subtitle: 'Breaking changes when a major version is available for your packages',
    navLabel: 'Major upgrades',
  },
} as const

export const SECTION_NAV_LINKS = [
  DASHBOARD_SECTIONS.executiveSummary,
  DASHBOARD_SECTIONS.healthScore,
  DASHBOARD_SECTIONS.dependencies,
  DASHBOARD_SECTIONS.node,
  DASHBOARD_SECTIONS.security,
  DASHBOARD_SECTIONS.breakingChanges,
].map(({ id, navLabel }) => ({ label: navLabel, hash: `#${id}` }))
