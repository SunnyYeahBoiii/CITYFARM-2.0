# Feed & Post Feature Research Report: InfiniteScroll Implementation

**Generated:** 2026-04-28
**Project:** CITYFARM-2.0 (Next.js Web + NestJS API)

---

## Executive Summary

The CITYFARM-2.0 community feed feature uses **offset-based pagination** (page/limit). For a Facebook/Meta-style social feed, this is suboptimal. **Cursor-based pagination** is recommended for infinite scroll because it handles real-time data changes gracefully and provides stable, predictable results.

---

## Current Implementation Analysis

### 1. Frontend - Community Page

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/web/app/(tabs)/community/page.tsx`

- Server component that calls `getCommunityData()` from `community-server.ts`
- Passes `initialPosts` and `initialListings` to `CommunityScreen` component
- No pagination parameters passed - fetches all data server-side

### 2. Frontend - CommunityScreen Component

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/web/components/cityfarm/features/CommunityScreen.tsx`

```typescript
type CommunityScreenProps = {
  initialPosts?: FeedPost[];
  initialListings?: MarketListing[];
};
```

**Current behavior:**
- Receives pre-loaded posts from server component
- Uses local state for filtering (`feedFilter`: "all", SHOWCASE, QUESTION)
- Renders posts via `filteredPosts.map()` - simple array iteration
- No infinite scroll, no loading more posts on scroll
- Loading state only for initial load (`isCommunityLoading`)
- Comments use a sheet/modal with separate loading state

**Missing capabilities:**
- No scroll position detection
- No IntersectionObserver for triggering load
- No append/concat logic for new posts
- No cursor/page tracking for subsequent fetches

### 3. Frontend - Community Server Lib

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/web/lib/community-server.ts`

```typescript
export async function getCommunityData(): Promise<CommunityDataResponse> {
  const [posts, listings] = await Promise.all([
    serverGet<FeedPost>("/community/feed"),  // No pagination params
    serverGet<MarketListing>("/community/marketplace"),
  ]);
  return { posts, listings };
}
```

- Calls `/community/feed` without any pagination parameters
- Returns full array, normalizes response format
- Only used for SSR initial load

### 4. Backend - Community Controller

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/community/community.controller.ts`

```typescript
@Get('feed')
async getFeedPosts(
  @Req() req: any,
  @Query('postType') postType?: PostType,
  @Query('district') district?: string,
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  // ...
}
```

**Endpoint signature:**
- `GET /community/feed`
- Query params: `postType`, `district`, `page`, `limit`
- Defaults: page=1, limit=10
- Auth: Optional (extracts userId from cookies for like status)

