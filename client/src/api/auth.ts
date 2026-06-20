import apiClient from '../lib/client';

export const login = async (credentials: any) => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};