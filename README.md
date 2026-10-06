# SYNAPSE

A Mimo-style coding-lessons app (Python, JavaScript, HTML, CSS, SQL, Git, Java, TypeScript) built with
TanStack Start, React 19, Tailwind 4 and Vite. Python runs in the browser via Pyodide.

## Getting started

```bash
npm install
npm run dev      # http://localhost:8080
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build (Nitro, Vercel output) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

## Deploying to Vercel

Import the repo in Vercel. The default settings work (`vercel.json` sets the install command).
Auth is off by default (`VITE_AUTH_ENABLED=false` in `.grok/app-env.json`); no database is required.

## Offline use

After the first visit the app works fully offline, including the Python runner.

- Pyodide (Python in the browser, v0.29.4) is bundled in `public/pyodide/` — no CDN needed.
- Fonts are bundled via `@fontsource`.
- `public/sw.js` is a service worker. The build (`scripts/inject-sw-manifest.mjs`) fills in the list of
  files to cache, and the app asks it to cache every lesson page after the first load.
- The service worker only registers in production builds (`npm run build`), not in `npm run dev`.
