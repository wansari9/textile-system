import apiClient from '../lib/client';

export const postQuality = async (payload: {
  customer_id: number;
  production_date: string;
  pcs_checked: number;
  pcs_faults: number;
}) => {
  const { data } = await apiClient.post('/quality', payload);
  return data;
};

export const getQuality = async (params?: any) => {
  const { data } = await apiClient.get('/quality', { params });
  return data;
};
