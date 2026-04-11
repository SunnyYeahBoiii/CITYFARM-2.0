import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { AuthRegisterDto } from '../dtos/auth/auth-register.dto';
import { AuthLoginDto } from '../dtos/auth/auth-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  readCookie(req: Request, cookieName: string): string {
    const cookieValue: unknown = req.cookies?.[cookieName];
    return typeof cookieValue === "string" ? cookieValue : "";
  }

  async register(registerDto: AuthRegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    await this.userService.createWithProfile({
      email: registerDto.email,
      passwordHash,
      displayName: registerDto.displayName,
      bio: registerDto.bio,
      city: registerDto.city,
      district: registerDto.district,
      ward: registerDto.ward,
    });

    return { message: 'User registered successfully' };
  }

  async validateUser(loginDto: AuthLoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (user && user.passwordHash && (await bcrypt.compare(loginDto.password, user.passwordHash))) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userService.updateRefreshToken(user.id, hashedRefreshToken);

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
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.login(user);
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  getAccessTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000,
    };
  }

  getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
