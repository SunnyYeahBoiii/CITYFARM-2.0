import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    cb: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const email = emails[0].value;
    const displayName =
      `${name?.givenName || ''} ${name?.familyName || ''}`.trim();
    const avatarUrl = photos?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException(
        'Google account must have an email address. Please try again with a different account.',
      );
    }

    const user = await this.prismaService.$transaction(async (tx) => {
      let existingUser = await tx.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (existingUser) {
        if (!existingUser.externalAuthId) {
          existingUser = await tx.user.update({
            where: { id: existingUser.id },
            data: { externalAuthId: id },
            include: { profile: true },
          });
        }
        return existingUser;
      }

      const newUser = await tx.user.create({
        data: {
          email: email,
          externalAuthId: id,
        },
      });

      const avatarAssetInput = avatarUrl
        ? {
            create: {
              kind: 'PROFILE_AVATAR' as const,
              storageKey: `google-avatar-${id}-${Date.now()}`,
              publicUrl: avatarUrl,
              ownerId: newUser.id,
            },
          }
        : undefined;

      await tx.userProfile.create({
        data: {
          user: { connect: { id: newUser.id } },
          displayName: displayName,
          avatarAsset: avatarAssetInput,
        },
      });

      return newUser;
    });

    cb(null, user);
  }
}
