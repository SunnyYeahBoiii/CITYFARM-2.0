# CITYFARM 2.0 - API Server

NestJS backend API for CITYFARM 2.0, an urban community garden management platform built on Prisma and PostgreSQL.

## Description

Production-grade REST API providing:
- User management and authentication (roles: USER, SUPPLIER, EXPERT, ADMIN)
- Plant species catalog with care guidance
- Garden plant tracking and care scheduling
- Space scanning and AI-powered plant recommendations
- Marketplace listing management
- Community social features (posts, comments, reactions)
- Real-time messaging and conversation threads
- Order and purchase management

## Technology Stack

- **Framework**: NestJS 11.0.1
- **Database**: PostgreSQL 14+ via Supabase (with PgBouncer pooling)
- **ORM**: Prisma 6.0.0
- **Runtime**: Node.js v22+ with pnpm package management
- **Language**: TypeScript

## Project Setup

```bash
# Install dependencies (from monorepo root)
pnpm install

# Install dependencies (from api directory)
pnpm install -C apps/api
```

## Environment Variables

Create `.env` file in `apps/api/`:

```env
# PostgreSQL connections (Supabase)
DATABASE_URL="postgresql://user:password@db.example.com:5432/cityfarm?schema=public"
DIRECT_URL="postgresql://user:password@db.example.com:6543/cityfarm?schema=public"

# API configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"
COOKIE_SAME_SITE="lax"
COOKIE_DOMAIN=""
```

- `DATABASE_URL`: Connection via PgBouncer (for application use)
- `DIRECT_URL`: Direct connection (for database migrations via Prisma)
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins.
- `COOKIE_SAME_SITE`: `lax`, `strict`, or `none` (recommended `none` in production cross-origin setups).
- `COOKIE_DOMAIN`: Optional cookie domain for production.

## Development

### Compile and Run

```bash
# Development mode (watch)
pnpm run dev

# Production mode
pnpm run start:prod

# Production mode with debugging
pnpm run start:debug
```

Server runs on `http://localhost:3001` by default.

### Code Quality

```bash
# Lint TypeScript
pnpm run lint

# Format code
pnpm run format

# Validate Prisma schema
pnpm run prisma:validate

# Format Prisma schema
pnpm run prisma:format

# Generate Prisma Client
pnpm run prisma:generate
```

## Database Management

### Migrations

```bash
# Create a new migration after schema changes
pnpm run prisma:migrate:dev

# Deploy migrations to production
pnpm run prisma:migrate:deploy
```

### Database Seeding

Pre-populated database with 608 realistic rows across 24 tables for development and testing.

#### Quick Start

```bash
# Full seed + verification (recommended)
pnpm run seed

# Or run separately:
pnpm run seed:sql      # Populate all 5 seed files
pnpm run seed:verify   # Run validation checks
```

#### Seed Data Contents

| Table | Rows | Purpose |
|-------|------|---------|
| User | 24 | Test accounts (20 USER, 2 SUPPLIER, 1 EXPERT, 1 ADMIN) |
| UserProfile | 24 | Public profile, district, verification snapshot |
| MediaAsset | 30 | Profile avatars, scan visualizations, product images |
| PlantSpecies | 24 | HCMC-suitable vegetables and herbs (tomato, lettuce, basil, etc.) |
| PlantCareProfile | 24 | Care guidance per species with pest info |
| Product | 24 | 6 kits, 6 seeds, 4 soils, 4 pots, 2 sensors, 2 add-ons |
| ProductComponent | 24 | Kit composition graph back to existing products |
| Order | 20 | Order lifecycle from completed to cancelled |
| OrderItem | 24 | Deterministic kit items aggregated into orders |
| KitActivationCode | 24 | 8 redeemed, remaining pending/expired for later activation |
| SpaceScan | 24 | 20 analyzed scans, 4 failed retries |
| ScanRecommendation | 30 | Ranked AI recommendations with unique scan + rank pairs |
| ScanVisualization | 20 | Overlay/generative outputs for analyzed scans |
| GardenPlant | 24 | 3 sources: kits (8), scans (8), manual (8) |
| CareSchedule | 24 | Watering/pruning/fertilizing schedules |
| CareTask | 30 | Mixed completed, pending, overdue and skipped task states |
| PlantJournalEntry | 30 | Base journal plus follow-up entries for active plants |
| MarketplaceListing | 20 | Verified, pending and draft/cancelled listing states |
| FeedPost | 24 | Community posts (SHOWCASE, QUESTION, HARVEST_UPDATE, etc.) |
| FeedComment | 30 | Top-level comments plus threaded replies |
| PostReaction | 30 | LIKE, SUPPORT, THANKS reactions with unique post/user pairs |
| Conversation | 20 | 10 marketplace, 8 AI assistant, 1 community, 1 support |
| ConversationParticipant | 30 | Seller/buyer pairs and single-user AI/support threads |
| Message | 30 | Marketplace negotiations and AI advisory exchanges |

