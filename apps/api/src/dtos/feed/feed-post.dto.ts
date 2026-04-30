import { PostType } from 'generated/prisma/enums';

export class UserMinimalDto {
  id: string;
  username: string;
  profileImage?: string;
  district?: string;
  verifiedGrower?: boolean;
}

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
  user: UserMinimalDto;
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

export class FeedPostsCursorDto {
  posts: FeedPostDto[];
  nextCursor: string | null;
  hasMore: boolean;
}
