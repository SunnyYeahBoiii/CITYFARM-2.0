## CITYFARM Model API

Python Flask service for AI/model endpoints.

### Prerequisites

- Python 3.10+
- Poetry

### Install

```bash
poetry install
```

### Environment

Copy and edit environment variables:

```bash
cp .env.example .env
```

Main variables:

- `PORT` (default: `3002`)
- `FLASK_DEBUG` (`0` for production)
- `GEMINI_API_KEY`
- `OPENWEATHER_API_KEY`

### Run

Development:

```bash
pnpm dev --filter=model-api
```

WSGI production path:

```bash
pnpm --filter=model-api run start:prod
```

ASGI path:

```bash
pnpm --filter=model-api run start:asgi
```

### Health Check

- `GET /healthz`
