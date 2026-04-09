import type { FeedPost } from "./cityfarm-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch {
      // ignore
    }
    console.error(`API request failed with status ${res.status}: ${errorBody}`);
    throw new Error(
      `API request failed with status ${res.status}: ${errorBody}`,
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Backend response types (mirrors the Prisma / NestJS shape)
// ---------------------------------------------------------------------------

/** Prisma PostType enum values as returned by the API */
type ApiPostType =
  | "SHOWCASE"
  | "QUESTION"
  | "PLANT_SHARE"
  | "MARKETPLACE_SHARE"
  | "HARVEST_UPDATE";

interface ApiUserProfile {
  displayName: string;
  avatarAssetId?: string | null;
  district?: string | null;
}

interface ApiUser {
  id: string;
  email: string;
  profile?: ApiUserProfile | null;
}

interface ApiImageAsset {
  id: string;
  publicUrl: string;
}

interface ApiGardenPlant {
  id: string;
  plantSpeciesId?: string;
}

interface ApiPostCount {
  comments: number;
  reactions: number;
}

export interface ApiFeedPost {
  id: string;
  userId: string;
  postType: ApiPostType;
  caption: string;
  contentJson?: Record<string, unknown> | null;
  imageAssetId?: string | null;
  gardenPlantId?: string | null;
  visibilityDistrict?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: ApiUser;
  imageAsset?: ApiImageAsset | null;
  gardenPlant?: ApiGardenPlant | null;
  _count: ApiPostCount;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/** Map backend PostType enum to the frontend union type */
function mapPostType(
  apiType: ApiPostType,
): FeedPost["type"] {
  switch (apiType) {
    case "SHOWCASE":
      return "showcase";
    case "QUESTION":
      return "question";
    case "PLANT_SHARE":
      return "plant-share";
    case "MARKETPLACE_SHARE":
      return "showcase";
    case "HARVEST_UPDATE":
      return "showcase";
    default:
      return "showcase";
  }
}

/** Format an ISO date string as a relative-time label (e.g. "2h ago") */
function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/** Convert an API post to the FeedPost shape used by the frontend */
export function mapApiFeedPost(post: ApiFeedPost): FeedPost {
  const emailLocalPart = post.user.email.split("@")[0];
  const userName =
    post.user.profile?.displayName ??
    (emailLocalPart && emailLocalPart.length > 0 ? emailLocalPart : "User");
  const location = post.user.profile?.district ?? post.visibilityDistrict ?? "";
  const image = post.imageAsset?.publicUrl ?? undefined;
  const sharedPlantId = post.gardenPlantId ?? undefined;

  // Extract hashtags from contentJson if present, otherwise empty
  let tags: string[] = [];
  if (
    post.contentJson &&
    typeof post.contentJson === "object" &&
    Array.isArray((post.contentJson as { tags?: unknown }).tags)
  ) {
    tags = (post.contentJson as { tags: string[] }).tags;
  }

  return {
    id: post.id,
    type: mapPostType(post.postType),
    user: userName,
    location,
    caption: post.caption,
    image,
    sharedPlantId,
    likes: post._count.reactions,
    comments: post._count.comments,
    time: relativeTime(post.createdAt),
    tags,
    isLiked: false,
  };
}

// ---------------------------------------------------------------------------
// Feed API calls
// ---------------------------------------------------------------------------

export interface FeedPostsFilter {
  /** Maps to PostType enum on the backend – omit to fetch all types */
  postType?: "SHOWCASE" | "QUESTION" | "PLANT_SHARE";
  limit?: number;
  cursor?: string;
}

/**
 * Fetch feed posts from the NestJS backend and return them mapped to the
 * frontend FeedPost shape.
 */
export async function getFeedPosts(
  filter: FeedPostsFilter = {},
): Promise<FeedPost[]> {
  const params = new URLSearchParams();
  if (filter.postType) params.set("postType", filter.postType);
  if (filter.limit) params.set("limit", String(filter.limit));
  if (filter.cursor) params.set("cursor", filter.cursor);

  const query = params.toString() ? `?${params.toString()}` : "";
  const raw = await apiRequest<ApiFeedPost[]>(`/feed/posts${query}`);
  return raw.map(mapApiFeedPost);
}
