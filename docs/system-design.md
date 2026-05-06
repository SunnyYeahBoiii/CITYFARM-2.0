# CITYFARM 2.0 System Design

Tài liệu này mô tả kiến trúc hiện tại của codebase CITYFARM 2.0 ở mức container/runtime để có thể prompt sang công cụ vẽ diagram. Đây là mô tả as-is dựa trên code hiện tại, không phải kiến trúc đề xuất.

## Copy Prompt Để Vẽ Diagram

```text
Vẽ system design diagram cho CITYFARM 2.0 theo mô tả as-is dưới đây.

Phong cách diagram:
- Dùng C4 container view hoặc architecture flowchart.
- Nhóm theo vùng: Client/Edge, Next.js apps, NestJS API, AI service, Data/Storage, External services.
- Hiển thị rõ đường request chính, đường auth cookie/JWT, đường upload ảnh, đường AI scan/chat, và đường admin moderation.
- Gắn nhãn port/runtime cho từng service.

Các thành phần:
1. Browser / Mobile Web User truy cập hệ thống qua Nginx reverse proxy.
2. Nginx route:
   - /landing -> apps/landing Next.js, port 3004
   - /admin -> apps/admin Next.js, port 3002
   - /api/* -> apps/api NestJS, port 3001
   - / -> apps/web Next.js mobile app, port 3000
3. apps/web là Next.js App Router mobile web app:
   - RootLayout gọi getUser -> /auth/profile để hydrate AuthProvider.
   - Authenticated groups (tabs), (detail), (chat) dùng server layout guards.
   - AppShell gồm ShellTopBar, scrollable main, ShellBottomDock.
   - Feature screens gọi Nest API qua Axios api withCredentials.
   - Next route /api/chat proxy sang Nest /api/chat bằng NEST_API_URL và forward cookie + x-cityfarm-user-id.
4. apps/admin là Next.js App Router admin app:
   - basePath /admin.
   - Next proxy kiểm tra access_token/refresh_token, gọi /auth/profile, redirect guest sang web /login, redirect non-admin sang /admin/access-denied.
   - Server pages dùng requireAdminUser.
   - Admin pages gọi /admin/posts, /admin/marketplace, /admin/orders, /admin/users và PATCH các resource đó.
5. apps/landing là static/marketing Next app:
   - basePath /landing.
   - Chủ yếu là landing content, in-page anchors, mailto CTA.
6. apps/api là NestJS backend:
   - main.ts bật CORS credentials, cookie-parser, global ValidationPipe.
   - AppModule import Auth, User, Products, Cart, Order, Garden, Community, Assets, Ai, AdminContent, AdminOperations, Prisma.
   - Controllers -> services -> PrismaService.
   - Auth dùng JWT access/refresh cookies, Passport JWT, Google OAuth, RolesGuard cho admin.
7. apps/model-api là Flask AI service, port 3003:
   - /ready healthcheck.
   - /api/chat, /api/analyze-plant-health, /api/analyze-space, /api/render-space-visualization.
   - Dùng Google GenAI / Vertex credentials.
8. Data/storage:
   - Supabase-hosted PostgreSQL là source of truth, accessed through PrismaService + DATABASE_URL.
   - Supabase Storage chứa ảnh/file; DB chỉ lưu MediaAsset metadata.
9. External services:
   - Google OAuth cho login social.
   - Google GenAI / Vertex AI cho model-api.
10. Monorepo/build/deploy:
   - Root là pnpm@9 + Turborepo monorepo với workspaces apps/* và packages/*.
   - Next apps build standalone; API build Nest dist sau Prisma generate; model-api build Python image.
   - GitHub Actions build GHCR images theo SHA, render Nginx template trên VPS, chạy docker compose, rồi readiness probe.

Luồng chính cần thể hiện:
- Auth: browser -> web/admin -> API /auth/login|profile|refresh|logout -> User/UserProfile trong Postgres; access_token và refresh_token là httpOnly cookies.
- Web data: feature screens -> Axios api -> Nest REST endpoints -> Prisma/Postgres.
- Scan: web ScanScreen -> POST /api/scan/analyze multipart -> Nest AppService -> model-api /api/analyze-space -> Postgres SpaceScan/ScanRecommendation/ScanVisualization + optional Supabase Storage image.
- Journal health: web PlantDetail -> upload asset -> Supabase Storage + MediaAsset -> GardenService -> model-api /api/analyze-plant-health -> PlantJournalEntry + GardenPlant health update.
- Chatbot: web ChatbotScreen -> Next /api/chat -> Nest /api/chat -> AppService loads RAG context from GardenPlant/CareTask/Journal/Conversation -> model-api /api/chat -> optional ToolExecutorService creates/updates CareTask -> Message persisted.
- Commerce: web Order/Cart -> /shop/products, /cart, /orders, /orders/from-cart -> Product/Cart/Order/OrderItem/KitActivationCode.
- Activation: user enters kit activation code -> /garden/activate -> KitActivationCode redeemed -> GardenPlant + CareSchedule/CareTask seeded.
- Community/Marketplace: web Community -> /community/feed, /community/marketplace, comments/reactions/listing create -> FeedPost/FeedComment/PostReaction/MarketplaceListing.
- Admin: admin app -> /auth/profile -> /admin/* endpoints protected by JwtAuthGuard + RolesGuard ADMIN -> services mutate posts/listings/orders/users.
```

