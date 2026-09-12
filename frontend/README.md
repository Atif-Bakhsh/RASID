# RASID frontend

Arabic-first Next.js client for the existing RASID NestJS API. This directory is an independent pnpm workspace; the backend remains at the repository root.

## Local setup

```sh
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173). The example configuration connects to the local API at `http://localhost:3000/api/v1`; that exact frontend origin must be allowed by the backend CORS configuration.

## Commands

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

## Source map

- `src/app`: App Router layouts, pages, metadata, and global design tokens. Route groups keep future `(auth)` screens separate from the authenticated `(app)` shell.
- `src/components`: reusable UI and the responsive application shell.
- `src/config`: validated public runtime/build configuration.
- `src/features`: product capability boundaries; authentication is the only staged foundation today.
- `src/lib`: API transport, shared contracts, and localization dictionaries.
- `src/providers`: locale, query-cache, and authentication composition.

Stage 0 intentionally contains no authentication forms or product feature screens.
