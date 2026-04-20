import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedPostDto, PostType } from '../dtos/feed/create-feed-post.dto';
import { FeedPostDto, UserMinimalDto, FeedPostsPaginatedDto } from '../dtos/feed/feed-post.dto';
import { CreateFeedCommentDto, FeedCommentDto, FeedCommentsDto } from '../dtos/feed/feed-comment.dto';
import { CreatePostReactionDto } from '../dtos/feed/post-reaction.dto';
import { CreateMarketplaceListingDto } from '../dtos/marketplace/create-marketplace-listing.dto';
import { MarketplaceListingDto, MarketplaceListingsPaginatedDto } from '../dtos/marketplace/marketplace-listing.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ============ FEED POSTS ============

  async getFeedPosts(
    userId: string,
    postType?: PostType,
    district?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<FeedPostsPaginatedDto> {
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (postType) {
      where.postType = postType;
    }

    if (district) {
      where.visibilityDistrict = district;
    }

    const [posts, total] = await Promise.all([
      this.prisma.feedPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  district: true,
                  growerVerificationStatus: true,
                  avatarAsset: {
                    select: {
                      publicUrl: true,
                    },
                  },
                },
              },
            },
          },
          reactions: {
            where: { userId },
          },
          comments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.feedPost.count({ where }),
    ]);

    const data = posts.map((post) => this.mapFeedPostToDto(post, userId));

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async createFeedPost(userId: string, dto: CreateFeedPostDto): Promise<FeedPostDto> {
    const post = await this.prisma.feedPost.create({
      data: {
        userId,
        postType: dto.postType,
        caption: dto.caption,
        gardenPlantId: dto.gardenPlantId,
        contentJson: dto.contentJson,
        imageAssetId: dto.imageAssetId,
        visibilityDistrict: dto.visibilityDistrict,
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
                avatarAsset: {
                  select: {
                    publicUrl: true,
                  },
                },
              },
            },
          },
        },
        reactions: true,
        comments: true,
      },
    });

    return this.mapFeedPostToDto(post, userId);
  }

  async getFeedPostById(postId: string, userId: string): Promise<FeedPostDto> {
    const post = await this.prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
                avatarAsset: {
                  select: {
                    publicUrl: true,
                  },
                },
              },
            },
          },
        },
        reactions: {
          where: { userId },
        },
        comments: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapFeedPostToDto(post, userId);
  }

  async deleteFeedPost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.feedPost.delete({
      where: { id: postId },
    });
  }

  // ============ COMMENTS ============

  async getPostComments(postId: string, page: number = 1, limit: number = 20): Promise<FeedCommentsDto> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.feedComment.findMany({
        where: {
          postId,
          parentCommentId: null, // Only root comments
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  district: true,
                  avatarAsset: {
                    select: {
                      publicUrl: true,
                    },
                  },
                },
              },
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      district: true,
                      avatarAsset: {
                        select: {
                          publicUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.feedComment.count({
        where: {
          postId,
          parentCommentId: null,
        },
      }),
    ]);

    const data = comments.map((comment) => this.mapCommentToDto(comment));

    return {
      data,
      total,
      hasMore: skip + limit < total,
    };
  }

  async createComment(postId: string, userId: string, dto: CreateFeedCommentDto): Promise<FeedCommentDto> {
    // Verify post exists
    const post = await this.prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.feedComment.create({
      data: {
        postId,
        userId,
        parentCommentId: dto.parentCommentId,
        body: dto.body,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                avatarAsset: {
                  select: {
                    publicUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.mapCommentToDto(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.feedComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.feedComment.delete({
      where: { id: commentId },
    });
  }

  // ============ REACTIONS (LIKES) ============

  async togglePostReaction(
    postId: string,
    userId: string,
    dto: CreatePostReactionDto,
  ): Promise<boolean> {
    // Verify post exists
    const post = await this.prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingReaction = await this.prisma.postReaction.findFirst({
      where: {
        postId,
        userId,
        reactionType: dto.reactionType,
      },
    });

    if (existingReaction) {
      // Unlike
      await this.prisma.postReaction.delete({
        where: { id: existingReaction.id },
      });
      return false; // Unliked
    } else {
      // Like
      await this.prisma.postReaction.create({
        data: {
          postId,
          userId,
          reactionType: dto.reactionType,
        },
      });
      return true; // Liked
    }
  }

  // ============ MARKETPLACE ============

  async getMarketplaceListings(
    district?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<MarketplaceListingsPaginatedDto> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (district) {
      where.seller = {
        profile: {
          is: {
            district,
          },
        },
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  district: true,
                  growerVerificationStatus: true,
                  avatarAsset: {
                    select: {
                      publicUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    const data = listings.map((listing) => this.mapListingToDto(listing));

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async createMarketplaceListing(
    userId: string,
    dto: CreateMarketplaceListingDto,
  ): Promise<MarketplaceListingDto> {
    // Verify garden plant exists and belongs to user
    const gardenPlant = await this.prisma.gardenPlant.findUnique({
      where: { id: dto.gardenPlantId },
    });

    if (!gardenPlant) {
      throw new NotFoundException('Garden plant not found');
    }

    if (gardenPlant.userId !== userId) {
      throw new ForbiddenException('You can only list your own plants');
    }

    const sellerProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        district: true,
        ward: true,
      },
    });

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        sellerId: userId,
        gardenPlantId: dto.gardenPlantId,
        title: dto.product,
        quantity: dto.quantity,
        unit: dto.unit ?? 'unit',
        priceAmount: dto.priceAmount,
        pickupDistrict: dto.pickupDistrict ?? sellerProfile?.district ?? 'Unknown',
        pickupWard: dto.pickupWard ?? sellerProfile?.ward ?? null,
        description: dto.description,
        imageAssetId: dto.imageAssetId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
                avatarAsset: {
                  select: {
                    publicUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.mapListingToDto(listing);
  }

  async deleteMarketplaceListing(listingId: string, userId: string): Promise<void> {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.marketplaceListing.delete({
      where: { id: listingId },
    });
  }

  // ============ HELPERS ============

  private mapFeedPostToDto(post: any, currentUserId: string): FeedPostDto {
    return {
      id: post.id,
      postType: post.postType,
      caption: post.caption,
      gardenPlantId: post.gardenPlantId,
      listingId: post.listingId,
      contentJson: post.contentJson,
      imageAssetId: post.imageAssetId,
      visibilityDistrict: post.visibilityDistrict,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: this.mapUserToMinimalDto(post.user),
      likes: post.reactions?.length || 0,
      comments: post.comments?.length || 0,
      isLiked: post.reactions?.some((r) => r.userId === currentUserId) || false,
    };
  }

  private mapCommentToDto(comment: any): FeedCommentDto {
    return {
      id: comment.id,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: this.mapUserToMinimalDto(comment.user),
      replies: comment.replies?.map((reply) => this.mapCommentToDto(reply)) || [],
    };
  }

  private mapListingToDto(listing: any): MarketplaceListingDto {
    return {
      id: listing.id,
      sellerId: listing.sellerId,
      gardenPlantId: listing.gardenPlantId,
      product: listing.title,
      quantity: `${listing.quantity} ${listing.unit}`,
      priceAmount: listing.priceAmount,
      description: listing.description,
      imageAssetId: listing.imageAssetId,
      expiresAt: listing.expiresAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      seller: this.mapUserToMinimalDto(listing.seller),
    };
  }

  private mapUserToMinimalDto(user: any): UserMinimalDto {
    return {
      id: user.id,
      username: user.profile?.displayName || user.email.split('@')[0],
      profileImage: user.profile?.avatarAsset?.publicUrl,
      district: user.profile?.district,
      verifiedGrower: user.profile?.growerVerificationStatus === 'VERIFIED',
    };
  }
}
