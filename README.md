# Frontend Radar

Developer intelligence dashboard for senior frontend engineers. Monitors your daily stack — React, TypeScript, Vite, TanStack, MUI, Node.js, and more — surfacing only actionable information.

## Features

- **Executive Summary** — Critical alerts, pending updates, breaking changes, and recommended actions
- **Dependency Watchlist** — Version tracking with risk levels and security issues
- **Node.js Upgrade Center** — LTS status, support dates, migration guidance
- **Security Center** — CVEs, GitHub advisories, supply chain alerts
- **Breaking Changes Feed** — Migration guidance with code examples
- **Dependency Health Score** — Weighted 0–100 score with recommended actions
- **Filters** — Security, React, TypeScript, Node, Testing, UI Libraries, Infrastructure

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
