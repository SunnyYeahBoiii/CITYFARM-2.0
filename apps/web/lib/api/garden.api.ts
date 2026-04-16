import { api } from '@/lib/client';
import type {
  GardenPlantSummary,
  GardenPlantDetail,
  JournalEntryItem,
  LogCarePayload,
  LogJournalPayload,
  GardenStats
} from '@/lib/types/garden';

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

  getGardenStats: async (): Promise<GardenStats> => {
    const response = await api.get('/garden/stats');
    return response.data;
  },

  logCare: async (plantId: string, payload: LogCarePayload): Promise<{ success: boolean }> => {
    const response = await api.post(`/garden/${plantId}/care`, payload);
    return response.data;
  },

  logJournal: async (plantId: string, payload: LogJournalPayload): Promise<JournalEntryItem> => {
    const response = await api.post(`/garden/${plantId}/journal`, payload);
    return response.data;
  },

  deleteJournal: async (plantId: string, journalId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/garden/${plantId}/journal/${journalId}`);
    return response.data;
  },
};
