import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from '../dtos/auth/auth-register.dto';
import { AuthLoginDto } from '../dtos/auth/auth-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { SetupPasswordDto } from 'src/dtos/auth/setup-password.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  readAccessToken,
  readCookie,
  shouldExposeTokensInBody,
} from './auth-token.utils';

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  private getGuestProfile() {
    return {
      id: '',
      email: '',
      role: 'GUEST',
      requiresPasswordSetup: false,
      profile: null,
    };
  }

  private setSessionCookies(res: Response, tokens: AuthTokens) {
    res.cookie(
      'access_token',
      tokens.access_token,
      this.authService.getAccessTokenCookieOptions(),
    );
    res.cookie(
      'refresh_token',
      tokens.refresh_token,
      this.authService.getRefreshTokenCookieOptions(),
    );
  }

  private buildAuthResponse(req: Request, message: string, tokens: AuthTokens) {
    if (shouldExposeTokensInBody(req)) {
      return {
        message,
        ...tokens,
      };
    }

    return { message };
  }

  private async resolveProfileFromAccessToken(accessToken: string) {
    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      return await this.userService.findByIdWithProfile(payload.sub);
    } catch {
      return null;
    }
  }

  private async resolveProfileFromRefreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (
        !user ||
        !user.refreshToken ||
        !(await bcrypt.compare(refreshToken, user.refreshToken))
      ) {
        return null;
      }

      return await this.userService.findByIdWithProfile(user.id);
    } catch {
      return null;
    }
  }

  @Post('register')
  async register(@Body() registerDto: AuthRegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Req() req: Request,
    @Body() loginDto: AuthLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const tokens = await this.authService.login(user);

    this.setSessionCookies(res, tokens);

    return this.buildAuthResponse(req, 'Logged in successfully', tokens);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    this.setSessionCookies(res, tokens);

    return this.buildAuthResponse(
      req as Request,
      'Tokens refreshed successfully',
      tokens,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);

    res.clearCookie('access_token', {
      ...this.authService.getAccessTokenCookieOptions(),
      maxAge: 0,
    });
    res.clearCookie('refresh_token', {
      ...this.authService.getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const user = req.user;

    const tokens = await this.authService.login(user);

    this.setSessionCookies(res, tokens);

    const redirectUrl = user.passwordHash
      ? `${this.frontendUrl}/`
      : `${this.frontendUrl}/setup-password?source=google`;

    res.redirect(redirectUrl);
  }

  @Post('setup-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setupPassword(
    @Req() req: any,
    @Body() body: SetupPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;

    const result = await this.authService.setupPassword(userId, body.password);
    const tokens = await this.authService.login(result);

    this.setSessionCookies(res, tokens);

    return this.buildAuthResponse(
      req as Request,
      'Password set up successfully',
      tokens,
    );
  }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const accessToken = readAccessToken(req);
    if (accessToken) {
      const accessProfile =
        await this.resolveProfileFromAccessToken(accessToken);
      if (accessProfile) {
        return accessProfile;
      }
    }

    const refreshToken = readCookie(req, 'refresh_token');
    if (!refreshToken) {
      return this.getGuestProfile();
    }

    const refreshProfile =
      await this.resolveProfileFromRefreshToken(refreshToken);
    return refreshProfile ?? this.getGuestProfile();
  }
}
