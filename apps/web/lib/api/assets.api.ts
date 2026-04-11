import { api } from "../client";

export interface AssetResponse {
  id: string;
  publicUrl: string;
  storageKey: string;
  kind: string;
}

export async function uploadAsset(file: File, kind: string = "POST_IMAGE"): Promise<AssetResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const { data } = await api.post<AssetResponse>("/assets/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}
