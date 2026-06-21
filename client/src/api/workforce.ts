import apiClient from '../lib/client';

export const saveWorkforce = async (payload: {
  line_id: number;
  production_date: string;
  workers_required?: number;
  workers_present: number;
  notes?: string;
}) => {
  const { data } = await apiClient.post('/workforce', payload);
  return data;
};

export const getWorkforce = async (params?: { line_id?: number; date?: string }) => {
  const { data } = await apiClient.get('/workforce', { params });
  return data;
};
