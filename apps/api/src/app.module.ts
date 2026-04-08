import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
<<<<<<< HEAD
=======
import { FeedModule } from './feed/feed.module';
>>>>>>> a355465629c1e4ab8391fc9ba663ee44f6357241

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
<<<<<<< HEAD
=======
    FeedModule,
>>>>>>> a355465629c1e4ab8391fc9ba663ee44f6357241
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
