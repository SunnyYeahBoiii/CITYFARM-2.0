jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));
jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));
jest.mock(
  'src/dtos/auth/setup-password.dto',
  () => ({
    SetupPasswordDto: class SetupPasswordDto {},
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: UserService, useValue: {} },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(() => 'http://localhost:3000') },
        },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
