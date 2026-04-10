export enum PostType {
  SHOWCASE = "SHOWCASE",
  QUESTION = "QUESTION",
  PLANT_SHARE = "PLANT_SHARE",
}

export interface UserMinimal {
  id: string;
  username: string;
  profileImage?: string;
  district?: string;
  verifiedGrower?: boolean;
}

export interface FeedPost {
  id: string;
  postType: PostType;
  caption: string;
  gardenPlantId?: string;
  listingId?: string;
  contentJson?: object;
  imageAssetId?: string;
  visibilityDistrict?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: UserMinimal;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export interface FeedComment {
  id: string;
  postId: string;
  parentCommentId?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: UserMinimal;
  replies?: FeedComment[];
}

export interface MarketListing {
  id: string;
  sellerId: string;
  gardenPlantId: string;
  product: string;
  quantity: string;
  priceAmount: number;
  description?: string;
  imageAssetId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  seller: UserMinimal;
}

export interface CreateFeedPostPayload {
  postType: PostType;
  caption: string;
  gardenPlantId?: string;
  imageAssetId?: string;
  visibilityDistrict?: string;
}

export interface CommunityDataResponse {
  posts: FeedPost[];
  listings: MarketListing[];
}