## Mermaid Khởi Đầu

```mermaid
flowchart TB
  User[Browser / Mobile Web User] --> Edge[Nginx reverse proxy]

  Edge -->|/landing, port 3004| Landing[apps/landing Next.js]
  Edge -->|/, port 3000| Web[apps/web Next.js mobile app]
  Edge -->|/admin, port 3002| Admin[apps/admin Next.js admin]
  Edge -->|/api/*, port 3001| API[apps/api NestJS backend]

  subgraph WebApp[apps/web]
    WebLayout[RootLayout + Providers]
    WebGuards[Server layout guards]
    WebShell[AppShell / DetailShell / ChatbotShell]
    WebFeatures[Feature screens]
    WebChatRoute[Next route /api/chat]
    WebLayout --> WebGuards --> WebShell --> WebFeatures
    WebFeatures --> WebChatRoute
  end

  subgraph AdminApp[apps/admin]
    AdminProxy[Next proxy]
    AdminGuard[requireAdminUser]
    AdminShell[AdminShell pages]
    AdminProxy --> AdminGuard --> AdminShell
  end

  subgraph NestAPI[apps/api NestJS]
    Auth[Auth/User module]
    Shop[Products/Cart/Order modules]
    Garden[Garden module]
    Community[Community/Admin modules]
    Assets[Assets module]
    AI[Ai/AppService/ToolExecutor]
    Prisma[PrismaService]
  end

  subgraph ModelAPI[apps/model-api Flask, port 3003]
    ModelReady[/ready]
    ModelChat[/api/chat]
    ModelVision[/api/analyze-space + plant-health + render/]
  end

  DB[(Supabase PostgreSQL)]
  Storage[(Supabase Storage bucket)]
  GoogleOAuth[Google OAuth]
  GoogleAI[Google GenAI / Vertex AI]

  WebFeatures -->|Axios api, cookies| API
  WebLayout -->|serverApiFetch /auth/profile| API
  WebChatRoute -->|NEST_API_URL /api/chat + cookies + x-cityfarm-user-id| API
  AdminProxy -->|/auth/profile + cookie header| API
  AdminShell -->|/admin/* reads/PATCH| API

  Auth --> Prisma
  Shop --> Prisma
  Garden --> Prisma
  Community --> Prisma
  Assets --> Prisma
  AI --> Prisma
  Prisma -->|DATABASE_URL| DB

  Assets -->|upload/download/delete| Storage
  Garden -->|journal image download| Storage
  AI -->|MODEL_API_URL| ModelChat
  AI -->|MODEL_API_URL| ModelVision
  ModelChat --> GoogleAI
  ModelVision --> GoogleAI
  Auth --> GoogleOAuth
```

## Runtime Và Routing

| Layer | Runtime | Route/port | Vai trò |
| --- | --- | --- | --- |
| Nginx | VPS reverse proxy | 80/443 | Terminate HTTP(S), route theo path. |
| `apps/landing` | Next.js standalone | `/landing`, container port `3004` | Landing/marketing app. |
| `apps/web` | Next.js standalone | `/`, container port `3000` | Mobile web app cho user. |
| `apps/admin` | Next.js standalone | `/admin`, host port `3002`, container port `3000` | Admin dashboard. |
| `apps/api` | NestJS | `/api/*`, port `3001` | REST API/BFF, auth, domain logic. |
| `apps/model-api` | Flask | internal port `3003` | AI chat/vision/image rendering service. |
| Supabase Postgres | PostgreSQL | `DATABASE_URL` | Source of truth. |
| Supabase Storage | Object storage | Supabase SDK | Binary image/file storage. |

Compose dùng một network `app-net`. `web` và `admin` phụ thuộc `api` healthy; `api` phụ thuộc `model-api` healthy. `api` readiness kiểm tra Postgres bằng `SELECT 1` và model-api `/ready`.

## Monorepo, Build Và Deploy

- Root workspace dùng `pnpm@9.0.0` và Turborepo; root scripts `build`, `dev`, `lint`, `check-types` delegate qua `turbo run`.
- Workspaces gồm `apps/*` và `packages/*`.
- Shared packages hiện có `packages/ui`, `packages/eslint-config`, `packages/typescript-config`.
- Next apps (`web`, `admin`, `landing`) dùng standalone output để chạy bằng `node apps/<app>/server.js`.
- `docker/web.Dockerfile` cần build args `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEST_API_URL`.
- `docker/admin.Dockerfile` cần build args `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_URL`.
- `docker/api.Dockerfile` chạy install deps, Prisma generate, Nest build, rồi `node dist/src/main.js`.
- `docker/model-api.Dockerfile` dùng Python 3.12 slim, cài `requirements.txt`, expose `3003`.
- Deploy VPS build/push image, set image refs vào `.env`, render Nginx templates bằng env vars, `docker compose up`, sau đó kiểm tra readiness của model-api, api, web, landing, admin, nginx.

