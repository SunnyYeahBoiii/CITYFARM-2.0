# Landing App (`apps/landing`)

Landing page app for CITYFARM 2.0, built with Next.js App Router.

## Local development

From repository root:

```bash
pnpm dev --filter=landing
```

Default local URL:

- `http://localhost:3004`

## Build

From repository root:

```bash
pnpm build --filter=landing
```

## Notes

- This app is part of the monorepo Turborepo pipeline (`pnpm` workspaces).
- Deployment for VPS in this repository currently targets `web`, `admin`, `api`, and `model-api`.
