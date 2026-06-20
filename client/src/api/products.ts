import apiClient from '../lib/client';

export const getProducts = async () => {
  const { data } = await apiClient.get('/products');
  return data;
};