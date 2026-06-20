import apiClient from '../lib/client';

export const getLines = async () => {
  const { data } = await apiClient.get('/lines');
  return data;
};