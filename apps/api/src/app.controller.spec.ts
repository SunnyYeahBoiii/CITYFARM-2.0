jest.mock('./app.service', () => ({
  AppService: class AppService {},
}));
jest.mock('./app-readiness.service', () => ({
  AppReadinessService: class AppReadinessService {},
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

describe('AppController', () => {
  let appController: AppController;
  const appService = {
    getHello: jest.fn(() => 'Hello World!'),
  };
  const readinessService = {
    getReadiness: jest.fn(() =>
      Promise.resolve({
        ready: true,
        checks: { database: true, modelApi: true },
      }),
    ),
  };

  beforeEach(async () => {
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
});
