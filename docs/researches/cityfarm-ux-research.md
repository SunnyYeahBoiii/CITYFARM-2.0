# CITYFARM 2.0 UX Improvement Research

Consolidated findings from 5 deep-dive research agents.
Date: 2026-04-28

---

## 1. Feed & Post - Infinite Scroll

### Current State
- **Frontend**: `CommunityScreen.tsx` loads posts via `GET /api/community/feed?limit=10&page=1`
- **Backend**: `community.service.ts` uses offset pagination: `skip: (page - 1) * limit`
- **Response**: `{ posts, hasMore, total }`
- **UI**: Posts rendered as flat list, no infinite scroll, no IntersectionObserver
- **Problem**: Offset pagination causes "shifting window" when new posts inserted during scroll - duplicates, skipped items

### What Needs to Change
**Backend:**
- Replace offset pagination with cursor-based pagination
- Use `{ createdAt, id }` compound cursor for stable positioning
- Add `GET /api/community/feed?cursor=TIMESTAMP_ID&limit=20` endpoint
- Prisma already has `@@index([createdAt])` - optimal for cursor queries

**Frontend:**
- Add `useInfiniteQuery` (TanStack Query) with cursor tracking
- Implement `IntersectionObserver` sentinel for auto-load
- Maintain posts array with append logic (no replace)
- Add skeleton screens for initial load, inline spinner for subsequent pages
- Implement optimistic updates for reactions/comments

### Facebook/Meta Best Practices
- Cursor pagination (Relay spec) - not offset
- Feed ranking: recency + engagement decay + user affinity
- Virtual scrolling (TanStack Virtual) for DOM recycling at 60fps
- Skeleton screens for initial, inline spinners for subsequent loads
- Error recovery: keep existing content, show retry button
- Optimistic UI: store optimistic version separately, auto-rollback on error
- Psychology: infinite scroll for browsing/serendipity; provide "back to top"

---

## 2. Garden Assistant - Chat Context Memory

### Current State
- **Frontend**: `ChatbotScreen.tsx` - messages in `useState`, NO persistence
- **API Route**: `api/chat/route.ts` - proxies to NestJS, passes `plantId` + `context`
- **Backend**: `app.service.ts` - `processChatRequest()` builds RAG context
- **Persistence**: When `plantId` provided, messages stored in `Message` table, conversation in `Conversation` table
- **History retrieval**: Last 20 messages loaded server-side, but NOT loaded on frontend page mount
- **Gap**: Frontend starts fresh each visit, ignores stored conversation history

### What Needs to Change
**Backend:**
- Add `GET /api/chat/conversation/:plantId` endpoint to return conversation history
- Increase message retrieval from 20 to 50 (configurable)
- Return `conversationId` in initial response for frontend tracking

**Frontend:**
- On ChatbotScreen mount with `plantId`, fetch conversation history
- Display previous messages (welcome + history)
- Track `conversationId` in state for subsequent messages
- Handle loading/error states gracefully

### Chat Context Enhancement
- Currently: last 2 journal entries, last 3 care tasks
- Recommended: last 10 journal entries with full fields (healthStatus, issueSummary, recommendationSummary, aiAnalysis)
- Include pending care tasks in context
- Include plant species care profile

---

## 3. Garden Assistant - Tool Calling

### Current State
- AI returns plain text `{ success, reply }` from Python model-api
- No tool calling support
- CareTasks created only via kit activation code (automatic schedules)
- No manual task creation endpoint exists
- `CareTask` model: 14 fields, types: WATERING/FERTILIZING/PRUNING/ROTATING/PEST_CHECK/HARVEST/CUSTOM

### What Needs to Change
**Backend:**
- Add `POST /api/garden/plants/:plantId/tasks` endpoint for manual task creation
- Add `tool-executor.service.ts` in NestJS for executing AI tool calls
- Define tools: `create_care_task`, `update_care_task`, `log_care_completion`, `log_journal_entry`, `get_pending_tasks`, `create_care_schedule`
- Modify chat flow: AI response → parse tool_calls → execute → return result to AI → generate final response
- Python model-api needs OpenAI-compatible tool calling support

