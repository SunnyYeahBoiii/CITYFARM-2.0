# CITYFARM 2.0 – AI Urban Gardening App

**Idea credit:** [Đoàn Quốc Kiên (DoanQuocKien)](https://github.com/DoanQuocKien)

**CITYFARM 2.0** is a refactor of the original [CITYFARM](https://cityfarm.vercel.app/) — an AI-powered platform that helps urban residents grow clean food at home. By combining **Computer Vision** and **Generative AI**, we address the common problems of "not knowing what to grow" and "how to care for plants" in small urban spaces like balconies and rooftops.

This repository is a **monorepo** (Turborepo + pnpm) that reimplements the same product with a modern stack: **Next.js**, **NestJS**, and a dedicated **Python model API** for AI features.

---

## Key Features

### AI Space Analysis
Upload a photo of your balcony; our AI analyzes:
- **Light conditions** — direct sun, partial shade, or artificial light
- **Climate context** — real-time weather (temperature/humidity) for your location
- **Space estimation** — available planting area
- **Smart recommendations** — top plants (e.g. Tomato, Mint, Lettuce) that fit your environment

### Generative Garden Visualization
See your garden before you plant it. Generative AI overlays realistic plants onto your photo, showing your "future garden." Adapts to lighting and perspective.

### AI Gardening Assistant
- Chat with a botanical AI that knows specific plant needs
- **Context-aware** — adjusts advice for the plant you're asking about
- **Diagnose issues** — upload photos to identify pests or diseases

### Community Marketplace
- **Social feed** — share your harvest and see other urban farmers' posts
- **Fresh market** — buy and sell home-grown produce locally
- **Verified growers** — badges for users with documented planting logs

---

## Architecture

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐
│   Web    │──▶│   API    │──▶│Model API  │──▶│  Google     │
│ Next.js  │   │  NestJS  │   │  Flask    │   │  Gemini     │
│  :3000   │   │  :3001   │   │  :3003    │   │  AI         │
└──────────┘   └──────────┘   └─────────────┘   └─────────────┘
      │              │
┌──────────┐   ┌──────────┐
│  Admin   │   │Supabase  │
│ Next.js  │   │PostgreSQL│
│  :3002   │   └──────────┘
└──────────┘
```

---

## Tech Stack

### Monorepo
- **Turborepo** — build and task orchestration
- **pnpm** — package manager and workspaces

### Frontend (`apps/web` + `apps/admin`)
- **Framework:** Next.js 16, React 19, TypeScript
- **UI:** Shared `@repo/ui`, Tailwind CSS, Radix/shadcn-style components
- **HTTP:** axios

### Backend (`apps/api`)
- **Framework:** NestJS 11 (Node.js)
- **Database:** PostgreSQL (Supabase) via Prisma ORM
- **Auth:** Passport (JWT + Google OAuth 2.0), bcrypt
- **Testing:** Jest

### AI / Model API (`apps/model-api`)
- **Runtime:** Python 3.12 (Flask)
- **AI:** Google Gemini (Vision & Text)
- **Image processing:** OpenCV, NumPy, Pillow, rembg

---

## Installation

### Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | v20+ | Next.js + NestJS runtime |
| pnpm | v9+ | Package manager |
| Python | 3.10+ | Model API runtime |
| Poetry | latest | Python dependency management |
| Google Gemini API key | — | AI text/vision features |
| Supabase account | — | PostgreSQL database + storage |

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd CITYFARM-2.0
pnpm install
```

### 2. Setup Environment Variables

**API (`apps/api/.env`):**
```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default: 3001) |
| `MODEL_API_URL` | Yes | Model API URL, e.g. `http://127.0.0.1:3003` |
| `DATABASE_URL` | Yes | Supabase **pooled** connection string |
| `DIRECT_URL` | Yes | Supabase **direct** connection (for migrations) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SUPABASE_BUCKET_NAME` | Yes | Supabase storage bucket name |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SECRET_KEY` | Yes | Supabase secret key |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token secret |
| `JWT_ACCESS_SECRET` | Yes | JWT access token secret |
| `GOOGLE_CLIENT_ID` | If using Google OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | If using Google OAuth | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | If using Google OAuth | Google OAuth callback URL |
| `FRONTEND_URL` | Yes in production | Frontend URL, e.g. `http://localhost:3000` |
| `WEB_ORIGINS` | Yes in production | Comma-separated allowed CORS origins |
| `NODE_ENV` | No | `development` or `production` |

**Model API (`apps/model-api/.env`):**
```bash
cp apps/model-api/.env.example apps/model-api/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Model API port (default: 3003) |
| `FLASK_DEBUG` | No | Flask debug mode (`true` or `false`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |

**Web (`apps/web/.env.local`):**
```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API URL, e.g. `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Yes | Web app URL, e.g. `http://localhost:3000` |
| `NEST_API_URL` | Yes in production | API URL used by server-side routes/proxy |

**Admin (`apps/admin/.env.local`):**
```bash
cp apps/admin/.env.example apps/admin/.env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API URL, e.g. `http://localhost:3001` |
| `NEXT_PUBLIC_WEB_URL` | Yes | Web app URL, e.g. `http://localhost:3000` |

### 3. Install Python Dependencies

```bash
cd apps/model-api
poetry install
cd ../..
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm --filter api prisma:generate

# Run database migrations
pnpm --filter api prisma:migrate:dev

# Seed database with sample data (optional, 608 rows)
pnpm --filter api seed
```

### 5. Start Development Server

```bash
# Start all 4 apps simultaneously
pnpm dev
```

This starts:
- **Web** — http://localhost:3000
- **Admin** — http://localhost:3002
- **API** — http://localhost:3001
- **Model API** — http://localhost:3003
- **Landing** — http://localhost:3004

**Run individual apps:**
```bash
pnpm dev --filter=web        # Frontend only
pnpm dev --filter=admin      # Admin dashboard only
pnpm dev --filter=api        # Backend API only
pnpm dev --filter=model-api  # Python AI service only
```

---

## Development

### Build for Production

```bash
pnpm build
```

### Type Check & Lint

```bash
pnpm check-types    # TypeScript type check all apps
pnpm lint           # ESLint all apps
```

### Testing

```bash
pnpm --filter api test          # Unit tests
pnpm --filter api test:e2e      # E2E tests
pnpm --filter api test:cov      # Test coverage
```

### Database Management

```bash
# Open Prisma Studio (visual database browser)
pnpm --filter api prisma:studio

# Create a new migration after schema changes
pnpm --filter api prisma:migrate:dev

# Reset database (development only — drops all data)
pnpm --filter api prisma:migrate:reset

# Pull schema from database (without creating migration)
pnpm --filter api prisma:pull

# Push schema to database (without creating migration)
pnpm --filter api prisma:push
```

---

## Repository Structure

```
CITYFARM-2.0/
├── apps/
│   ├── web/                    # Next.js 16 — User-facing frontend
│   │   ├── app/                # App Router pages & layouts
│   │   ├── components/         # React components
│   │   └── .env.example
│   ├── admin/                  # Next.js 16 — Admin dashboard
│   │   ├── app/
│   │   └── .env.example
│   ├── api/                    # NestJS 11 — REST API backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema (24 models)
│   │   │   └── migrations/     # Migration history
│   │   └── src/
│   │       ├── auth/           # JWT + Google OAuth
│   │       ├── ai/             # AI space analysis, visualization, chat
│   │       ├── garden/         # Garden plants, care schedules, tasks
│   │       ├── products/       # Product catalog, kits
│   │       ├── order/          # Order management
│   │       ├── community/      # Feed posts, comments, reactions
│   │       ├── marketplace/    # Marketplace listings
│   │       ├── assets/         # Supabase storage integration
│   │       └── user/           # User profiles
│   └── model-api/              # Python Flask — AI/ML service
│       └── src/
│           └── main.py         # Flask routes (vision, generation, chat)
├── packages/
│   ├── ui/                     # Shared UI components (Tailwind + Radix)
│   ├── eslint-config/          # Shared ESLint configuration
│   └── typescript-config/      # Shared TypeScript configuration
├── docker/                     # Dockerfiles for each service
│   ├── web.Dockerfile
│   ├── admin.Dockerfile
│   ├── api.Dockerfile
│   └── model-api.Dockerfile
├── infra/deploy/
│   └── docker-compose.vps.yml  # Docker Compose for VPS deployment
├── .github/workflows/
│   └── deploy-vps.yml          # CI/CD pipeline
└── docs/                       # Documentation
    ├── CITYFARM_design_schema.md
    ├── database-schema.md
    ├── database-data-dictionary.md
    ├── database-seed.md
    ├── deploy-vps-github-actions.md
    ├── admin-app-plan.md
    └── mobile-auth-client.md
```

---

## Key API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth/*` | Register, login, JWT refresh, Google OAuth |
| AI | `/ai/*` | Space analysis, garden visualization, chatbot |
| Garden | `/garden/*` | Garden plants, care schedules, care tasks |
| Products | `/products/*` | Product catalog, plant kits |
| Orders | `/orders/*` | Order creation, status tracking |
| Community | `/community/*` | Feed posts, comments, reactions |
| Marketplace | `/marketplace/*` | Listings (buy/sell produce) |
| Users | `/users/*` | User profiles, settings |
| Assets | `/assets/*` | Image upload via Supabase storage |

See `apps/api/README.md` for full endpoint documentation.

---

## Database Schema

24 Prisma models covering:

| Category | Models |
|----------|--------|
| **Identity** | User, UserProfile, MediaAsset |
| **Catalog** | PlantSpecies, PlantCareProfile, Product, ProductComponent |
| **Commerce** | Order, OrderItem, KitActivationCode |
| **Analysis** | SpaceScan, ScanRecommendation, ScanVisualization |
| **Gardening** | GardenPlant, CareSchedule, CareTask, PlantJournalEntry |
| **Community** | MarketplaceListing, FeedPost, FeedComment, PostReaction |
| **Messaging** | Conversation, ConversationParticipant, Message |

See `docs/database-schema.md` and `docs/database-data-dictionary.md` for details.

---

## Docker

### Build Images Locally

```bash
docker build -t cityfarm-web -f docker/web.Dockerfile .
docker build -t cityfarm-admin -f docker/admin.Dockerfile .
docker build -t cityfarm-api -f docker/api.Dockerfile .
docker build -t cityfarm-model-api -f docker/model-api.Dockerfile .
```

### VPS Deployment (GitHub Actions)

CI/CD triggers on push to `main` branch:
1. **Quality check** — TypeScript type check
2. **Build & push** — Docker images to GitHub Container Registry
3. **Deploy** — SSH to VPS, pull images, run docker-compose, migrate DB

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS SSH address |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | SSH private key |
| `WEB_NEXT_PUBLIC_API_URL` | Production API URL for web |
| `WEB_NEXT_PUBLIC_APP_URL` | Production web URL |
| `ADMIN_NEXT_PUBLIC_API_URL` | Production API URL for admin |
| `ADMIN_NEXT_PUBLIC_WEB_URL` | Production web URL for admin |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions for GHCR push/login |

`deploy-vps.yml` also validates required runtime variables from VPS `.env` (database, auth, URL config, and `GEMINI_API_KEY`) before `docker compose up`.

**Manual deploy on VPS:**
```bash
# On the VPS, with .env file in place
docker compose -f infra/deploy/docker-compose.vps.yml pull
docker compose -f infra/deploy/docker-compose.vps.yml up -d
```

---

## Troubleshooting

**Model API fails to start:**
- Ensure Poetry is installed: `pip install poetry`
- Run `poetry install` inside `apps/model-api/`
- Verify `GEMINI_API_KEY` is set in `.env`

**Prisma migration errors:**
- `DATABASE_URL` must use Supabase **pooled** connection (port 6543)
- `DIRECT_URL` must use Supabase **direct** connection (port 5432)
- Reset with `pnpm --filter api prisma:migrate:reset` (dev only, drops data)

**API can't connect to Model API:**
- Verify `MODEL_API_URL` in `apps/api/.env` matches actual Model API URL
- Both services must be running

**Web/Admin can't connect to API:**
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` files
- In production, missing required URL envs fail build/startup with clear `[config] Missing required env: ...` errors
- These are **build-time** variables — restart dev server after changing

**Port already in use:**
- Default ports: web=3000, api=3001, admin=3002, model-api=3003, landing=3004
- Kill existing process: `lsof -ti :3000 | xargs kill`

---

## Useful Links

- [Design System](docs/CITYFARM_design_schema.md)
- [Database Schema](docs/database-schema.md)
- [Data Dictionary](docs/database-data-dictionary.md)
- [Seed Data](docs/database-seed.md)
- [VPS Deployment Guide](docs/deploy-vps-github-actions.md)
- [Admin App Plan](docs/admin-app-plan.md)
- [Mobile Auth Client](docs/mobile-auth-client.md)
- [API Documentation](apps/api/README.md)

---

## License

MIT
