import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppReadinessService {
  private readonly logger = new Logger(AppReadinessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReadiness() {
    const checks = {
      database: false,
      modelApi: false,
    };

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      checks.database = true;
    } catch (error) {
      this.logger.error('[Readiness] Database check failed', error);
    }

    const modelApiUrl = process.env.MODEL_API_URL?.trim().replace(/\/$/, '');
    if (modelApiUrl) {
      try {
        const response = await fetch(`${modelApiUrl}/ready`, {
          signal: AbortSignal.timeout(5_000),
        });
        checks.modelApi = response.ok;
      } catch (error) {
        this.logger.error('[Readiness] Model API check failed', error);
      }
    }

    return {
      ready: checks.database && checks.modelApi,
      checks,
    };
  }
}
