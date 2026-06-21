import apiClient from '../lib/client';

export const getBranches = async () => {
  const { data } = await apiClient.get('/branches');
  return data;
};

export const getBranchSummary = async (id: number, date?: string) => {
  const params = date ? { params: { date } } : {};
  const { data } = await apiClient.get(`/branches/${id}/summary`, params);
  return data;
};

export const upsertBranchDaily = async (id: number, payload: any) => {
  const { data } = await apiClient.post(`/branches/${id}/daily`, payload);
  return data;
};
