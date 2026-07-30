# Frontend Radar

Developer intelligence dashboard for senior frontend engineers. Monitors your daily stack — React, TypeScript, Vite, TanStack, MUI, Node.js, and more — surfacing only actionable information.

**Live demo:** [frontendradardashboard.netlify.app](https://frontendradardashboard.netlify.app)

## Features

- **Multi-project tracking** — Monitor multiple apps/repos, each with its own package versions and Node runtime
- **Onboarding wizard** — Guided setup: name project → paste `package.json` → set Node version
- **Executive Summary** — Critical alerts, pending updates, breaking changes, and recommended actions
- **Dependency Watchlist** — Version tracking with risk levels, CVE counts, and copy-to-clipboard upgrade commands
- **Custom watchlist per project** — Choose which of the 16 packages to monitor (Settings → Tracked packages)
- **Lockfile import** — Paste `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` for exact installed versions
- **Version drift detection** — Compare stored versions against a fresh import and see what changed
- **Custom npm packages** — Track any package beyond the built-in catalog
- **Upgrade plan workflow** — Progress checkboxes, copy-all script, and PR checklist export on `/upgrade-plan`
- **Browser notifications** — Optional alerts for critical CVEs, major upgrades, and Node EOL
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
2. Paste your `package.json` and optionally a lockfile — we match watchlist packages and resolve exact versions from the lockfile when provided
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

### Tests

```bash
npm test
```

Unit tests cover semver parsing, package.json import, health score calculation, watchlist helpers, and empty-state logic.

## Projects & Settings

- **Sidebar project switcher** — Switch between tracked projects or add a new one
- **Settings** — Manage projects, pick tracked packages, import package.json + lockfile, add custom packages, edit versions manually
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

### GitHub — two separate setups

**User repo imports (OAuth — each teammate uses their own GitHub):**

1. Create a [GitHub OAuth App](https://github.com/settings/developers)  
   - Homepage URL: `https://your-site.netlify.app`  
   - Callback URL: `https://your-site.netlify.app/api/github-oauth-callback`
2. Add to Netlify environment variables (and `.env` for local dev):
   - `VITE_GITHUB_CLIENT_ID` — same Client ID (exposed to browser)
   - `GITHUB_CLIENT_ID` — same Client ID (functions)
   - `GITHUB_CLIENT_SECRET` — Client secret (functions only, never commit)
3. Redeploy. Users click **Connect GitHub** in onboarding or Settings.

Repo imports never use the site owner's token — only the logged-in user's token, and only repositories returned by GitHub for that user (no manual URLs). Optionally set `GITHUB_IMPORT_BLOCKLIST=your-github-username` on Netlify to hard-block your namespace for other accounts.

**Release notes proxy (optional site-wide PAT):**

`GITHUB_TOKEN` is optional and only speeds up public release-note fetches for the watchlist (React, Vite, etc.). It is **not** used when importing a user's `package.json` from their repo.

Verify: `/api/data-health` should show `"githubOAuth": true` after OAuth env vars are set.

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
