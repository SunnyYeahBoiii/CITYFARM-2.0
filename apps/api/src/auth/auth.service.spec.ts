jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  const userService = {
    findById: jest.fn(),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn((name: string) => `${name}-secret`),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractUserIdFromCookies', () => {
    it('falls back to a valid refresh token when the access token is invalid', async () => {
      jwtService.verifyAsync
        .mockRejectedValueOnce(new Error('expired access token'))
        .mockResolvedValueOnce({ sub: 'user-id' });
      userService.findById.mockResolvedValue({
        id: 'user-id',
        refreshToken: 'hashed-refresh-token',
      });
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.extractUserIdFromCookies({
          cookies: {
            access_token: 'expired-access-token',
            refresh_token: 'valid-refresh-token',
          },
        } as any),
      ).resolves.toBe('user-id');

      expect(jwtService.verifyAsync).toHaveBeenNthCalledWith(
        1,
        'expired-access-token',
        { secret: 'JWT_ACCESS_SECRET-secret' },
      );
      expect(jwtService.verifyAsync).toHaveBeenNthCalledWith(
        2,
        'valid-refresh-token',
        { secret: 'JWT_REFRESH_SECRET-secret' },
      );
      expect(userService.findById).toHaveBeenCalledWith('user-id');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'valid-refresh-token',
        'hashed-refresh-token',
      );
    });

    it('returns null when refresh token does not match the stored token', async () => {
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
      userService.findById.mockResolvedValue({
        id: 'user-id',
        refreshToken: 'hashed-refresh-token',
      });
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.extractUserIdFromCookies({
          cookies: { refresh_token: 'stale-refresh-token' },
        } as any),
      ).resolves.toBeNull();
    });
  });
});
