jest.mock('./app.service', () => ({
  AppService: class AppService {},
}));
jest.mock('./app-readiness.service', () => ({
  AppReadinessService: class AppReadinessService {},
}));
jest.mock('./auth/auth.service', () => ({
  AuthService: class AuthService {},
}));
jest.mock(
  'src/common/decorators/current-user.decorator',
  () => ({
    CurrentUser: () => () => undefined,
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppReadinessService } from './app-readiness.service';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';

describe('AppController', () => {
  let appController: AppController;
  const appService = {
    getHello: jest.fn(() => 'Hello World!'),
    handleChatRequest: jest.fn(),
  };
  const readinessService = {
    getReadiness: jest.fn(() =>
      Promise.resolve({
        ready: true,
        checks: { database: true, modelApi: true },
      }),
    ),
  };
  const authService = {
    extractUserIdFromCookies: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    appService.getHello.mockReturnValue('Hello World!');
    appService.handleChatRequest.mockResolvedValue({
      success: true,
      reply: 'ok',
    });
    authService.extractUserIdFromCookies.mockResolvedValue(null);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
        {
          provide: AppReadinessService,
          useValue: readinessService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('ready', () => {
    it('should return readiness checks', async () => {
      await expect(appController.getReadiness()).resolves.toEqual({
        ready: true,
        checks: { database: true, modelApi: true },
      });
    });
  });

  describe('chatWithAI', () => {
    it('uses the user id from cookies when nginx bypasses the Next proxy', async () => {
      authService.extractUserIdFromCookies.mockResolvedValue('cookie-user-id');

      await expect(
        appController.chatWithAI(
          { message: 'ping', plantId: 'plant-id' },
          { headers: {}, ip: '127.0.0.1' } as any,
        ),
      ).resolves.toEqual({ success: true, reply: 'ok' });

      expect(appService.handleChatRequest).toHaveBeenCalledWith(
        'cookie-user-id',
        {
          message: 'ping',
          plantId: 'plant-id',
          context: undefined,
        },
      );
    });

    it('keeps the forwarded Next proxy user id ahead of cookie fallback', async () => {
      authService.extractUserIdFromCookies.mockResolvedValue('cookie-user-id');

      await appController.chatWithAI(
        { message: 'ping' },
        {
          headers: { 'x-cityfarm-user-id': 'forwarded-user-id' },
          ip: '127.0.0.1',
        } as any,
      );

      expect(appService.handleChatRequest).toHaveBeenCalledWith(
        'forwarded-user-id',
        {
          message: 'ping',
          plantId: undefined,
          context: undefined,
        },
      );
    });
  });
});
