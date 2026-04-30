# Implementation Plan: Feed Infinite Scroll

## Overview
Replace offset pagination with cursor-based infinite scroll in Community Feed.
Full production: cursor backend, IntersectionObserver frontend, optimistic updates, error recovery, skeleton screens.

## Step 1: Backend Cursor Pagination

### 1.1 Modify `apps/api/src/community/community.service.ts`

Add cursor-based pagination method alongside existing offset method:

```typescript
// New method
async getFeedCursor({
  userId,
  cursor,       // "{createdAt}_{id}" compound cursor
  limit = 20,
}: { userId: string; cursor?: string; limit?: number }) {
  const parsedCursor = cursor ? {
    createdAt: new Date(cursor.split('_')[0]),
    id: cursor.split('_')[1],
  } : undefined;

  const posts = await this.prisma.feedPost.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true } },
      media: { select: { id: true, url: true, type: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    ...(parsedCursor
      ? {
          cursor: { createdAt: parsedCursor.createdAt, id: parsedCursor.id },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // fetch one extra to determine hasMore
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore
    ? `${items[items.length - 1].createdAt.toISOString()}_${items[items.length - 1].id}`
    : null;

  return { posts: items, nextCursor, hasMore };
}
```

### 1.2 Modify `apps/api/src/community/community.controller.ts`

Add new endpoint or modify existing one:

```typescript
@Get('feed/cursor')
@UseGuards(JwtAuthGuard)
async getFeedCursor(
  @CurrentUser() user: { id: string },
  @Query('cursor') cursor?: string,
  @Query('limit') limit?: string,
) {
  return this.communityService.getFeedCursor({
    userId: user.id,
    cursor,
    limit: limit ? parseInt(limit, 10) : 20,
  });
}
```

### 1.3 Update DTOs

No new DTO needed. Query params handle it.

### 1.4 Ensure Composite Index

Verify in `prisma/schema.prisma`:
```prisma
@@index([createdAt, id])
```
If not present, add migration.

---

## Step 2: Frontend Infinite Query Hook

### 2.1 Create `apps/web/lib/useInfiniteFeed.ts`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

interface FeedPost { /* existing type */ }

interface FeedCursorResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

async function fetchFeed({ pageParam }: { pageParam: string | undefined }): Promise<FeedCursorResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);
  params.set('limit', '20');

  const res = await apiFetch(`/api/community/feed/cursor?${params}`);
  return res.json();
}

export function useInfiniteFeed() {
  return useInfiniteQuery<FeedCursorResponse>({
    queryKey: ['feed', 'infinite'],
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}
```

---

## Step 3: CommunityScreen Infinite Scroll UI

### 3.1 Modify `apps/web/components/cityfarm/features/CommunityScreen.tsx`

Replace existing pagination with infinite scroll:

- Import `useInfiniteFeed`
- Flatten pages: `posts = data?.pages.flatMap(p => p.posts) ?? []`
- Add `IntersectionObserver` sentinel:
  ```typescript
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteFeed();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const sentinel = document.getElementById('feed-sentinel');
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  ```
- Loading states: skeleton screens for initial load, inline spinner at bottom for next page
- Error state: "Failed to load feed" with retry button (preserves existing content)

### 3.2 Skeleton Component

Add inline skeleton:
```typescript
function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border-b">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-full" />
    </div>
  );
}
```

---

## Step 4: Optimistic Updates for Reactions

### 4.1 Create mutation for reactions

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useOptimisticReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: string }) =>
      apiFetch(`/api/community/posts/${postId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    onMutate: async ({ postId, type }) => {
      await queryClient.cancelQueries({ queryKey: ['feed', 'infinite'] });
      const previous = queryClient.getQueriesData({ queryKey: ['feed', 'infinite'] });

      // Optimistically update reaction counts
      queryClient.setQueriesData(
        { queryKey: ['feed', 'infinite'] },
        (old: InfiniteData<FeedCursorResponse> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              posts: page.posts.map(post =>
                post.id === postId
                  ? { ...post, _count: { ...post._count, reactions: post._count.reactions + 1 } }
                  : post
              ),
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueriesData({ queryKey: ['feed', 'infinite'] }, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'infinite'] });
    },
  });
}
```

---

## Step 5: Error Recovery

- Fetch errors: keep existing posts visible, show toast "Failed to load more posts" with retry button
- Mutation errors: optimistic rollback via `onError` callback
- Network offline: detect via `navigator.onLine`, show banner, queue mutations

---

## Step 6: Performance Optimization

- Add `react-virtual` (TanStack Virtual) if post count exceeds 100
- Prefetch next page on scroll threshold (already via IntersectionObserver `rootMargin: '200px'`)
- Memoize post components with `React.memo`

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/community/community.service.ts` | Add `getFeedCursor` method |
| `apps/api/src/community/community.controller.ts` | Add `GET feed/cursor` endpoint |
| `apps/api/prisma/schema.prisma` | Add composite index `[createdAt, id]` if missing |
| `apps/web/lib/useInfiniteFeed.ts` | New: infinite query hook |
| `apps/web/components/cityfarm/features/CommunityScreen.tsx` | Replace pagination with infinite scroll |
| `apps/web/components/cityfarm/features/CommunityScreen.tsx` | Add optimistic reaction mutation |

---

## Testing Checklist

- [ ] Cursor pagination returns correct results (no duplicates, no gaps)
- [ ] IntersectionObserver triggers fetch at scroll threshold
- [ ] Skeleton shown on initial load
- [ ] Inline spinner shown on subsequent page loads
- [ ] Error shows retry without clearing existing posts
- [ ] Reaction count updates optimistically, rolls back on error
- [ ] Works with rapid scrolling (no double-fetch)
- [ ] Works with empty feed (shows empty state)
