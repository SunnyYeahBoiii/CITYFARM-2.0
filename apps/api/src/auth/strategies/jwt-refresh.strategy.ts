import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { readRefreshToken } from '../auth-token.utils';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return readRefreshToken(request);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    } as any);
  }

  async validate(request: Request, payload: any) {
    const refreshToken = readRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is malformed');
    }
    return { ...payload, refreshToken };
  }
}
