# Frontend Radar

Developer intelligence dashboard for senior frontend engineers. Monitors your daily stack — React, TypeScript, Vite, TanStack, MUI, Node.js, and more — surfacing only actionable information.

**Live demo:** [frontendradardashboard.netlify.app](https://frontendradardashboard.netlify.app)

## Features

- **Multi-project tracking** — Monitor multiple apps/repos, each with its own package versions and Node runtime
- **Onboarding wizard** — Guided setup: name project → paste `package.json` → set Node version
- **Executive Summary** — Critical alerts, pending updates, breaking changes, and recommended actions
- **Dependency Watchlist** — Version tracking with risk levels, CVE counts, and copy-to-clipboard upgrade commands
- **Node.js Upgrade Center** — LTS status, support dates, migration guidance (per project, per developer)
- **Security Center** — CVEs and advisories from OSV with one-click fix commands
- **Breaking Changes Feed** — Migration guidance from GitHub release notes
- **Dependency Health Score** — Weighted 0–100 score across your configured stack
- **Reading** — Articles, release notes, and TanStack updates via RSS/GitHub proxies

## Stack

- React 19 + TypeScript + Vite
- TanStack Query + TanStack Router
- Zustand + MUI + Zod
- Netlify Functions (`/api/*` proxies for GitHub, RSS, OSV)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

On first visit you'll be guided through **project setup** (`/onboarding`):

1. Name your project (e.g. "Customer Portal")
2. Paste your `package.json` — we match 16 watchlist packages
3. Enter the Node version **you run** (`node -v`) — not just `engines.node`
4. Open the dashboard

All project data is stored in your browser (localStorage). Teammates set up their own projects independently.

### Local API proxies

`npm run dev` uses `@netlify/vite-plugin` so `/api/*` routes work locally (GitHub releases, RSS, data health). Without it, reading pages and GitHub-backed features won't load.

Optional — faster GitHub rate limits in local dev:

```bash
cp .env.example .env
# Add GITHUB_TOKEN=ghp_... from https://github.com/settings/tokens
```

Restart the dev server after adding env vars.

## Projects & Settings

- **Sidebar project switcher** — Switch between tracked projects or add a new one
- **Settings** — Manage projects, re-import `package.json`, edit package versions manually
- **Package manager preference** — Choose npm, pnpm, or yarn for upgrade command copy buttons

The dashboard stays empty until at least one package version is configured — we don't show misleading "latest only" data without knowing your installed versions.

## Data Sources (Live Only)

No mock data. The dashboard fetches from public APIs at runtime:

| Source | Endpoint | What you get |
|--------|----------|--------------|
| **NPM Registry** | `registry.npmjs.org/{package}/latest` | Latest versions for watchlist packages |
| **GitHub Releases** | `/api/github-releases` (Netlify proxy) | Release notes summaries |
| **OSV** | `api.osv.dev/v1/query` | CVEs for your configured package versions |
| **Node.js Dist** | `nodejs.org/dist/index.json` | LTS and current release versions |
| **endoflife.date** | `endoflife.date/api/v1/products/nodejs` | Node support/EOL dates |
| **RSS** | `/api/rss` (Netlify proxy) | Reading section articles |

The **data sources indicator** in the sidebar footer shows API reachability.

## Deploy (Netlify)

Configured with SPA redirects in `netlify.toml`.

### GitHub token (recommended for production)

Without a token, GitHub API rate limits are low (~60 req/hr). Set `GITHUB_TOKEN` in Netlify environment variables for 5000 req/hr:

1. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) (public repo read scope is enough)
2. Netlify → Site → Environment variables → add `GITHUB_TOKEN`
3. Redeploy

Verify: `https://your-site.netlify.app/api/data-health` should show `"githubToken": true`.

```bash
npm run build
npx netlify deploy --prod
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with Netlify function proxies |
| `npm run dev:netlify` | Full Netlify dev environment |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Watchlist Packages

React, React DOM, TypeScript, Vite, TanStack Query, TanStack Router, Zustand, Axios, MUI, Sentry, Okta Auth JS, i18next, Zod, Recharts, Playwright, Vitest.
