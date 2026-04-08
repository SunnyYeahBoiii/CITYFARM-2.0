import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Bật CORS để Next.js (localhost:3000) có thể gọi API sang đây
  app.enableCors(); 
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Logger: Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();