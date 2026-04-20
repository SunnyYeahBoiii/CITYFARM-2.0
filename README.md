# 🌿 CITYFARM 2.0 – AI Urban Gardening App

**Idea credit:** [Đoàn Quốc Kiên (DoanQuocKien)](https://github.com/DoanQuocKien)

**CITYFARM 2.0** is a refactor of the original [CITYFARM](https://cityfarm.vercel.app/) — an AI-powered platform that helps urban residents grow clean food at home. By combining **Computer Vision** and **Generative AI**, we address the common problems of “not knowing what to grow” and “how to care for plants” in small urban spaces like balconies and rooftops.

This repository is a **monorepo** (Turborepo + pnpm) that reimplements the same product with a modern stack: **Next.js**, **NestJS**, and a dedicated **Python model API** for AI features.

---

## ✨ Key Features

### 📸 1. AI Space Analysis
Stop guessing. Upload a photo of your balcony; our AI analyzes:
* **Light conditions** — direct sun, partial shade, or artificial light.
* **Climate context** — real-time weather (temperature/humidity) for your location.
* **Space estimation** — available planting area.
* **Smart recommendations** — top plants (e.g. Tomato, Mint, Lettuce) that fit your environment.

### 🎨 2. Generative Garden Visualization
See your garden before you plant it.
* Generative AI overlays realistic plants onto your photo, showing your “future garden.”
* Adapts to lighting and perspective.

### 💬 3. AI Gardening Assistant
* Chat with a botanical AI that knows specific plant needs.
* **Context-aware** — adjusts advice for the plant you’re asking about (e.g. Tomato vs Mint).
* **Diagnose issues** — upload photos to identify pests or diseases (e.g. yellow leaves, aphids).

### 🥬 4. Community Marketplace
* **Social feed** — share your harvest and see other urban farmers’ posts.
* **Fresh market** — buy and sell home-grown produce locally.
* **Verified growers** — badges for users with documented planting logs.

---

## 🛠️ Tech Stack (2.0 Refactor)

### Monorepo
* **Turborepo** — build and task orchestration.
* **pnpm** — package manager and workspaces.

### Frontend (`apps/web`)
* **Framework:** Next.js 16, React 19, TypeScript.
* **UI:** Shared `@repo/ui`, Tailwind, Radix/shadcn-style components.
* **State:** React hooks.

### Backend (`apps/api`)
* **Framework:** NestJS 11 (Node.js).
* **API:** REST; can integrate with model-api and external services (e.g. weather).

### AI / Model API (`apps/model-api`)
* **Runtime:** Python (Flask).
* **AI:** Google Gemini (Vision & Text), image processing (PIL, NumPy).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v18+
* **pnpm** v9+
* **Python** 3.10+ (for `model-api`)
* **Poetry** (for `model-api` dependencies)
* **Google Gemini API key** (for AI features)
* **OpenWeatherMap API key** (optional, for weather)

### 1. Clone and install (root)

```bash
git clone <your-repo-url>
cd CITYFARM-2.0
pnpm install
```

### 2. Environment variables

Copy example env files and fill in secrets:

```bash
# Web
cp apps/web/.env.example apps/web/.env

# API
cp apps/api/.env.example apps/api/.env

# Model API (Python)
cp apps/model-api/.env.example apps/model-api/.env
```

Add at least:
* `apps/web/.env` — `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_AUTH_API_BASE`.
* `apps/api/.env` — `DATABASE_URL`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS`.
* `apps/model-api/.env` — e.g. `GEMINI_API_KEY`, `OPENWEATHER_API_KEY` if used.

### 3. Model API (Python)

```bash
cd apps/model-api
poetry install
cd ../..
```

### 4. Run all apps

From the repo root:

```bash
pnpm dev
```

This starts (via Turborepo):
* **Web** — [http://localhost:3000](http://localhost:3000)
* **API** — NestJS in watch mode (see `apps/api` for port)
* **Model API** — Flask app (see `apps/model-api` for port)

To run a single app:

```bash
pnpm dev --filter=web
pnpm dev --filter=api
pnpm dev --filter=model-api
```

### 5. Build

```bash
pnpm build
```

---

## 📁 Repository structure

```
CITYFARM-2.0/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── model-api/    # Python AI/model service (Flask)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config/
│   └── typescript-config/
├── package.json      # Root scripts (turbo, pnpm)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 📄 License

MIT.
