# Facebook News Feed Infinite Scroll Research Summary
## Technical Patterns for CITYFARM-2.0 Community Feed Implementation

---

## 1. Facebook's News Feed Technical Architecture

### Feed Ranking System
Facebook's News Feed uses a multi-stage ranking pipeline:

1. **Candidate Generation**: Retrieves ~1,000+ candidate posts per user from connections (friends, groups, pages)
2. **Feature Extraction**: Analyzes post attributes (who posted, type of content, engagement signals, embeddings from deep learning)
3. **Multi-Model Prediction**: Runs multiple ML models in parallel on separate "predictor" machines to predict:
   - Probability of engagement (like, comment, share)
   - Probability of meaningful interaction
   - Content quality scores
4. **Score Aggregation**: Combines predictions into single score via weighted function
5. **Final Ranking**: Orders posts by composite score with business rules applied

**Key Insight**: Facebook scores billions of posts in real-time using distributed predictor machines. For CITYFARM-2.0, simpler relevance signals (recency, engagement count, user affinity) are appropriate for MVP.

---

### Pagination Approach: Cursor-Based (Relay Specification)

Facebook developed the **Relay Cursor Connection Specification** which became the industry standard:

```graphql
type Connection {
  edges: [Edge]
  pageInfo: PageInfo
  totalCount: Int
}

type Edge {
  node: Node
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**Why Cursor-Based over Offset-Based**:
- Offset pagination has performance/security issues on large datasets
- New records added mid-scroll cause ambiguous offset calculations
- Cursor pagination is stable regardless of data changes
- Cursors should be opaque (base64 encoded) - format shouldn't be relied upon

---

## 2. Infinite Scroll Implementation Patterns

### TanStack Query Infinite Scroll Pattern

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  status,
} = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```

**Key Features**:
- `data.pages` - array of fetched page data
- `data.pageParams` - array of page params used
- `fetchNextPage()` / `fetchPreviousPage()` - imperative fetch functions
- `hasNextPage` - boolean from getNextPageParam return value
- `isFetchingNextPage` - distinguishes background refresh vs loading more

---

### Virtual Scrolling (DOM Recycling)

TanStack Virtual provides 60FPS rendering for massive lists by:
- Rendering only visible items + overscan buffer
- Recycling DOM nodes as user scrolls
- Maintaining scroll position accuracy with placeholder elements

**Benefits**:
- Handles thousands of items without performance degradation
- Memory-efficient - only keeps visible DOM nodes
- Works with infinite scroll + virtualization combined

---

## 3. Optimistic UI Updates (Likes/Comments)

### Apollo GraphQL Pattern

```typescript
mutate({
  variables: { commentId, content },
  optimisticResponse: {
    updateComment: {
      id: commentId,
      __typename: "Comment",
      content: content,
    },
  },
})
```