**Total**: 608 rows with realistic temporal relationships, FK integrity, and enum distributions.

#### Seed Data Characteristics

- **Idempotent**: Safe to run multiple times (TRUNCATE CASCADE clears existing data)
- **Deterministic**: Fixed UUIDs (00000001-...) enable consistent test relationships
- **Temporal**: Timestamps show realistic progressions (orders → confirmations, plants → harvests)
- **Realistic**: Enum distributions varied (not all defaults), Vietnamese pricing, HCMC geography

#### Seed File Structure

Organized in 5 logical parts for manageable complexity:

1. **seed.sql**: Identity, media, plant catalog and products
2. **seed-part2.sql**: Orders, order items and kit activation codes
3. **seed-part3.sql**: Space scanning, AI recommendations and visualizations
4. **seed-part4.sql**: Garden tracking, care schedules/tasks and journals
5. **seed-part5.sql**: Marketplace, social feed, conversations and messages

#### Verification

After seeding, run validation queries:

```bash
pnpm run seed:verify
```

Checks include:
- Row count validation (24 users, 30 assets, 20 orders, etc.)
- Foreign key integrity (no orphaned records)
- Unique constraint satisfaction (codes, reactions, participants)
- Enum distributions (realistic status mixes)
- Price ranges (marketplace listings 30K-180K VND)
- Engagement metrics (comments per post, reactions per post)
- User activity analysis (posts and comments per user)
- Data consistency (no duplicates, no 0/negative prices)

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:cov

# E2E tests
pnpm run test:e2e

# E2E tests with debugging
pnpm run test:debug
```

## Deployment

Local development uses DATABASE_URL (pooled connection via PgBouncer).

For **Prisma migrations in production**, temporarily use DIRECT_URL:
```bash
DIRECT_URL="postgresql://..." pnpm run prisma:migrate:deploy
```

Then revert to DATABASE_URL for application runtime.

## Project Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Prisma schema (18 models, 19 enums)
│   ├── seed.sql               # Seed data (Part 1)
│   ├── seed-part2.sql         # Seed data (Part 2)
│   ├── seed-part3.sql         # Seed data (Part 3)
│   ├── seed-part4.sql         # Seed data (Part 4)
│   ├── seed-part5.sql         # Seed data (Part 5)
│   └── seed-verify.sql        # Verification queries
├── generated/prisma/          # Generated Prisma Client
├── src/
│   ├── app.module.ts          # Root module
│   ├── app.service.ts         # Business logic
│   ├── app.controller.ts      # HTTP endpoints
│   └── main.ts                # Application entry
├── test/
│   └── app.e2e-spec.ts        # E2E tests
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── nest-cli.json              # NestJS CLI configuration
```

## Database Schema

24 Prisma models with complex relationships:

- **Identity**: User, UserProfile, MediaAsset
- **Catalog**: PlantSpecies, PlantCareProfile, Product, ProductComponent
- **Commerce**: Order, OrderItem, KitActivationCode
- **Analysis**: SpaceScan, ScanRecommendation, ScanVisualization
- **Gardening**: GardenPlant, CareSchedule, CareTask, PlantJournalEntry
- **Community**: MarketplaceListing, FeedPost, FeedComment, PostReaction
- **Messaging**: Conversation, ConversationParticipant, Message

See [docs/database-schema.md](../../docs/database-schema.md) for full entity relationships.

## Troubleshooting

### Database Connection Issues

Check `DATABASE_URL` format and credentials:
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

### Prisma Generation Fails

Regenerate Prisma Client:
```bash
pnpm run prisma:generate
```

### Seed Data Fails

Verify PostgreSQL is running and accessible. For details:
```bash
psql "$DATABASE_URL" -f prisma/seed-verify.sql
```

## Additional Resources

- [CITYFARM Design System](../../docs/CITYFARM_design_schema.md)
- [Database Schema Reference](../../docs/database-schema.md)
- [Seed Data Dictionary](../../docs/database-data-dictionary.md)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
