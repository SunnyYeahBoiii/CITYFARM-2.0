import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from '../dtos/feed/create-post.dto';
import { UpdatePostDto } from '../dtos/feed/update-post.dto';
import { FeedFilterDto } from '../dtos/feed/feed-filter.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    return this.prisma.feedPost.create({
      data: {
        ...createPostDto,
        userId,
        publishedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async findAll(filter: FeedFilterDto) {
    const { postType, limit = 10, cursor } = filter;

    return this.prisma.feedPost.findMany({
      where: {
        postType: postType,
        isPublished: true,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        imageAsset: true,
        gardenPlant: {
          include: {
            plantSpecies: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.feedPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        imageAsset: true,
        gardenPlant: true,
        comments: {
          include: {
            user: {
              select: {
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarAssetId: true,
                  },
                }
              }
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.feedPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this post');
    }

    return this.prisma.feedPost.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.feedPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    return this.prisma.feedPost.delete({
      where: { id },
    });
  }

  async toggleLike(postId: string, userId: string) {
    const existingReaction = await this.prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingReaction) {
      await this.prisma.postReaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      return { liked: false };
    } else {
      await this.prisma.postReaction.create({
        data: {
          postId,
          userId,
        },
      });
      return { liked: true };
    }
  }
}
