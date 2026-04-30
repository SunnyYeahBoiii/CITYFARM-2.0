import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { AuthRegisterDto } from '../dtos/auth/auth-register.dto';
import { AuthLoginDto } from '../dtos/auth/auth-login.dto';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  readCookie(req: Request, cookieName: string): string {
    const cookieValue: unknown = (
      req as Request & {
        cookies?: Record<string, unknown>;
      }
    ).cookies?.[cookieName];
    return typeof cookieValue === 'string' ? cookieValue : '';
  }

  async extractUserIdFromCookies(req: Request): Promise<string | null> {
    const accessToken = this.readCookie(req, 'access_token');
    const refreshToken = this.readCookie(req, 'refresh_token');
    const token = accessToken || refreshToken;
    if (!token) return null;
    try {
      const secret = accessToken
        ? this.configService.get('JWT_ACCESS_SECRET')
        : this.configService.get('JWT_REFRESH_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload.sub;
    } catch {
      return null;
    }
  }

  async register(registerDto: AuthRegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const normalizedDisplayName = registerDto.displayName.trim();
    const existingUsername = await this.userService.findByDisplayName(
      normalizedDisplayName,
    );
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    await this.userService.createWithProfile({
      email: registerDto.email,
      passwordHash,
      displayName: normalizedDisplayName,
      bio: registerDto.bio,
      city: registerDto.city,
      district: registerDto.district,
      ward: registerDto.ward,
    });

    return { message: 'User registered successfully' };
  }

  async validateUser(loginDto: AuthLoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private async createTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);
  }

  private async resolveMatchingSession(userId: string, refreshToken: string) {
    const sessions = await this.userService.findSessionsByUserId(userId);
    for (const session of sessions) {
      const matches = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (matches) {
        return session;
      }
    }
    return null;
  }

  async login(user: any) {
    const [access_token, refresh_token] = await this.createTokens(user);

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userService.createSession(user.id, hashedRefreshToken);

    return {
      access_token,
      refresh_token,
    };
  }

  async setupPassword(userId: string, password: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found!');
    }

    if (user.passwordHash) {
      throw new BadRequestException('This account already has a password!');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.userService.updatePasswordHash(userId, passwordHash);

    return user;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    const matchingSession = await this.resolveMatchingSession(userId, refreshToken);
    if (!matchingSession) {
      throw new UnauthorizedException('Access Denied');
    }

    const [access_token, refresh_token] = await this.createTokens(user);
    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);

    await this.userService.deleteSessionById(matchingSession.id);
    await this.userService.createSession(user.id, hashedRefreshToken);

    return { access_token, refresh_token };
  }

  async logout(userId: string, refreshToken: string) {
    const matchingSession = await this.resolveMatchingSession(userId, refreshToken);
    if (matchingSession) {
      await this.userService.deleteSessionById(matchingSession.id);
    }
    return { message: 'Logged out successfully' };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    return this.resolveMatchingSession(userId, refreshToken);
  }

  getAccessTokenCookieOptions() {
    return {
      httpOnly: true,
      secure:
        this.configService.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000,
    };
  }

  getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      secure:
        this.configService.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