### 5. Backend - Community Service

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/community/community.service.ts`

```typescript
async getFeedPosts(
  userId: string,
  postType?: PostType,
  district?: string,
  page: number = 1,
  limit: number = 10,
): Promise<FeedPostsPaginatedDto> {
  const skip = (page - 1) * limit;  // Offset-based pagination
  
  const where: any = { isPublished: true };
  if (postType) where.postType = postType;
  if (district) where.visibilityDistrict = district;

  const [posts, total] = await Promise.all([
    this.prisma.feedPost.findMany({
      where,
      include: { /* ... complex user/profile/image relations ... */ },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    this.prisma.feedPost.count({ where }),
  ]);

  return {
    data: posts.map((post) => this.mapFeedPostToDto(post, userId)),
    total,
    page,
    limit,
    hasMore: skip + limit < total,
  };
}
```

**Pagination approach:**
- Offset-based: `skip = (page - 1) * limit`
- Returns: `{ data, total, page, limit, hasMore }`
- Order: `createdAt: 'desc'` (newest first)

### 6. DTOs

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/dtos/feed/feed-post.dto.ts`

```typescript
export class FeedPostDto {
  id: string;
  postType: PostType;
  caption: string;
  gardenPlantId?: string;
  listingId?: string;
  contentJson?: object;
  imageAssetId?: string;
  imageUrl?: string;
  visibilityDistrict?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: UserMinimalDto;  // id, username, profileImage, district, verifiedGrower
  likes: number;
  comments: number;
  gardenPlant?: any;
  isLiked?: boolean;
}

export class FeedPostsPaginatedDto {
  data: FeedPostDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### 7. Prisma Models

**File:** `/Users/sunny/workspace/CITYFARM-2.0/apps/api/prisma/schema.prisma`

```prisma
model FeedPost {
  id                 String              @id @default(uuid())
  userId             String
  gardenPlantId      String?
  listingId          String?
  postType           PostType
  caption            String
  contentJson        Json?
  imageAssetId       String?
  visibilityDistrict String?
  isPublished        Boolean             @default(true)
  publishedAt        DateTime?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  // relations...
  
  @@index([userId, createdAt])
  @@index([visibilityDistrict, createdAt])
}

model FeedComment {
  id              String        @id @default(uuid())
  postId          String
  userId          String
  parentCommentId String?
  body            String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  // relations...
  
  @@index([postId, createdAt])
}
```

**Key indexes:**
- `[userId, createdAt]` - for user's posts timeline
- `[visibilityDistrict, createdAt]` - for district-filtered feed
- Both support efficient cursor-based queries

---

## Problem: Offset Pagination vs Social Feeds

### Why Offset Pagination is Bad for Infinite Scroll

1. **Unstable results when data changes**
   - New posts appear while scrolling causes items to shift
   - User sees duplicates or misses posts (the "shifting window" problem)

2. **Performance degrades with deep pagination**
   - `skip = 10000` requires scanning 10000 rows
   - Large OFFSET values are slow in PostgreSQL

3. **Race conditions**
   - If 5 new posts are created between page 1 and page 2, page 2 shows 5 posts from page 1

### Facebook/Meta Best Practices

- **Cursor-based pagination** using stable, unique, sortable field
- Cursor = opaque token encoding position (usually timestamp + id)
- Each page returns `nextCursor` for subsequent fetch
- Prefetch next page before user reaches bottom
- Optimistic updates for new content
- Append-only mental model for feed

---

## Required Changes

### Backend Changes

#### 1. Add Cursor Support to DTOs

```typescript
// feed-post.dto.ts
export class FeedPostsCursorDto {
  data: FeedPostDto[];
  nextCursor?: string;  // Base64 encoded cursor or null if end
  hasMore: boolean;
}
```

#### 2. Update Controller Endpoint

```typescript
@Get('feed')
async getFeedPosts(
  @Req() req: any,
  @Query('postType') postType?: PostType,
  @Query('district') district?: string,
  @Query('cursor') cursor?: string,  // NEW: cursor parameter
  @Query('limit') limit: string = '10',
) {
  // Remove page parameter, use cursor instead
}
```

#### 3. Update Service Method

```typescript
async getFeedPostsCursor(
  userId: string,
  postType?: PostType,
  district?: string,
  cursor?: string,
  limit: number = 10,
): Promise<FeedPostsCursorDto> {
  const where: any = { isPublished: true };
  if (postType) where.postType = postType;
  if (district) where.visibilityDistrict = district;

  // Decode cursor to get position
  if (cursor) {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    where.createdAt = { lt: decoded.createdAt };  // For descending order
    where.id = { not: decoded.id };  // Tiebreaker for same timestamp
  }

  const posts = await this.prisma.feedPost.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,  // Take one extra to determine hasMore
    include: { /* ... same relations ... */ },
  });

  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, limit) : posts;
  
  const nextCursor = hasMore 
    ? Buffer.from(JSON.stringify({
        createdAt: data[data.length - 1].createdAt,
        id: data[data.length - 1].id,
      })).toString('base64')
    : undefined;

  return {
    data: data.map(post => this.mapFeedPostToDto(post, userId)),
    nextCursor,
    hasMore,
  };
}
```

#### 4. Key Prisma Query Pattern

```typescript
// Cursor-based query pattern
orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
take: limit + 1,

