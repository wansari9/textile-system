import apiClient from '../lib/client';

export const getUsers = async () => {
  const { data } = await apiClient.get('/users');
  return data;
};

export const createUser = async (payload: {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role: string;
  assigned_line_id?: number;
}) => {
  const { data } = await apiClient.post('/users', payload);
  return data;
};

export const updateUser = async (id: number, payload: any) => {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data;
};

export const resetPassword = async (id: number, password: string) => {
  const { data } = await apiClient.put(`/users/${id}/password`, { password });
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
};
