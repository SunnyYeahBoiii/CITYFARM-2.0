jest.mock('./prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AppReadinessService } from './app-readiness.service';

describe('AppReadinessService', () => {
  const prisma = {
    $queryRawUnsafe: jest.fn(),
  };
  const originalFetch = global.fetch;
  const originalModelApiUrl = process.env.MODEL_API_URL;

  let readinessService: AppReadinessService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MODEL_API_URL = 'http://model-api:3003';
    readinessService = new AppReadinessService(prisma as never);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalModelApiUrl === undefined) {
      delete process.env.MODEL_API_URL;
    } else {
      process.env.MODEL_API_URL = originalModelApiUrl;
    }
  });

  it('reports ready when database and model API readiness checks pass', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as never;

    await expect(readinessService.getReadiness()).resolves.toEqual({
      ready: true,
      checks: {
        database: true,
        modelApi: true,
      },
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://model-api:3003/ready',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('reports not ready when model API readiness fails', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as never;

    await expect(readinessService.getReadiness()).resolves.toEqual({
      ready: false,
      checks: {
        database: true,
        modelApi: false,
      },
    });
  });
});
