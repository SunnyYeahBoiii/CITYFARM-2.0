import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Req
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFeedPostDto, PostType } from '../dtos/feed/create-feed-post.dto';
import { CreateFeedCommentDto } from '../dtos/feed/feed-comment.dto';
import { CreatePostReactionDto } from '../dtos/feed/post-reaction.dto';
import { CreateMarketplaceListingDto } from '../dtos/marketplace/create-marketplace-listing.dto';
import { AuthService } from 'src/auth/auth.service';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly authService: AuthService
  ) {}

  // ============ POSTS ============

  @Get('feed')
  async getFeedPosts(
    @Req() req: any,
    @Query('postType') postType?: PostType,
    @Query('district') district?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = (await this.authService.extractUserIdFromCookies(req)) ?? '';
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    return this.communityService.getFeedPosts(userId, postType, district, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed/:postId')
  async getFeedPost(@Param('postId') postId: string, @CurrentUser() userId: string) {
    return this.communityService.getFeedPostById(postId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('feed')
  async createFeedPost(@CurrentUser('id') userId: string, @Body() dto: CreateFeedPostDto) {
    return this.communityService.createFeedPost(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('feed/:postId')
  async deleteFeedPost(@Param('postId') postId: string, @CurrentUser() userId: string) {
    await this.communityService.deleteFeedPost(postId, userId);
    return { message: 'Post deleted successfully' };
  }

  // ============ COMMENTS ============

  @Get('feed/:postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    return this.communityService.getPostComments(postId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('feed/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFeedCommentDto,
  ) {
    return this.communityService.createComment(postId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @CurrentUser() userId: string) {
    await this.communityService.deleteComment(commentId, userId);
    return { message: 'Comment deleted successfully' };
  }

  // ============ REACTIONS ============

  @UseGuards(JwtAuthGuard)
  @Post('feed/:postId/reactions')
  async toggleReaction(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostReactionDto,
  ) {
    const isLiked = await this.communityService.togglePostReaction(postId, userId, dto);
    return { isLiked };
  }

  // ============ MARKETPLACE ============

  @Get('marketplace')
  async getMarketplaceListings(
    @Query('district') district?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    return this.communityService.getMarketplaceListings(district, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('marketplace')
  async createMarketplaceListing(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMarketplaceListingDto,
  ) {
    return this.communityService.createMarketplaceListing(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('marketplace/:listingId')
  async deleteMarketplaceListing(
    @Param('listingId') listingId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.communityService.deleteMarketplaceListing(listingId, userId);
    return { message: 'Listing deleted successfully' };
  }
}
