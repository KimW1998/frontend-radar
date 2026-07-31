export interface FrameworkReadingLink {
  label: string
  path: string
}

export interface FrameworkPreset {
  id: string
  name: string
  recommendedPackages: string[]
  readingLinks: FrameworkReadingLink[]
}

export interface FrameworkPresetMatch {
  preset: FrameworkPreset
  matchedPackages: string[]
  missingRecommended: string[]
}

const PRESETS: FrameworkPreset[] = [
  {
    id: 'vite-react-ts',
    name: 'Vite + React + TypeScript',
    recommendedPackages: ['react', 'react-dom', 'vite', 'typescript', '@types/react', '@types/react-dom'],
    readingLinks: [
      { label: 'React release notes', path: '/news/releases' },
      { label: 'TanStack updates', path: '/tanstack' },
      { label: 'Frontend news', path: '/news' },
    ],
  },
  {
    id: 'next-react-ts',
    name: 'Next.js + React + TypeScript',
    recommendedPackages: ['next', 'react', 'react-dom', 'typescript', '@types/react', '@types/node'],
    readingLinks: [
      { label: 'React release notes', path: '/news/releases' },
      { label: 'Frontend news', path: '/news' },
    ],
  },
  {
    id: 'vite-vue-ts',
    name: 'Vite + Vue + TypeScript',
    recommendedPackages: ['vue', 'vite', 'typescript', '@vitejs/plugin-vue'],
    readingLinks: [{ label: 'Frontend news', path: '/news' }],
  },
  {
    id: 'tanstack-start',
    name: 'TanStack Start',
    recommendedPackages: ['@tanstack/react-start', '@tanstack/react-router', '@tanstack/react-query', 'vite', 'react'],
    readingLinks: [
      { label: 'TanStack updates', path: '/tanstack' },
      { label: 'Frontend news', path: '/news' },
    ],
  },
  {
    id: 'react-native-expo',
    name: 'Expo / React Native',
    recommendedPackages: ['expo', 'react', 'react-native', 'typescript'],
    readingLinks: [
      { label: 'React release notes', path: '/news/releases' },
      { label: 'Frontend news', path: '/news' },
    ],
  },
]

function matchesPreset(deps: Set<string>, preset: FrameworkPreset): boolean {
  switch (preset.id) {
    case 'vite-react-ts':
      return deps.has('vite') && deps.has('react') && deps.has('typescript')
    case 'next-react-ts':
      return deps.has('next') && deps.has('react')
    case 'vite-vue-ts':
      return deps.has('vite') && deps.has('vue')
    case 'tanstack-start':
      return deps.has('@tanstack/react-start') || deps.has('@tanstack/react-router')
    case 'react-native-expo':
      return deps.has('expo') || deps.has('react-native')
    default:
      return false
  }
}

export function detectFrameworkPreset(packageNames: string[]): FrameworkPresetMatch | null {
  const deps = new Set(packageNames)
  for (const preset of PRESETS) {
    if (!matchesPreset(deps, preset)) continue
    const matchedPackages = preset.recommendedPackages.filter((pkg) => deps.has(pkg))
    const missingRecommended = preset.recommendedPackages.filter((pkg) => !deps.has(pkg))
    return { preset, matchedPackages, missingRecommended }
  }
  return null
}

export function listFrameworkPresets(): FrameworkPreset[] {
  return PRESETS
}
