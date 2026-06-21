import apiClient from '../lib/client';

export const getLines = async () => {
  const { data } = await apiClient.get('/lines');
  return data;
};

export const getLine = async (id: number) => {
  const { data } = await apiClient.get(`/lines/${id}`);
  return data;
};

export const getLineCurrent = async (id: number) => {
  const { data } = await apiClient.get(`/lines/${id}/current`);
  return data;
};

export const assignProduct = async (id: number, payload: any) => {
  const { data } = await apiClient.post(`/lines/${id}/assign`, payload);
  return data;
};

export const createLine = async (payload: { branch_id: number; line_name: string; status?: string }) => {
  const { data } = await apiClient.post('/lines', payload);
  return data;
};

export const updateLine = async (id: number, payload: { branch_id?: number; line_name?: string; status?: string }) => {
  const { data } = await apiClient.put(`/lines/${id}`, payload);
  return data;
};
