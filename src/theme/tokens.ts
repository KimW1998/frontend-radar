export type ColorMode = 'dark' | 'light'

export interface ThemeTokens {
  surface: {
    nested: string
    hover: string
    accent: string
  }
  border: {
    subtle: string
    strong: string
  }
  code: {
    bg: string
    text: string
  }
  gradient: {
    sidebar: string
    hero: string
  }
}

export const darkTokens: ThemeTokens = {
  surface: {
    nested: '#0D0D0F',
    hover: '#1A1A1E',
    accent: '#3B82F612',
  },
  border: {
    subtle: '#1F1F23',
    strong: '#2A2A2E',
  },
  code: {
    bg: '#0A0A0B',
    text: '#A5F3FC',
  },
  gradient: {
    sidebar: 'linear-gradient(180deg, #0D0D0F 0%, #0A0A0B 100%)',
    hero: 'radial-gradient(ellipse 80% 50% at 50% -20%, #3B82F610 0%, transparent 70%)',
  },
}

export const lightTokens: ThemeTokens = {
  surface: {
    nested: '#F4F4F5',
    hover: '#E4E4E7',
    accent: '#3B82F608',
  },
  border: {
    subtle: '#E4E4E7',
    strong: '#D4D4D8',
  },
  code: {
    bg: '#F4F4F5',
    text: '#0E7490',
  },
  gradient: {
    sidebar: 'linear-gradient(180deg, #FAFAFA 0%, #F4F4F5 100%)',
    hero: 'radial-gradient(ellipse 80% 50% at 50% -20%, #3B82F608 0%, transparent 70%)',
  },
}
