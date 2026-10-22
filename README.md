# Motorcycle Dashboard

Admin dashboard built with React, TypeScript, and Vite.

## Local development

```bash
pnpm install
pnpm dev
```

Vite serves the dashboard at `http://localhost:5173`. The API client uses
`VITE_API_URL`, which defaults to
`https://api-production-2c752.up.railway.app/api/v1`. Copy `.env.example` to
`.env` only when you need to override that public URL. Do not put secrets in
`VITE_*` variables.

## Build and checks

```bash
pnpm build
pnpm typecheck
pnpm lint
```
