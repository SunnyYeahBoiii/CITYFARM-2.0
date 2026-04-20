import { api } from "../client";
import type { 
  FeedPost, 
  MarketListing, 
  CreateFeedPostPayload, 
  CommunityDataResponse,
  FeedComment 
} from "../types/community";

export async function loadCommunityData(): Promise<CommunityDataResponse> {
  const [postsResult, listingsResult] = await Promise.allSettled([
    getFeed({ page: 1, limit: 20 }),
    getMarketplace({ page: 1, limit: 20 }),
  ]);

  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const listings = listingsResult.status === "fulfilled" ? listingsResult.value : [];

  return { 
    posts, 
    listings
  };
}

export async function createPost(payload: CreateFeedPostPayload): Promise<FeedPost> {
  const { data } = await api.post<FeedPost>("/community/feed", payload);
  return data;
}

export async function toggleReaction(postId: string): Promise<boolean> {
  const { data } = await api.post<{ isLiked?: boolean; liked?: boolean }>(
    `/community/feed/${postId}/reactions`,
    { reactionType: "LIKE" }
  );
  
  return data.isLiked ?? data.liked ?? false;
}

export async function getFeed(params?: { 
  postType?: string; 
  district?: string; 
  page?: number; 
  limit?: number; 
}): Promise<FeedPost[]> {
  const { data } = await api.get<{ data?: FeedPost[] } | FeedPost[]>("/community/feed", { params });
  return Array.isArray(data) ? data : data.data ?? [];
}


export async function getMarketplace(params?: {
  district?: string;
  page?: number;
  limit?: number;
}): Promise<MarketListing[]> {
  const { data } = await api.get<{ data?: MarketListing[] } | MarketListing[]>("/community/marketplace", { params });
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function createMarketplaceListing(payload: any): Promise<MarketListing> {
  const { data } = await api.post<MarketListing>("/community/marketplace", payload);
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/community/feed/${postId}`);
}

export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const { data } = await api.get<{ data: FeedComment[] } | FeedComment[]>(`/community/feed/${postId}/comments`);
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function createComment(
  postId: string, 
  body: string, 
  parentCommentId?: string
): Promise<FeedComment> {
  const { data } = await api.post<FeedComment>(`/community/feed/${postId}/comments`, {
    body,
    parentCommentId
  });
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/community/comments/${commentId}`);
}
export async function deleteMarketplaceListing(listingId: string): Promise<void> {
  await api.delete(`/community/marketplace/${listingId}`);
}
export async function updateMarketplaceListing(listingId: string, payload: any): Promise<MarketListing> {
  const { data } = await api.patch<MarketListing>(`/community/marketplace/${listingId}`, payload);
  return data;
}
