import apiClient from '../lib/client';

export const logHourlyProduction = async (payload: any) => {
  const { data } = await apiClient.post('/production/hourly', payload);
  return data;
};