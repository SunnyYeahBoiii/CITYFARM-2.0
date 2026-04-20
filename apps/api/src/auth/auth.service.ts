import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
    if (user?.passwordHash && (await bcrypt.compare(loginDto.password, user.passwordHash))) {
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

  private isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private getCookieSameSite(): 'lax' | 'strict' | 'none' {
    const configured = this.configService.get<string>('COOKIE_SAME_SITE')?.toLowerCase();
    if (configured === 'strict' || configured === 'lax' || configured === 'none') {
      return configured;
    }

    return this.isProduction() ? 'none' : 'lax';
  }

  private getCookieDomain() {
    return this.configService.get<string>('COOKIE_DOMAIN') || undefined;
  }

  getAccessTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: this.getCookieSameSite(),
      domain: this.getCookieDomain(),
      maxAge: 15 * 60 * 1000,
    };
  }

  getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: this.getCookieSameSite(),
      domain: this.getCookieDomain(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
