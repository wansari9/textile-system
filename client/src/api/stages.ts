import apiClient from '../lib/client';

export const postStage = async (payload: {
  stage: string;
  product_id: number;
  production_date: string;
  qty_completed: number;
}) => {
  const { data } = await apiClient.post('/stages', payload);
  return data;
};

export const getStages = async (params?: any) => {
  const { data } = await apiClient.get('/stages', { params });
  return data;
};

export const getStagesSummary = async (params?: { date?: string; from?: string; to?: string }) => {
  const { data } = await apiClient.get('/stages/summary', { params });
  return data;
};
