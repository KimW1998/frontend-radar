const BREAKING_SECTION_TITLES =
  /^(?:⚠️\s*)?(?:breaking\s+changes?|breaking\s+api(?:\s+changes?)?|api\s+breaking\s+changes?|deprecations?|removed\s+apis?|migration\s+(?:guide|notes|breaking))/i

const INLINE_BREAKING =
  /(?:^|\s)(?:BREAKING(?:\s+CHANGE)?|Breaking\s+change)[:：]\s*(.+)/i

function cleanItem(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isBulletLine(line: string): string | null {
  const match = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+)/)
  return match ? cleanItem(match[1]) : null
}

function isSubHeader(line: string): boolean {
  return /^#{1,6}\s+/.test(line)
}

export function extractBreakingApiChanges(body: string): string[] {
  if (!body.trim()) return []

  const text = body.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const items: string[] = []
  const seen = new Set<string>()

  function addItem(raw: string) {
    const item = cleanItem(raw)
    if (item.length < 12 || seen.has(item)) return
    seen.add(item)
    items.push(item)
  }

  let inBreakingSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/)

    if (headerMatch) {
      const title = headerMatch[2].replace(/⚠️/g, '').trim()
      inBreakingSection = BREAKING_SECTION_TITLES.test(title)
      continue
    }

    const inlineMatch = line.match(INLINE_BREAKING)
    if (inlineMatch) {
      addItem(inlineMatch[1])
      continue
    }

    if (inBreakingSection) {
      if (isSubHeader(line)) {
        inBreakingSection = false
        continue
      }

      const bullet = isBulletLine(line)
      if (bullet) {
        addItem(bullet)
        continue
      }

      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('|') && trimmed.length > 20) {
        addItem(trimmed)
      }
    }
  }

  if (items.length === 0) {
    for (const line of lines) {
      const inlineMatch = line.match(INLINE_BREAKING)
      if (inlineMatch) addItem(inlineMatch[1])
    }
  }

  return items.slice(0, 25)
}

export function formatBreakingApiChanges(items: string[]): string {
  if (items.length === 0) return 'No specific breaking API changes extracted from release notes.'
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n')
}
