import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { CommunityModule } from './community/community.module';
import { AssetsModule } from './assets/assets.module';
import { OrderModule } from './order/order.module';
import { LoggingMiddleware } from './common/middleware/logging/logging.middleware';
import { AdminContentModule } from './admin/content/admin-content.module';
import { AdminOperationsModule } from './admin/operations/admin-operations.module';
import { ProductsModule } from './products/products.module';
import { GardenModule } from './garden/garden.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    CommunityModule,
    AssetsModule,
    OrderModule,
    AdminContentModule,
    AdminOperationsModule,
    ProductsModule,
    GardenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
