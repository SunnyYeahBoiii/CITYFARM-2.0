jest.mock('./prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('./ai/tool-executor.service', () => ({
  ToolExecutorService: class ToolExecutorService {},
}));

import { AppService } from './app.service';

describe('AppService.analyzeSpace', () => {
  const prisma = {
    $queryRawUnsafe: jest.fn(),
    plantSpecies: {
      findMany: jest.fn(),
    },
  };

  const modelApiService = {
    analyzeSpaceLayout: jest.fn(),
    renderSpaceVisualization: jest.fn(),
  };

  const storageService = {
    downloadFile: jest.fn(),
  };

  const file = {
    buffer: Buffer.from('space-image'),
  } as Express.Multer.File;

  let appService: AppService;

  beforeEach(() => {
    jest.clearAllMocks();
    appService = new AppService(
      prisma as never,
      modelApiService as never,
      storageService as never,
    );
  });

  it('renders a real plant image for the top recommendation and maps DB image URLs', async () => {
    const plantOneImage = {
      publicUrl: 'https://cdn.example.com/seed.png',
      storageKey: 'products/seed.png',
    };

    prisma.plantSpecies.findMany.mockResolvedValue([
      {
        id: 'species-1',
        commonName: 'Mint',
        scientificName: 'Mentha',
        category: 'Herb',
        difficulty: 'EASY',
        lightRequirement: 'PARTIAL_SUN',
        minLightScore: 40,
        maxLightScore: 70,
        recommendedMinAreaSqm: 0.2,
        temperatureMinC: 20,
        temperatureMaxC: 32,
        harvestDaysMin: 30,
        harvestDaysMax: 45,
        products: [
          {
            type: 'KIT',
            createdAt: new Date('2024-04-01T00:00:00.000Z'),
            coverAsset: {
              publicUrl: 'https://cdn.example.com/kit.png',
              storageKey: 'products/kit.png',
            },
          },
          {
            type: 'SEED',
            createdAt: new Date('2024-03-01T00:00:00.000Z'),
            coverAsset: plantOneImage,
          },
        ],
      },
      {
        id: 'species-2',
        commonName: 'Basil',
        scientificName: 'Ocimum basilicum',
        category: 'Herb',
        difficulty: 'EASY',
        lightRequirement: 'FULL_SUN',
        minLightScore: 70,
        maxLightScore: 100,
        recommendedMinAreaSqm: 0.3,
        temperatureMinC: 22,
        temperatureMaxC: 34,
        harvestDaysMin: 40,
        harvestDaysMax: 55,
        products: [],
      },
    ]);

    modelApiService.analyzeSpaceLayout.mockResolvedValue({
      success: true,
      analysis: { lightLevel: 'PARTIAL_SUN' },
      recommendations: [
        {
          id: 'species-2',
          name: 'Basil',
          matchScore: 81,
          imageUrl: 'https://fallback.example.com/basil.png',
        },
        {
          id: 'species-1',
          name: 'Mint',
          matchScore: 95,
          imageUrl: '',
        },
      ],
      placement_description: 'Place the plant near the balcony rail.',
    });
    storageService.downloadFile.mockResolvedValue(Buffer.from('plant-image'));
    modelApiService.renderSpaceVisualization.mockResolvedValue({
      visualizedImage: 'data:image/jpeg;base64,rendered',
    });

    const result = await appService.analyzeSpace(file);

    expect(modelApiService.analyzeSpaceLayout).toHaveBeenCalledWith({
      imageBase64: Buffer.from('space-image').toString('base64'),
      plantCatalogText: expect.stringContaining('[ID: species-1]'),
    });
    expect(storageService.downloadFile).toHaveBeenCalledWith(
      plantOneImage.storageKey,
    );
    expect(modelApiService.renderSpaceVisualization).toHaveBeenCalledWith({
      spaceImageBase64: Buffer.from('space-image').toString('base64'),
      plantImageBase64: Buffer.from('plant-image').toString('base64'),
      placementDescription: 'Place the plant near the balcony rail.',
    });
    expect(result.recommendations).toEqual([
      {
        id: 'species-2',
        name: 'Basil',
        matchScore: 81,
        imageUrl: 'https://fallback.example.com/basil.png',
      },
      {
        id: 'species-1',
        name: 'Mint',
        matchScore: 95,
        imageUrl: plantOneImage.publicUrl,
      },
    ]);
    expect(result.visualizedImage).toBe('data:image/jpeg;base64,rendered');
  });

  it('skips visualization when no usable plant asset exists', async () => {
    prisma.plantSpecies.findMany.mockResolvedValue([
      {
        id: 'species-1',
        commonName: 'Mint',
        scientificName: 'Mentha',
        category: 'Herb',
        difficulty: 'EASY',
        lightRequirement: 'PARTIAL_SUN',
        minLightScore: 40,
        maxLightScore: 70,
        recommendedMinAreaSqm: 0.2,
        temperatureMinC: 20,
        temperatureMaxC: 32,
        harvestDaysMin: 30,
        harvestDaysMax: 45,
        products: [],
      },
    ]);

    modelApiService.analyzeSpaceLayout.mockResolvedValue({
      analysis: { lightLevel: 'PARTIAL_SUN' },
      recommendations: [
        {
          id: 'species-1',
          name: 'Mint',
          matchScore: 90,
          imageUrl: '',
        },
      ],
      placement_description: 'Place the plant near the balcony rail.',
    });

    const result = await appService.analyzeSpace(file, 'manual catalog');

    expect(modelApiService.analyzeSpaceLayout).toHaveBeenCalledWith({
      imageBase64: Buffer.from('space-image').toString('base64'),
      plantCatalogText: 'manual catalog',
    });
    expect(storageService.downloadFile).not.toHaveBeenCalled();
    expect(modelApiService.renderSpaceVisualization).not.toHaveBeenCalled();
    expect(result.visualizedImage).toBe('');
  });
});
