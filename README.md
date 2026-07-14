# Frontend Radar

Developer intelligence dashboard for senior frontend engineers. Monitors your daily stack — React, TypeScript, Vite, TanStack, MUI, Node.js, TYPO3, and more — surfacing only actionable information.

## Features

- **Executive Summary** — Critical alerts, pending updates, breaking changes, and recommended actions
- **Dependency Watchlist** — Version tracking with risk levels and security issues
- **Node.js Upgrade Center** — LTS status, support dates, migration guidance
- **Security Center** — CVEs, GitHub advisories, supply chain alerts
- **Breaking Changes Feed** — Migration guidance with code examples
- **TYPO3 Watch** — Releases, security advisories, TypoScript changes
- **Frontend Ecosystem** — Browser breaking changes, new APIs, CSS support
- **AI Summary Engine** — Bite-sized summaries with upgrade urgency
- **Dependency Health Score** — Weighted 0–100 score with recommended actions
- **Filters** — Security, React, TypeScript, Node, Testing, Browser APIs, TYPO3, UI Libraries, Infrastructure

## Stack

- React 19 + TypeScript + Vite
- TanStack Query + TanStack Router
- Zustand + Axios + MUI + Recharts + Zod

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Data Sources (Live Only)

No mock data. The dashboard fetches everything from public APIs at runtime:

| Source | Endpoint | What you get |
|--------|----------|--------------|
| **NPM Registry** | `registry.npmjs.org/{package}/latest` | Latest versions for all 16 watchlist packages |
| **GitHub Releases** | `api.github.com/repos/{repo}/releases/latest` | Release notes summaries |
| **OSV** | `api.osv.dev/v1/query` | CVEs/vulnerabilities per configured package version |
| **Node.js Dist** | `nodejs.org/dist/index.json` | LTS and current release versions |
| **endoflife.date** | `endoflife.date/api/v1/products/nodejs` | Node support/EOL dates |

**Unavailable from browser (shown as empty):**
- TYPO3 news/security — HTML only, no CORS JSON API
- Browser release notes — no unified CORS-enabled API
- AI summaries — rule-based from API data, not LLM-generated

Configure your installed versions in **Settings** to enable vulnerability checks and upgrade recommendations.

The **Data Sources** panel at the top of the dashboard shows reachability status for each API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Deploy

Configured for Netlify with SPA redirects in `netlify.toml`.

```bash
npm run build
npx netlify deploy --prod
```
