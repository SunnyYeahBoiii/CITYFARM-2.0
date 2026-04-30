# Hardcoded URL and Env Mapping Production Readiness Plan

## Overview

Remove production-risk hardcoded URL fallbacks, standardize URL environment-variable contracts across apps, and align deploy/build docs so every runtime and build-time URL is explicitly configured.

## Current State Analysis

The monorepo already has env-driven URL plumbing in key places, but still relies on hardcoded localhost/internal fallbacks in runtime code and build/deploy layers. These fallbacks are useful for local development but risky in production because misconfiguration can silently route traffic to the wrong destination.

## Desired End State

All URL-bearing code paths must use explicit env contracts with predictable behavior by environment:
- Production must fail fast for missing required URL envs.
- Local development can still use safe defaults through dedicated dev-only fallback paths.
- Deploy and docs must describe one canonical env contract for web/admin/api/model-api.

### Key Discoveries:
- `apps/web/lib/api/config.ts` and `apps/admin/lib/api/config.ts` default to localhost when public URL envs are missing.
- `apps/api/src/ai/model-api.service.ts` has multi-target hardcoded fallback URLs when `MODEL_API_URL` is absent.
- `apps/api/src/main.ts` always includes localhost CORS origins, then merges `WEB_ORIGINS`.
- `apps/web/app/sitemap.ts` and `apps/web/app/robots.ts` fall back to localhost app URL.
- `apps/api/.env.example` currently duplicates/conflicts keys (`PORT`, `FRONTEND_URL`, `NODE_ENV`) and weakens config clarity.
- `docker/web.Dockerfile` and `docker/admin.Dockerfile` include localhost defaults for build args, while deploy workflow injects secret-based values at build time.

## What We're NOT Doing

- Reworking non-URL business logic in web/admin/api.
- Replacing external weather provider (`open-meteo`) unless needed for envability.
- Migrating deployment platform away from Docker Compose + GitHub Actions.
- Introducing a new config management service or secret vault in this iteration.

## Implementation Approach

Use a staged hardening approach:
1. Normalize config modules and env-validation behavior (code-level contract).
2. Align build/deploy contracts with explicit required variables.
3. Update docs/examples and add regression tests to prevent fallback regressions.

## Phase 1: Standardize Runtime URL Config Contracts

### Overview
Harden frontend and API runtime URL resolution so production does not rely on localhost/internal implicit defaults.

### Changes Required:

#### 1. Frontend config helpers (web/admin)
**File**: `apps/web/lib/api/config.ts`  
**Changes**:
- Introduce environment-aware resolver helper: allow localhost fallback only in non-production.
- In production, throw with actionable message if required envs are missing (`NEXT_PUBLIC_API_URL`, `NEST_API_URL` if still required).
- Keep URL normalization behavior.

**File**: `apps/admin/lib/api/config.ts`  
**Changes**:
- Mirror web behavior for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WEB_URL`.
- Ensure production fail-fast instead of silent localhost fallback.

```ts
function resolveRequiredBaseUrl(name: string, devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`[config] Missing required env: ${name}`);
}
```

#### 2. SEO metadata URL behavior
**File**: `apps/web/app/sitemap.ts`  
**File**: `apps/web/app/robots.ts`  
**Changes**:
- Replace raw fallback expression with shared resolver that enforces `NEXT_PUBLIC_APP_URL` in production and permits localhost only in development.

#### 3. API model upstream URL behavior
**File**: `apps/api/src/ai/model-api.service.ts`  
**Changes**:
- Replace broad fallback list with explicit behavior:
  - production: require `MODEL_API_URL`, fail fast if absent.
  - development: keep deterministic dev fallback (`http://127.0.0.1:3003` or one documented fallback).
- Keep existing retry/error-preview logic.

#### 4. API CORS origin behavior
**File**: `apps/api/src/main.ts`  
**Changes**:
- Keep localhost defaults only for non-production.
- In production, derive origins strictly from `WEB_ORIGINS` (and fail startup if empty/missing).

### Success Criteria:

#### Automated Verification:
- [x] Type check passes for all packages: `pnpm check-types`
- [x] Lint passes for changed packages: `pnpm lint`
- [ ] API tests/build pass: `pnpm --filter api test` (or existing equivalent in repo)
- [x] Web/admin builds succeed with explicit URL envs set:  
      `pnpm --filter web build` and `pnpm --filter admin build`

#### Manual Verification:
- [ ] In local dev without URL envs, web/admin/api still start with documented dev defaults.
- [ ] In production-like env with missing required URLs, startup/build fails with clear error messages.
- [ ] Chat proxy still reaches API when envs are correctly set.
- [ ] Admin login/logout redirects still target the intended web domain.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before moving to Phase 2.

---

## Phase 2: Align Deploy and Build Env Contracts

### Overview
Ensure infra/deploy and CI pipeline use one explicit URL contract and remove ambiguous/defaulted build/runtime behavior.

### Changes Required:

#### 1. Deploy env example cleanup
**File**: `infra/deploy/.env.vps.example`  
**Changes**:
- Keep all required URL vars, group by scope (API runtime, web build, admin build).
- Add comments for required vs optional vars and format constraints (comma-separated origins, URL scheme required).

