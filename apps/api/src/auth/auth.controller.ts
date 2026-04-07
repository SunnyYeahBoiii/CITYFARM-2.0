import { Controller, Post, Body, Res, Get, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto);
    const tokens = await this.authService.login(user);

    res.cookie('access_token', tokens.access_token, this.authService.getCookieOptions(false));
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getCookieOptions(true));

    return { message: 'Logged in successfully' };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('access_token', tokens.access_token, this.authService.getCookieOptions(false));
    res.cookie('refresh_token', tokens.refresh_token, this.authService.getCookieOptions(true));

    return { message: 'Tokens refreshed successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    
    // According to MDN clearCookie options must match the options in res.cookie exactly except for expires and maxAge
    res.clearCookie('access_token', { ...this.authService.getCookieOptions(false), maxAge: 0 });
    res.clearCookie('refresh_token', { ...this.authService.getCookieOptions(true), maxAge: 0 });

    return { message: 'Logged out successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.findByIdWithProfile(req.user.id);
  }
}
