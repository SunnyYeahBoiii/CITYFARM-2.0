import { UserMinimalDto } from '../feed/feed-post.dto';

export class MarketplaceListingDto {
  id: string;
  sellerId: string;
  gardenPlantId: string;
  product: string;
  quantity: string;
  priceAmount: number;
  description?: string;
  imageAssetId?: string;
  imageUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  seller: UserMinimalDto;
}

export class MarketplaceListingsPaginatedDto {
  data: MarketplaceListingDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
