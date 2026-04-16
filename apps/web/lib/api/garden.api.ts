import { api } from '@/lib/client';
import type { GardenPlantSummary, GardenPlantDetail } from '@/lib/types/garden';

export const gardenApi = {
  getMyGarden: async (): Promise<GardenPlantSummary[]> => {
    const response = await api.get('/garden');
    return response.data;
  },

  getPlantDetail: async (plantId: string): Promise<GardenPlantDetail> => {
    const response = await api.get(`/garden/${plantId}`);
    return response.data;
  },

  activateCode: async (code: string): Promise<GardenPlantSummary> => {
    const response = await api.post('/garden/activate', { code });
    return response.data;
  },
};
