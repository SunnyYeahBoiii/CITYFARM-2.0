import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { AdminFeedPostRow } from './admin-posts.types';
import type { AdminModerationStatus } from './admin-posts.dto';

type FeedPostWithAdminDeps = Prisma.FeedPostGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        profile: {
          select: {
            displayName: true;
            district: true;
            growerVerificationStatus: true;
          };
        };
      };
    };
    imageAsset: { select: { publicUrl: true } };
    _count: {
      select: {
        reactions: true;
        comments: true;
      };
    };
  };
}>;

function formatShortDateTime(date: Date): string {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function safeName(user: {
  email: string;
  profile?: { displayName?: string | null } | null;
}): string {
  return user.profile?.displayName?.trim() || user.email.split('@')[0];
}

function safeDistrict(user: {
  profile?: { district?: string | null } | null;
}): string {
  return user.profile?.district?.trim() || 'Unknown';
}

function isVerifiedGrower(user: {
  profile?: { growerVerificationStatus?: string | null } | null;
}): boolean {
  return user.profile?.growerVerificationStatus === 'VERIFIED';
}

@Injectable()
export class AdminPostsService {
  constructor(private readonly prisma: PrismaService) {}

  private deriveRiskNotes(post: FeedPostWithAdminDeps): string[] {
    const notes: string[] = [];

    if (
      !post.imageAssetId &&
      (post.postType === 'SHOWCASE' || post.postType === 'PLANT_SHARE')
    ) {
      notes.push('Missing image for showcase/share');
    }

    const caption = post.caption.trim();
    if (caption.length > 240) {
      notes.push('Long caption; check truncation and clarity');
    }

    if (post.postType === 'QUESTION' && caption.length < 30) {
      notes.push('Very short question; may lack context');
    }

    if (!post.visibilityDistrict) {
      notes.push('No district scope set');
    }

    if (post.user.profile?.growerVerificationStatus === 'REVOKED') {
      notes.push('Author verification revoked');
    }

    return notes;
  }

  private deriveStatus(
    isPublished: boolean,
    riskNotes: string[],
  ): AdminModerationStatus {
    if (!isPublished) {
      return 'HIDDEN';
    }
    if (riskNotes.length > 0) {
      return 'NEEDS_REVIEW';
    }
    return 'PUBLISHED';
  }

  private mapToRow(post: FeedPostWithAdminDeps): AdminFeedPostRow {
    const riskNotes = this.deriveRiskNotes(post);
    const status = this.deriveStatus(Boolean(post.isPublished), riskNotes);

    return {
      id: post.id,
      authorName: safeName(post.user),
      authorDistrict: safeDistrict(post.user),
      authorVerifiedGrower: isVerifiedGrower(post.user),
      createdAtLabel: formatShortDateTime(post.createdAt),
      postType: post.postType,
      caption: post.caption,
      imageUrl: post.imageAsset?.publicUrl ?? undefined,
      visibilityDistrict: post.visibilityDistrict ?? undefined,
      signals: {
        likes: post._count.reactions,
        comments: post._count.comments,
        reports: 0,
      },
      status,
      riskNotes,
    };
  }

  async listPosts(params?: { limit?: number }): Promise<AdminFeedPostRow[]> {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);

    const posts = await this.prisma.feedPost.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
              },
            },
          },
        },
        imageAsset: { select: { publicUrl: true } },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return posts.map((post) => this.mapToRow(post));
  }

  async patchPost(
    postId: string,
    dto: { status: AdminModerationStatus; moderationNote?: string },
  ): Promise<AdminFeedPostRow> {
    const note = dto.moderationNote?.trim();
    if (note) {
      throw new BadRequestException(
        'moderationNote is not supported yet (no persistence in schema).',
      );
    }

    if (dto.status !== 'PUBLISHED' && dto.status !== 'HIDDEN') {
      throw new BadRequestException(
        'Only PUBLISHED and HIDDEN are supported with current schema.',
      );
    }

    const existing = await this.prisma.feedPost.findUnique({
      where: { id: postId },
      select: { id: true, publishedAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.feedPost.update({
      where: { id: postId },
      data:
        dto.status === 'PUBLISHED'
          ? {
              isPublished: true,
              publishedAt: existing.publishedAt ?? new Date(),
            }
          : {
              isPublished: false,
            },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
              },
            },
          },
        },
        imageAsset: { select: { publicUrl: true } },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return this.mapToRow(updated);
  }
}
