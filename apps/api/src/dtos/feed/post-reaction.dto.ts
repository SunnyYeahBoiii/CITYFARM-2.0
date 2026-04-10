import { IsEnum } from 'class-validator';
import { ReactionType } from 'generated/prisma/enums';

export { ReactionType };

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
