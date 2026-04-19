import { IsEnum, IsOptional } from 'class-validator';
import {
  UserRole,
  VerificationStatus,
} from '../../../../../generated/prisma/client.js';

export class AdminUserPatchDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(VerificationStatus)
  growerVerificationStatus?: VerificationStatus;
}
