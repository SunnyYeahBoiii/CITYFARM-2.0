import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { FeedPost, PostType } from "./types/community";

interface FeedPostsCursorResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface InfiniteFeedParams {
  postType?: PostType | "all";
  district?: string;
  limit?: number;
}

async function fetchFeedCursor({
  cursor,
  postType,
  district,
  limit = 20,
}: {
  cursor?: string;
  postType?: PostType;
  district?: string;
  limit?: number;
}): Promise<FeedPostsCursorResponse> {
  const params: Record<string, string | number> = { limit };

  if (cursor) {
    params.cursor = cursor;
  }
  if (postType) {
    params.postType = postType;
  }
  if (district) {
    params.district = district;
  }

  const { data } = await api.get<FeedPostsCursorResponse>("/community/feed/cursor", { params });
  return data;
}

export function useInfiniteFeed(params: InfiniteFeedParams = {}) {
  const { postType, district, limit = 20 } = params;

  // Convert "all" to undefined for API
  const apiPostType = postType === "all" ? undefined : postType;

  return useInfiniteQuery({
    queryKey: ["feed", "infinite", apiPostType, district],
    queryFn: ({ pageParam }) => fetchFeedCursor({
      cursor: pageParam,
      postType: apiPostType,
      district,
      limit,
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post<{ isLiked?: boolean; liked?: boolean }>(
        `/community/feed/${postId}/reactions`,
        { reactionType: "LIKE" }
      );
      return data.isLiked ?? data.liked ?? false;
    },
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed", "infinite"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["feed", "infinite"]);

      // Optimistically update the reaction
      queryClient.setQueryData(["feed", "infinite"], (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPostsCursorResponse) => ({
            ...page,
            posts: page.posts.map((post: FeedPost) => {
              if (post.id === postId) {
                const wasLiked = Boolean(post.isLiked);
                const newLikes = wasLiked
                  ? Math.max(post.likes - 1, 0)
                  : post.likes + 1;
                return {
                  ...post,
                  isLiked: !wasLiked,
                  likes: newLikes,
                };
              }
              return post;
            }),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["feed", "infinite"], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ["feed", "infinite"] });
    },
  });
}