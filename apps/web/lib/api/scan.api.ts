import type { ScanAnalysis, ScanRecommendation } from "@/lib/cityfarm/types";
import { api } from "@/lib/client";

interface AnalyzeSpaceApiResponse {
  success: boolean;
  analysis?: ScanAnalysis;
  recommendations?: ScanRecommendation[];
  visualizedImage?: string;
  error?: string;
}

export interface SpaceScanResult {
  analysis: ScanAnalysis;
  recommendations: ScanRecommendation[];
  visualizedImageUrl: string | null;
}

function toImageDataUrl(value?: string): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("data:image/")) {
    return value;
  }

  return `data:image/jpeg;base64,${value}`;
}

export async function analyzeSpaceScan(file: File): Promise<SpaceScanResult> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<AnalyzeSpaceApiResponse>("/api/scan/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 120_000,
  });

  if (!data.success) {
    throw new Error(data.error || "Scan analysis failed.");
  }

  if (!data.analysis) {
    throw new Error("Scan analysis is missing from the response.");
  }

  return {
    analysis: data.analysis,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    visualizedImageUrl: toImageDataUrl(data.visualizedImage),
  };
}
