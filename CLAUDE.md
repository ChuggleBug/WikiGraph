# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

React 19 + TypeScript + Vite. First app slice is built: the Explorer shell (`src/App.tsx`)
with the graph canvas, search bar (collapsed + "search open" results state), closable detail
panel, view controls, and legend. Backend is not wired up locally yet — see API notes below.

## App architecture

- **Backend API** (`src/api.ts`, spec in `API.md`): the app's own server at `/api/wikigraph`
  (`/search` for did-you-mean titles, `/links` for outbound links). NOT the Wikipedia API.
  `API.md` is maintained by the user. Override the base with `VITE_API_BASE`. There is no dev
  proxy configured — `npm run dev` needs the backend reachable at the same origin, or a proxy
  added to `vite.config.ts`.
- **Graph store** (`src/graph/useGraphStore.ts`): `useReducer`. Edges are recomputed
  structurally from node link-lists on every change — search-add and dropdown-add are the same
  operation (directed where one article links to the other, mutual where both do).
- **Layout** (`src/graph/useForceLayout.ts`): `d3-force` simulation; React owns node identity,
  the hook owns x/y and publishes `positions` state on each tick. `d3-force` is the only
  runtime dependency added.
- **Canvas** (`src/graph/GraphCanvas.tsx`): hand-rolled SVG pan/zoom via pointer events (no
  d3-zoom). Directed edges = marching dashes, mutual = solid line; labels get a paint-order halo.
- ESLint's `react-hooks` rules here are strict (`react-hooks/refs`, `set-state-in-effect`) —
  don't read `ref.current` or call setState synchronously in render/effect bodies.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check the whole project (`tsc -b`) then produce a production build in `dist/`
- `npm run lint` — run ESLint over the repo
- `npm run preview` — serve the built `dist/` locally

There is no test runner configured yet.

## Architecture notes

- **Deployment base path**: `vite.config.ts` sets `base: '/app/wikigraph/'`, so the app is served from that sub-path, not the domain root. Absolute asset references (e.g. `/icons.svg` in `App.tsx`) resolve against that base at build time — keep this in mind when adding routes or asset URLs.
- **React Compiler is enabled** via `@rolldown/plugin-babel` running `reactCompilerPreset()` in `vite.config.ts`. This affects dev/build performance and means components are auto-memoized — avoid adding manual `useMemo`/`useCallback` unless profiling shows a need.
- **TypeScript project references**: `tsconfig.json` is a solid file that references `tsconfig.app.json` (browser `src/`) and `tsconfig.node.json` (Vite config). `npm run build` relies on this via `tsc -b`.
- **CI**: `.github/workflows/build.yml` runs `npm ci && npm run build` on every push to `main` and uploads `dist/` as an artifact (`dist`, 30-day retention). Note `dist/` is currently committed to the repo despite being in `.gitignore`.
- ESLint uses the flat-config format (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, and `react-refresh` recommended rule sets; `dist` is globally ignored.
