import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../generated/prisma/client.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByDisplayName(displayName: string) {
    return this.prisma.userProfile.findFirst({
      where: {
        displayName: {
          equals: displayName,
          mode: 'insensitive',
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (user) {
      const { passwordHash, ...safeUser } = user;
      return {
        ...safeUser,
        requiresPasswordSetup: !passwordHash,
      };
    }
    return null;
  }

  async createSession(userId: string, refreshTokenHash: string) {
    return this.prisma.userSession.create({
      data: { userId, refreshTokenHash },
    });
  }

  async findSessionsByUserId(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSessionById(id: string) {
    return this.prisma.userSession.delete({
      where: { id },
    });
  }

  async deleteSessionsByUserId(userId: string) {
    return this.prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async createWithProfile(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    bio?: string;
    city?: string;
    district?: string;
    ward?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        profile: {
          create: {
            displayName: data.displayName,
            bio: data.bio,
            city: data.city,
            district: data.district,
            ward: data.ward,
          },
        },
      },
    });
  }
}
