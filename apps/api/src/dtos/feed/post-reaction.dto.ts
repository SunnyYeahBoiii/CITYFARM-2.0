import { IsEnum } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HELPFUL = 'helpful',
}

export class CreatePostReactionDto {
  @IsEnum(ReactionType)
  reactionType: ReactionType = ReactionType.LIKE;
}

export class PostReactionDto {
  id: string;
  postId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: Date;
}
