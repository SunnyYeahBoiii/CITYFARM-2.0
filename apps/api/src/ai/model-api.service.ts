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

type AnalyzeSpaceLayoutPayload = {
  imageBase64: string;
  plantCatalogText: string;
};

type RenderSpaceVisualizationPayload = {
  spaceImageBase64: string;
  plantImageBase64: string;
  bestLocation: [number, number, number, number];
};

const MODEL_API_TIMEOUT_MS = 120_000;
const MODEL_API_BODY_PREVIEW_LIMIT = 220;

@Injectable()
export class ModelApiService {
  private get modelBaseUrls() {
    const configuredUrl = process.env.MODEL_API_URL?.trim();

    if (configuredUrl) {
      return [configuredUrl.replace(/\/$/, '')];
    }

    if (process.env.NODE_ENV === 'production') {
      return ['http://model-api:3003'];
    }

    return [
      'http://127.0.0.1:3003',
      'http://localhost:3003',
      'http://model-api:3003',
    ];
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

  async analyzeSpaceLayout(payload: AnalyzeSpaceLayoutPayload) {
    return this.postJson('/api/analyze-space', {
      image_base64: payload.imageBase64,
      plantCatalogText: payload.plantCatalogText,
    });
  }

  async renderSpaceVisualization(payload: RenderSpaceVisualizationPayload) {
    return this.postJson('/api/render-space-visualization', {
      space_image_base64: payload.spaceImageBase64,
      plant_image_base64: payload.plantImageBase64,
      best_location: payload.bestLocation,
    });
  }

  private parseJsonBody(rawBody: string): unknown {
    if (!rawBody.trim()) {
      return null;
    }

    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return null;
    }
  }

  private previewBody(rawBody: string): string {
    return rawBody
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MODEL_API_BODY_PREVIEW_LIMIT);
  }

  private buildUpstreamErrorMessage(
    path: string,
    response: Response,
    rawBody: string,
    data: unknown,
  ): string {
    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
    ) {
      return data.error;
    }

    const preview = this.previewBody(rawBody);
    const contentType = response.headers.get('content-type') ?? 'unknown';
    const statusLabel = `Model API ${response.status} at ${path}`;
    const miswiredHint =
      contentType.includes('text/html') || preview.includes('<!DOCTYPE html')
        ? ' Upstream appears to be a web HTML response, so MODEL_API_URL is likely pointing at the wrong service.'
        : '';

    if (preview) {
      return `${statusLabel} (${contentType}): ${preview}${miswiredHint}`;
    }

    return `${statusLabel} (${contentType})${miswiredHint}`;
  }

  private async postJson(path: string, payload: unknown) {
    let response: Response | null = null;
    let upstreamUrl = '';

    for (const baseUrl of this.modelBaseUrls) {
      try {
        upstreamUrl = `${baseUrl}${path}`;
        response = await fetch(upstreamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(MODEL_API_TIMEOUT_MS),
        });
        break;
      } catch (error) {
        console.error(
          `[ModelApiService] Failed to reach ${path} via ${baseUrl}:`,
          error,
        );
      }
    }

    if (!response) {
      throw new InternalServerErrorException(
        'Không kết nối được tới AI Model API.',
      );
    }

    const rawBody = await response.text();
    const data = this.parseJsonBody(rawBody);

    if (!response.ok) {
      throw new InternalServerErrorException(
        this.buildUpstreamErrorMessage(path, response, rawBody, data),
      );
    }

    if (data === null) {
      const contentType = response.headers.get('content-type') ?? 'unknown';
      const preview = this.previewBody(rawBody);
      throw new InternalServerErrorException(
        `Model API returned a non-JSON success response from ${upstreamUrl} (${contentType})${preview ? `: ${preview}` : ''}`,
      );
    }

    return data;
  }
}