## Backend Module View

`AppModule` import các feature modules:

- `AuthModule`, `UserModule`: register/login/refresh/logout/profile, JWT cookies, Google OAuth.
- `ProductsModule`, `CartModule`, `OrderModule`: catalog, cart, checkout, activation codes.
- `GardenModule`: garden plants, care schedules/tasks, journal, activation.
- `CommunityModule`: feed, comments, reactions, marketplace listings.
- `AssetsModule`: upload file vào Supabase Storage và tạo `MediaAsset`.
- `AiModule`: `ModelApiService`, `ToolExecutorService`, AI chat/scan/vision workflows.
- `AdminContentModule`, `AdminOperationsModule`: admin moderation/operations endpoints.
- `PrismaModule`: global `PrismaService` dùng `@prisma/adapter-pg` + `DATABASE_URL`.

## Luồng Dữ Liệu Chính

### Auth

1. Web/admin gọi `POST /auth/login` hoặc Google OAuth.
2. API tạo access/refresh JWT, hash refresh token, set `access_token` và `refresh_token` httpOnly cookies.
3. Server layouts/proxy gọi `/auth/profile` bằng cookies để guard route.
4. Axios client retry `401` qua `/auth/refresh`; nếu vẫn fail thì redirect `/login`.
5. Admin kiểm tra thêm `UserRole.ADMIN` ở Next proxy/server guard và Nest `RolesGuard`.

### Scan Không Gian

1. Web `ScanScreen` upload ảnh qua `/api/scan/analyze`.
2. Nest nhận multipart, gửi image base64 và plant catalog sang model-api `/api/analyze-space`.
3. API enrich recommendation bằng `Product`, `PlantSpecies`, `MediaAsset`.
4. Nếu có ảnh cây, API tải ảnh từ Supabase Storage rồi gọi `/api/render-space-visualization`.
5. Kết quả map sang scan analysis/recommendations/visualization cho frontend.

### Journal Và Plant Health

1. Web upload ảnh journal vào `/assets/upload`.
2. API ghi file vào Supabase Storage và tạo `MediaAsset`.
3. Web gọi `/garden/:plantId/journal` với `imageAssetId`.
4. Garden service xác minh ownership, tải ảnh nếu cần, gọi model-api `/api/analyze-plant-health`.
5. API tạo `PlantJournalEntry`, cập nhật `GardenPlant.healthStatus/growthStage`.

### Chatbot Và Tool Calling

1. Web `ChatbotScreen` gọi same-origin Next route `/api/chat`.
2. Next route forward cookie và `x-cityfarm-user-id` sang Nest `/api/chat`.
3. API load context từ `GardenPlant`, species care profile, pending tasks, recent journals, conversation history.
4. API gọi model-api `/api/chat` với tool definitions.
5. Nếu model trả tool call, `ToolExecutorService` tạo/cập nhật/xoá/log `CareTask`.
6. `Message` user/assistant được lưu trong `Conversation`.

### Commerce Và Activation

1. Web gọi `/shop/products`, `/cart`, `/orders`, `/orders/from-cart`.
2. Order service tạo `Order`, `OrderItem`, sinh `KitActivationCode`.
3. User nhập code ở `/garden/activate`.
4. Garden service redeem code, tạo `GardenPlant`, seed `CareSchedule` và `CareTask`.

### Community, Marketplace, Admin

1. Community feed/listings đọc public endpoints; create/delete/comment/reaction/listing cần JWT.
2. `MarketplaceListing` gắn với `GardenPlant` để giữ nguồn gốc verified grower.
3. Admin app gọi `/admin/posts`, `/admin/marketplace`, `/admin/orders`, `/admin/users`.
4. Nest admin controllers dùng `JwtAuthGuard + RolesGuard + @Roles(ADMIN)`.

## Nguồn Tham Chiếu Chính

- `infra/nginx/cityfarm.https.conf.template`: Nginx routes `/landing`, `/admin`, `/api`, `/`.
- `infra/deploy/docker-compose.vps.yml`: service images, ports, env, healthchecks.
- `apps/web/app/(tabs)/layout.tsx`, `apps/web/components/cityfarm/layout/AppShell.tsx`: mobile app shell and guards.
- `apps/admin/proxy.ts`, `apps/admin/lib/auth-server.ts`: admin auth guard.
- `apps/api/src/main.ts`, `apps/api/src/app.module.ts`: Nest bootstrap/module graph.
- `apps/api/src/prisma/prisma.service.ts`: DB connection through Prisma.
- `apps/api/src/assets/supabase-storage.service.ts`: Supabase Storage integration.
- `apps/api/src/ai/model-api.service.ts`: model-api integration.
- `apps/model-api/src/main.py`: Flask routes.