// Cursor filter (instead of skip)
where: {
  createdAt: { lt: cursorTimestamp },
  // OR use Prisma's cursor syntax:
  // cursor: { id: cursorId },
  // skip: 1,  // Skip the cursor item itself
}
```

### Frontend Changes

#### 1. Create InfiniteScroll Hook

```typescript
// hooks/useInfiniteFeed.ts
export function useInfiniteFeed(initialPosts: FeedPost[], initialCursor?: string) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (!cursor || isLoading || !hasMore) return;
    
    setIsLoading(true);
    const response = await fetch(`/api/community/feed?cursor=${cursor}&limit=10`);
    const data = await response.json();
    
    setPosts(prev => [...prev, ...data.data]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
    setIsLoading(false);
  };

  return { posts, loadMore, isLoading, hasMore };
}
```

#### 2. Add IntersectionObserver Sentinel

```typescript
// CommunityScreen.tsx
const observerRef = useRef<IntersectionObserver>();
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    { threshold: 0.1 }
  );
  
  if (sentinelRef.current) {
    observerRef.current.observe(sentinelRef.current);
  }
  
  return () => observerRef.current?.disconnect();
}, [hasMore, isLoading, loadMore]);
```

#### 3. Update Render Pattern

```typescript
<div className={styles.postFeed}>
  {posts.map((post) => (
    <PostCard key={post.id} post={post} />
  ))}
  
  {/* Loading sentinel */}
  <div ref={sentinelRef} className={styles.loadSentinel}>
    {isLoading && <div className={styles.loadingSpinner}>Loading more...</div>}
  </div>
  
  {!hasMore && posts.length > 0 && (
    <div className={styles.endMessage}>No more posts</div>
  )}
</div>
```

#### 4. Update Server Component for Initial Load

```typescript
// page.tsx - pass cursor from initial fetch
const initialData = await getCommunityDataWithCursor();
// initialData = { posts: [...], nextCursor: "...", hasMore: true }
```

#### 5. Client-Side API Route (Optional)

Create `/api/community/feed/route.ts` for client-side fetches that proxies to NestJS API with proper auth.

---

## Implementation Plan Phases

### Phase 1: Backend Cursor Support
1. Create new `FeedPostsCursorDto` class
2. Add cursor parameter to controller
3. Implement cursor-based Prisma query in service
4. Keep old endpoint for backward compatibility (optional)

### Phase 2: Frontend Hook
1. Create `useInfiniteFeed` hook
2. Handle state: posts array, cursor, loading, hasMore
3. Implement `loadMore` function with fetch

### Phase 3: IntersectionObserver Integration
1. Add sentinel element at bottom of feed
2. Connect IntersectionObserver to trigger loadMore
3. Handle cleanup and edge cases

### Phase 4: Optimizations
1. Prefetch next page at 80% scroll position
2. Debounce intersection events
3. Add optimistic UI updates for new posts
4. Implement pull-to-refresh for mobile

---

## Best Practices Summary

### Facebook/Meta Infinite Scroll Patterns

1. **Cursor Pagination**
   - Use stable cursor (timestamp + id)
   - Return `nextCursor` in response
   - Never use offset/skip for large datasets

2. **Prefetching**
   - Start loading next page before user reaches bottom
   - Use 200-300px threshold from bottom
   - Cache prefetched results

3. **Optimistic Updates**
   - Insert new posts at top immediately
   - Sync with server on next fetch
   - Handle conflicts gracefully

4. **Loading States**
   - Show skeleton/spinner while loading
   - Disable scroll-to-load during fetch
   - Smooth transitions between states

5. **Error Handling**
   - Retry failed fetches
   - Show error message with retry button
   - Preserve loaded content on error

6. **Mobile Considerations**
   - Pull-to-refresh gesture
   - Touch event handling
   - Battery-efficient observers

---

## File Reference Summary

| Component | Path |
|-----------|------|
| Community Page | `/Users/sunny/workspace/CITYFARM-2.0/apps/web/app/(tabs)/community/page.tsx` |
| CommunityScreen | `/Users/sunny/workspace/CITYFARM-2.0/apps/web/components/cityfarm/features/CommunityScreen.tsx` |
| Community Server Lib | `/Users/sunny/workspace/CITYFARM-2.0/apps/web/lib/community-server.ts` |
| Community Controller | `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/community/community.controller.ts` |
| Community Service | `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/community/community.service.ts` |
| Feed DTOs | `/Users/sunny/workspace/CITYFARM-2.0/apps/api/src/dtos/feed/*.dto.ts` |
| Prisma Schema | `/Users/sunny/workspace/CITYFARM-2.0/apps/api/prisma/schema.prisma` |

---

## Conclusion

The current implementation uses basic offset pagination that works for small datasets but will cause UX issues (duplicate posts, shifting content) for a real-time social feed. Cursor-based pagination is the industry standard for infinite scroll and should be implemented across both backend (NestJS) and frontend (Next.js). The Prisma indexes `[createdAt]` are already set up correctly to support efficient cursor queries.