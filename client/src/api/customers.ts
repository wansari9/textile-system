import apiClient from '../lib/client';

export const getCustomers = async () => {
  const { data } = await apiClient.get('/customers');
  return data;
};