**Lifecycle**:
1. Store optimistic version separately (don't overwrite canonical cache)
2. Notify active queries - near-instantaneous UI update
3. Server responds with actual result
4. Remove optimistic version, update canonical cache
5. If mutation errors - rollback to previous state automatically

**Implementation Note**: Optimistic updates require `id` and `__typename` for cache identification.

---

## 4. Loading States: Skeleton Screens

### Nielsen Norman Group Research

**Benefits**:
- Prevents "site not working" perception during blank loading
- Creates illusion of shorter wait time through progressive reveal
- Reduces cognitive load - users build mental model before content arrives

**Types**:
1. **Static skeleton**: Gray boxes mimicking layout (most common)
2. **Animated skeleton**: Shimmer/pulse animation indicating activity
3. **Frame-display**: Structural outlines without content placeholders

**When to Use**: Full-page loads only. Progress bars for process-related tasks (uploads, downloads).

---

## 5. Psychology of Infinite Scroll

### When It Works (Engagement Pattern)
- **Time-killing activities**: Users want serendipitous discovery
- **Flat content hierarchy**: Each unit has similar interest probability
- **Lower interaction cost**: No "next page" click breaks engagement flow
- **Stream content**: Constantly updating feed (social media, news)

### When It Fails (Anti-Patterns)
- **Goal-oriented tasks**: Users need specific content/location
- **Footer accessibility**: Impossible to reach footer content
- **Item location memory**: "Item was on page 3" vs "somewhere in infinite scroll"
- **Scroll bar deception**: Breaks visual progress indicator
- **Sense of completion**: Users feel lost in "information abyss" without end
- **Lower conversions**: Browsing behavior without action

**Key Finding**: Infinite scroll supports browsing but causes inaction - opposite of conversion goals.

---

## 6. Error Recovery Patterns

### Infinite Query Error Handling

```typescript
status === 'error' ? (
  <p>Error: {error.message}</p>
) : (
  // render content
)
```

**Strategies**:
1. Display inline error message with retry button
2. Keep existing content visible while showing error
3. Retry button triggers `refetch()` or `fetchNextPage()`
4. Don't clear successfully loaded pages on error
5. Optimistic updates auto-rollback on mutation error

---

## 7. Prefetching Strategies

**Patterns**:
- Prefetch next page when user scrolls near threshold (e.g., 80% of current content)
- Use `queryClient.prefetchInfiniteQuery()` proactively
- Intersection Observer API to detect scroll proximity
- Background fetch without blocking UI

---

## 8. Anti-Patterns to Avoid

### Technical Anti-Patterns
- Using offset pagination for feeds (use cursors)
- Rendering all DOM nodes without virtualization for large feeds
- Not handling optimistic update rollback on errors
- Fetching on every scroll event (use Intersection Observer)
- Storing full feed in memory without pagination
- Blocking UI during fetch (always show existing content)

### UX Anti-Patterns
- Infinite scroll on goal-oriented pages (search results, e-commerce)
- No "Load More" button alternative for accessibility
- Hidden footers that users can't reach
- No end-of-feed indicator (users think it's broken)
- Skeleton screens for partial content loads (use inline loaders)
- Removing content on fetch error

---

## 9. CITYFARM-2.0 Implementation Recommendations

### Recommended Architecture

```
API Response Structure:
{
  data: [...posts],
  nextCursor: "base64-encoded-cursor",
  hasNextPage: boolean
}
```

### Cursor Implementation
- Use post ID + timestamp as cursor (base64 encoded)
- Example cursor: `{ id: "post_123", createdAt: "2024-01-15" }` -> base64
- Server decodes cursor to find starting point for next page

### Frontend Stack Recommendation
- **TanStack Query** (`useInfiniteQuery`) for data fetching
- **TanStack Virtual** for DOM virtualization if feed grows large
- **Intersection Observer** for scroll detection
- **Skeleton screens** for initial load
- **Inline spinners** for subsequent page loads

### Relevance Signals (Simplified MVP)
1. **Recency**: Post creation timestamp
2. **Engagement**: Like/comment count decayed by time
3. **User affinity**: Follow relationships, group membership
4. **Content type**: Mix different types in feed

### Optimistic Updates Implementation
```typescript
// Like mutation
onLike: (postId) => {
  likeMutation({
    variables: { postId },
    optimisticResponse: {
      likePost: {
        id: postId,
        __typename: "Post",
        likedByMe: true,
        likeCount: currentLikeCount + 1,
      }
    }
  })
}
```

### Error Recovery UX
- Show toast notification on fetch error
- Keep existing content visible
- "Retry" button inline with error message
- Auto-rollback optimistic updates on mutation failure

### Accessibility Considerations
- Provide "Load More" button as alternative to auto-scroll
- Show total count when available (e.g., "Showing 50 of 200 posts")
- Indicate end of feed clearly ("You've reached the end")
- Don't hide important footer content

---

## Sources

Indexed content available for deeper research via ctx_search:

1. **Facebook Engineering: Feed Architecture** - Ranking algorithm details
2. **Facebook GraphQL Cursor Pagination** - Relay specification
3. **Infinite Scroll UX Psychology** - Nielsen Norman Group
4. **TanStack Virtual Documentation** - Virtual scrolling implementation
5. **Optimistic UI Updates Best Practices** - Apollo GraphQL patterns
6. **Skeleton Screen UX Patterns** - Loading state research
7. **TanStack Query Infinite Scroll** - Infinite query implementation

---

## Key Takeaways

1. **Use cursor pagination** - offset pagination fails on dynamic feeds
2. **Virtual scroll for performance** - DOM recycling prevents memory issues
3. **Optimistic updates for interactions** - instant feedback for likes/comments
4. **Skeleton screens for initial load** - reduces perceived wait time
5. **Infinite scroll for browsing** - pagination for goal-oriented tasks
6. **Error recovery matters** - don't lose content on fetch failures
7. **Accessibility alternatives** - "Load More" button alongside auto-scroll

---

*Research compiled from Meta Engineering Blog, GraphQL.org, Nielsen Norman Group, TanStack documentation, and Apollo GraphQL docs.*