import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { resolveAllowedOrigins } from './config/url-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = resolveAllowedOrigins(
    process.env.NODE_ENV,
    process.env.WEB_ORIGINS,
  );

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Session-Transport',
    ],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Logger: Server is running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