**Frontend:**
- Show "AI is creating a task for you" notification during tool execution
- Display created task in chat as a card (not just text)
- Allow user to confirm/edit before task is saved (safety)

**Safety:**
- Confirm before creating tasks (preview card with accept/reject)
- Validate plant ownership
- Rate limiting on tool calls
- Duplicate task detection

---

## 4. Shopping Cart

### Current State
- **Single-item orders only** - no cart exists
- Flow: select product → detail → shipping → confirm → order
- `Order` model supports multiple `OrderItem` but `CreateOrderDto` only accepts single `productId`
- No `Cart` or `CartItem` models in schema
- Product catalog: `Product` + `ProductComponent` + `MarketplaceListing`
- `OrderController` has full checkout wizard (4 steps)

### What Needs to Change
**Database:**
- Add `Cart` model: `id`, `userId`, `createdAt`, `updatedAt`
- Add `CartItem` model: `id`, `cartId`, `productId`, `quantity`, `selectedComponentId?`, `createdAt`

**Backend:**
- `GET /api/cart` - get user's cart
- `POST /api/cart/items` - add item to cart
- `PATCH /api/cart/items/:id` - update quantity
- `DELETE /api/cart/items/:id` - remove item
- `POST /api/orders/from-cart` - create order from cart items
- Modify `CreateOrderDto` to support multiple products

**Frontend:**
- Zustand store for cart state (synced with server)
- Cart screen (new tab or modal)
- Cart icon in nav with item count badge
- Modified checkout flow for multi-item orders
- Guest-to-auth cart merge on login (localStorage → server)

**Edge Cases:**
- Price changes: use current price at checkout, show diff
- Out of stock: validate on checkout, warn user
- Quantity limits: per-product max
- Guest cart merge on login

---

## Architecture Overview

```
CITYFARM 2.0
├── apps/web (Next.js 15, React 19)
│   ├── app/(tabs)/          # Main tab navigation
│   │   ├── home/page.tsx
│   │   ├── community/page.tsx    ← InfiniteScroll target
│   │   ├── garden/page.tsx       ← Garden Assistant context
│   │   ├── marketplace/create/   ← Cart integration
│   │   ├── order/page.tsx        ← Multi-item checkout
│   │   └── account/
│   ├── app/(chat)/chatbot/       ← Chat history load
│   ├── app/api/chat/route.ts     ← Proxy to NestJS
│   └── components/
│       ├── cityfarm/features/
│       │   ├── CommunityScreen.tsx    ← InfiniteScroll UI
│       │   └── MarketplaceCreateScreen.tsx
│       └── chatbot/
│           └── ChatbotScreen.tsx      ← Tool calling UI
├── apps/api (NestJS)
│   ├── src/
│   │   ├── community/             ← Cursor pagination
│   │   ├── garden/                ← Task creation endpoint
│   │   ├── order/                 ← Multi-item order
│   │   ├── products/              ← Product catalog
│   │   ├── ai/model-api.service.ts ← Tool calling
│   │   └── app.service.ts         ← Chat RAG context
│   └── prisma/schema.prisma       ← Cart model addition
└── apps/model-api (Python)        ← OpenAI tool calling
```

## Priority Order

1. **Infinite Scroll** (Feed) - highest user impact, foundational
2. **Shopping Cart** - revenue-critical, clear scope
3. **Garden Assistant Chat Context** - improves AI experience
4. **Garden Assistant Tool Calling** - most complex, depends on chat context

## Files Created by Research Agents

- `/docs/plan/infinite-scroll-research-report.md` - Full implementation plan for infinite scroll
- `/docs/plan/garden-assistant-tool-calling-research.md` - Full 15-section tool calling report
- `/docs/plan/shopping-cart-research-report.md` - Full cart implementation plan
- `/docs/plan/facebook-infinite-scroll-research.md` - Facebook/Meta feed architecture patterns
