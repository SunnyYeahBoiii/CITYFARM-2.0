import { Injectable, InternalServerErrorException } from '@nestjs/common';

type PlantHealthContext = {
  plantName?: string | null;
  scientificName?: string | null;
  plantType?: string | null;
  growthStage?: string | null;
  userNote?: string | null;
};

type AnalyzePlantHealthPayload = {
  imageBase64: string;
  context?: PlantHealthContext;
};

type AnalyzeSpacePayload = {
  imageBase64: string;
  plantCatalogText: string;
};

@Injectable()
export class ModelApiService {
  private get modelBaseUrl() {
    return (process.env.MODEL_API_URL ?? 'http://model-api:3002').replace(
      /\/$/,
      '',
    );
  }

  async getChatAdvice(payload: unknown) {
    return this.postJson('/api/chat', payload);
  }

  async analyzePlantHealth(payload: AnalyzePlantHealthPayload) {
    return this.postJson('/api/analyze-plant-health', {
      image_base64: payload.imageBase64,
      context: payload.context ?? {},
    });
  }

  async analyzeSpace(payload: AnalyzeSpacePayload) {
    return this.postJson('/api/analyze-space', {
      image_base64: payload.imageBase64,
      plantCatalogText: payload.plantCatalogText,
    });
  }

  private async postJson(path: string, payload: unknown) {
    let response: Response;

    try {
      response = await fetch(`${this.modelBaseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`[ModelApiService] Failed to reach ${path}:`, error);
      throw new InternalServerErrorException(
        'Không kết nối được tới AI Model API.',
      );
    }

    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof data.error === 'string'
          ? data.error
          : `Model API error at ${path}`;
      throw new InternalServerErrorException(message);
    }

    return data;
  }
}
