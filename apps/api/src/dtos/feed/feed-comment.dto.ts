import { IsString, IsOptional } from 'class-validator';
import { UserMinimalDto } from './feed-post.dto';

export class CreateFeedCommentDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

export class FeedCommentDto {
  id: string;
  postId: string;
  parentCommentId?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  user: UserMinimalDto;
  replies?: FeedCommentDto[];
}

export class FeedCommentsDto {
  data: FeedCommentDto[];
  total: number;
  hasMore: boolean;
}
