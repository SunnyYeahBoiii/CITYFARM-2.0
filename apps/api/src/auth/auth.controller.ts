import { Controller, Post, Body, Res, Get, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from '../dtos/auth/auth-register.dto';
import { AuthLoginDto } from '../dtos/auth/auth-login.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { UserService } from '../user/user.service';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { SetupPasswordDto } from 'src/dtos/auth/setup-password.dto';

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,  
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  @Post('register')
  async register(@Body() registerDto: AuthRegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: AuthLoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto);
    const tokens = await this.authService.login(user);

    res.cookie('access_token', tokens.access_token, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getRefreshTokenCookieOptions());

    return { message: 'Logged in successfully' };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('access_token', tokens.access_token, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getRefreshTokenCookieOptions());

    return { message: 'Tokens refreshed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    
    res.clearCookie('access_token', { ...this.authService.getAccessTokenCookieOptions(), maxAge: 0 });
    res.clearCookie('refresh_token', { ...this.authService.getRefreshTokenCookieOptions(), maxAge: 0 });

    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = req.user;

    const tokens = await this.authService.login(user);

    res.cookie('access_token', tokens.access_token, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getRefreshTokenCookieOptions());
    
    const redirectUrl = user.passwordHash ? `${this.frontendUrl}/`: `${this.frontendUrl}/auth/setup-password?source=google`;

    res.redirect(redirectUrl);
  }

  @Post('setup-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setupPassword(@Req() req: any, @Body() body: SetupPasswordDto, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;

    const result = await this.authService.setupPassword(userId, body.password);
    const tokens = await this.authService.login(result);

    res.cookie('access_token', tokens.access_token, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getRefreshTokenCookieOptions());

    return { message: 'Password set up successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.findByIdWithProfile(req.user.id);
  }
}
