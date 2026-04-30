import { InternalServerErrorException } from '@nestjs/common';
import { ModelApiService } from './model-api.service';

describe('ModelApiService', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;
  let modelApiService: ModelApiService;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, MODEL_API_URL: 'http://model-api.local' };
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    modelApiService = new ModelApiService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('posts layout analysis payload to /api/analyze-space', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await modelApiService.analyzeSpaceLayout({
      imageBase64: 'space-b64',
      plantCatalogText: 'catalog',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://model-api.local/api/analyze-space',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: 'space-b64',
          plantCatalogText: 'catalog',
        }),
      }),
    );
  });

  it('posts render payload to /api/render-space-visualization', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await modelApiService.renderSpaceVisualization({
      spaceImageBase64: 'space-b64',
      plantImageBase64: 'plant-b64',
      bestLocation: [10, 20, 30, 40],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://model-api.local/api/render-space-visualization',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_image_base64: 'space-b64',
          plant_image_base64: 'plant-b64',
          best_location: [10, 20, 30, 40],
        }),
      }),
    );
  });

  it('surfaces upstream HTML errors with a miswired hint', async () => {
    fetchMock.mockResolvedValue(
      new Response('<!DOCTYPE html><html>bad gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    try {
      await modelApiService.analyzeSpaceLayout({
        imageBase64: 'space-b64',
        plantCatalogText: 'catalog',
      });
      fail('Expected analyzeSpaceLayout to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as Error).message).toContain(
        'MODEL_API_URL is likely pointing at the wrong service',
      );
    }
  });

  it('uses deterministic development fallback when MODEL_API_URL is missing', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    modelApiService = new ModelApiService();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await modelApiService.analyzeSpaceLayout({
      imageBase64: 'space-b64',
      plantCatalogText: 'catalog',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3003/api/analyze-space',
      expect.any(Object),
    );
  });

  it('throws in production when MODEL_API_URL is missing', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.MODEL_API_URL;
    modelApiService = new ModelApiService();

    await expect(
      modelApiService.analyzeSpaceLayout({
        imageBase64: 'space-b64',
        plantCatalogText: 'catalog',
      }),
    ).rejects.toThrow('[config] Missing required env: MODEL_API_URL');
  });
});
