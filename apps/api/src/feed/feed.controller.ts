import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { CreatePostDto } from '../dtos/feed/create-post.dto';
import { UpdatePostDto } from '../dtos/feed/update-post.dto';
import { FeedFilterDto } from '../dtos/feed/feed-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() createPostDto: CreatePostDto) {
    return this.feedService.create(req.user.id, createPostDto);
  }

  @Get('posts')
  findAll(@Query() filter: FeedFilterDto) {
    return this.feedService.findAll(filter);
  }

  @Get('posts/:id')
  findOne(@Param('id') id: string) {
    return this.feedService.findOne(id);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.feedService.update(id, req.user.id, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.feedService.remove(id, req.user.id);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.feedService.toggleLike(id, req.user.id);
  }
}