#### 2. API env example cleanup
**File**: `apps/api/.env.example`  
**Changes**:
- Remove duplicate keys and conflicting values.
- Ensure one canonical declaration per variable.
- Document which URL envs are required in production vs optional in development.

#### 3. Docker build defaults hardening
**File**: `docker/web.Dockerfile`  
**File**: `docker/admin.Dockerfile`  
**Changes**:
- Remove localhost default values from `ARG` declarations (or guard with explicit dev build args only).
- Prefer explicit `--build-arg` values from CI and fail if missing for production image builds.

#### 4. Workflow consistency
**File**: `.github/workflows/deploy-vps.yml`  
**Changes**:
- Validate required URL-related secrets before build/deploy steps.
- Add explicit deploy-time checks that expected env vars exist before `docker compose up`.
- Ensure health-check URLs and service ports remain consistent (including admin port mapping assumptions).

### Success Criteria:

#### Automated Verification:
- [ ] CI workflow syntax is valid: `gh workflow view` / workflow lint step passes.
- [ ] Docker images build successfully with required URL build args present.
- [x] Deploy script exits early with actionable errors when required env/secrets are missing.
- [x] Compose config resolves cleanly: `docker compose -f infra/deploy/docker-compose.vps.yml config`

#### Manual Verification:
- [ ] VPS deployment using `.env` completes without manual variable guesswork.
- [ ] Services become healthy and reachable at intended domains.
- [ ] OAuth callback and frontend redirect URLs match deployed hostnames.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before moving to Phase 3.

---

## Phase 3: Documentation and Regression Safety Nets

### Overview
Capture the new URL/env contract in docs and add targeted tests/checks to prevent reintroduction of unsafe hardcoded fallbacks.

### Changes Required:

#### 1. Documentation updates
**File**: `README.md`  
**File**: `docs/deploy-vps-github-actions.md`  
**Changes**:
- Update env setup instructions to reflect required URL vars per app/environment.
- Remove references to missing `.env.example` files or add those files if documentation requires them.
- Document failure semantics (production fail-fast, development fallback behavior).

#### 2. Optional env examples for web/admin
**File**: `apps/web/.env.example` (if absent and docs reference it)  
**File**: `apps/admin/.env.example` (if absent and docs reference it)  
**Changes**:
- Add minimal canonical examples for required public URL vars.
- Keep format consistent with repo conventions.

#### 3. Regression checks
**File**: (new or existing test files in `apps/web`, `apps/admin`, `apps/api`)  
**Changes**:
- Add unit tests for config resolvers:
  - missing env in production throws.
  - missing env in development uses expected fallback.
  - URL normalization trims trailing slash.
- Add a lightweight static check (test or lint rule) that flags newly introduced localhost URL literals in runtime config files.

### Success Criteria:

#### Automated Verification:
- [x] Config resolver unit tests pass for web/admin/api.
- [ ] Repo lint/typecheck/test suite passes after doc/config/test additions.
- [x] Static regression check catches intentional localhost literal reintroduction in protected files.

#### Manual Verification:
- [ ] Onboarding flow for local setup is clear from docs alone.
- [ ] Production env checklist is complete and actionable for deploy operators.

**Implementation Note**: After completing this phase and all automated verification passes, pause for final manual confirmation.

---

## Testing Strategy

### Unit Tests:
- Config resolver behavior by environment (`NODE_ENV=development|production`).
- URL normalization and path joining logic.
- CORS origin resolution with/without `WEB_ORIGINS`.

### Integration Tests:
- Web chat proxy route reaches API when `NEST_API_URL` is valid.
- Admin auth redirect flow uses configured `NEXT_PUBLIC_WEB_URL`.
- API model upstream selection respects `MODEL_API_URL`.

### Manual Testing Steps:
1. Run local stack with partial envs and confirm development defaults work as documented.
2. Run production-like build/start with deliberately missing required vars and confirm explicit failure.
3. Execute login/logout + chatbot + sitemap/robots checks on deployed environment.

## Performance Considerations

Changes are config-focused and should be performance-neutral. Any additional validation occurs at startup/build-time, not request hot paths.

## Migration Notes

- No data migration required.
- Deployment migration is operational: update required secrets/envs before shipping stricter validation.
- Rollback path: temporarily relax validation in config resolvers if urgent, but keep docs and env contract aligned.

## References

- Original research: `thoughts/shared/research/2026-04-30-hardcoded-url-env-mapping.md`
- Related implementation files:
  - `apps/web/lib/api/config.ts`
  - `apps/web/app/sitemap.ts`
  - `apps/web/app/robots.ts`
  - `apps/admin/lib/api/config.ts`
  - `apps/api/src/ai/model-api.service.ts`
  - `apps/api/src/main.ts`
  - `apps/api/.env.example`
  - `infra/deploy/.env.vps.example`
  - `infra/deploy/docker-compose.vps.yml`
  - `.github/workflows/deploy-vps.yml`
  - `docker/web.Dockerfile`
  - `docker/admin.Dockerfile`
