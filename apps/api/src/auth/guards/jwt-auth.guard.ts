import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: any, user: TUser | false, info: any): TUser {
    if (err) {
      throw err;
    }

    if (!user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired. Please refresh your session.');
      }
      
      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token. Access denied.');
      }
      throw new UnauthorizedException(info?.message || 'Authentication failed.');
    }

    return user;
  }
}