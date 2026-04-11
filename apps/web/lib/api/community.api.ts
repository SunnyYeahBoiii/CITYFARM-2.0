import { api } from "../client";
import type { 
  FeedPost, 
  MarketListing, 
  CreateFeedPostPayload, 
  CommunityDataResponse 
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
