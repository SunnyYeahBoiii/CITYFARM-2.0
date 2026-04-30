---
date: 2026-04-30T14:31:59+0700
researcher: sunny
git_commit: aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3
branch: main
repository: CITYFARM-2.0
topic: "Hardcoded URL mapping and env-variable coverage"
tags: [research, codebase, env, url, web, admin, api, deploy]
status: complete
last_updated: 2026-04-30
last_updated_by: sunny
---

# Research: Hardcoded URL mapping and env-variable coverage

**Date**: 2026-04-30T14:31:59+0700  
**Researcher**: sunny  
**Git Commit**: aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3  
**Branch**: main  
**Repository**: CITYFARM-2.0

## Research Question
Current app is not production-ready because multiple URLs are hardcoded. Explore the codebase and map URLs to `.env`-driven variables.

## Summary
The codebase already uses environment variables for many primary runtime URLs (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, `MODEL_API_URL`, `FRONTEND_URL`, `WEB_ORIGINS`, `GOOGLE_CALLBACK_URL`, `SUPABASE_URL`, `DATABASE_URL`), but still includes hardcoded fallback URLs in frontend and API runtime paths. Deploy-related files also contain hardcoded healthcheck URLs and a documented set of URL env placeholders.

## Detailed Findings

### Web app (`apps/web`)
- API URL config uses env + localhost fallback in `apps/web/lib/api/config.ts`.
  - `DEFAULT_API_BASE_URL = "http://localhost:3001"` and `process.env.NEXT_PUBLIC_API_URL` are combined in runtime URL builders.
- Chat proxy route uses `buildNestApiUrl("/api/chat")`, which resolves from `process.env.NEST_API_URL` with fallback defaults.
- SEO route generation (`sitemap`, `robots`) reads `NEXT_PUBLIC_APP_URL` and falls back to `http://localhost:3000`.
- Weather hook directly calls external URL `https://api.open-meteo.com/...` as a literal string.

### Admin app (`apps/admin`)
- API and web base URLs are env-driven via `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WEB_URL`, with localhost defaults.
- Auth/redirect links use `getWebBaseUrl()` output from env-based config.
- Marketplace mock data includes a literal external URL template `https://picsum.photos/...`.

### API app (`apps/api`)
- Model API upstream base URL supports `MODEL_API_URL` env override, with hardcoded fallback candidates:
  - Production fallback: `http://model-api:3003`
  - Non-production fallback list: `http://127.0.0.1:3003`, `http://localhost:3003`, `http://model-api:3003`
- CORS origin setup in `main.ts` includes hardcoded localhost defaults and merges `WEB_ORIGINS` env values.
- OAuth/frontend redirects are based on `FRONTEND_URL`.
- `GOOGLE_CALLBACK_URL`, `SUPABASE_URL`, `DATABASE_URL` are consumed directly from env in auth/storage/prisma services.

### Model API (`apps/model-api`)
- Runtime code does not define outbound URL envs; service binds port via `PORT` env with fallback `3003`.
- Endpoint paths are Flask routes (`/api/chat`, `/api/analyze-space`, etc.) and are consumed inbound by callers.

### Infra and deploy
- `infra/deploy/.env.vps.example` defines URL placeholders for runtime and Next public variables:
  - `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, `WEB_ORIGINS`
  - `WEB_NEXT_PUBLIC_API_URL`, `WEB_NEXT_PUBLIC_APP_URL`
  - `ADMIN_NEXT_PUBLIC_API_URL`, `ADMIN_NEXT_PUBLIC_WEB_URL`
- `infra/deploy/docker-compose.vps.yml` hardcodes internal healthcheck URLs (`127.0.0.1` + service ports) and uses `env_file: .env`.
- GitHub workflow injects Next public URL build args via repo secrets (`WEB_NEXT_PUBLIC_*`, `ADMIN_NEXT_PUBLIC_*`).

## Code References
- `apps/web/lib/api/config.ts` - Env-based API/Nest URL resolution with localhost fallback.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/web/lib/api/config.ts#L1-L33)
- `apps/web/app/sitemap.ts` - `NEXT_PUBLIC_APP_URL` with localhost fallback.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/web/app/sitemap.ts#L4-L24)
- `apps/web/app/robots.ts` - `NEXT_PUBLIC_APP_URL` with localhost fallback.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/web/app/robots.ts#L3-L13)
- `apps/web/lib/hooks/useWeather.ts` - Literal external weather API URL.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/web/lib/hooks/useWeather.ts#L61)
- `apps/admin/lib/api/config.ts` - Env-based API/web base URL resolution with localhost fallback.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/admin/lib/api/config.ts#L1-L24)
- `apps/api/src/ai/model-api.service.ts` - `MODEL_API_URL` env + hardcoded fallback URL list.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/api/src/ai/model-api.service.ts#L33-L47)
- `apps/api/src/main.ts` - Default localhost CORS origins + `WEB_ORIGINS` merge.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/apps/api/src/main.ts#L10-L20)
- `infra/deploy/.env.vps.example` - Deploy-time URL env placeholders.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/infra/deploy/.env.vps.example#L19-L27)
- `infra/deploy/docker-compose.vps.yml` - Hardcoded healthcheck URLs for web/admin/api/model-api.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/infra/deploy/docker-compose.vps.yml#L17-L73)
- `.github/workflows/deploy-vps.yml` - Build arg injection for Next public URL envs.  
  [Permalink](https://github.com/SunnyYeahBoiii/CITYFARM-2.0/blob/aa9e9b7d7db552cf0738dc93e85fcb58f774f5a3/.github/workflows/deploy-vps.yml#L78-L92)

## Architecture Documentation
- URL composition is centralized for frontend apps in `lib/api/config.ts` for both `apps/web` and `apps/admin`.
- API service endpoints are constructed from base URLs and path constants in `apps/api/src/ai/model-api.service.ts`.
- Deploy setup separates runtime env (`env_file`) and build-time public env (GitHub Actions build args for Next apps).
- Root/feature docs document expected env variables for local and VPS flows.

## Historical Context (from thoughts/)
- No prior research documents found under `thoughts/shared/research/` at research time.

## Related Research
- No related research documents currently present in `thoughts/shared/research/`.

## Open Questions
- No additional follow-up questions were provided in this request.
