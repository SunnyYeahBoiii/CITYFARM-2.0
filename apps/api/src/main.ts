import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultWebOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const envOrigins =
    process.env.WEB_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? [];
  const allowedOrigins = new Set([...defaultWebOrigins, ...envOrigins]);

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
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
