import apiClient from '../lib/client';

export const getDailyReport = async (date: string) => {
  const { data } = await apiClient.get(`/reports/daily?date=${date}`);
  return data;
};

export const getWeeklyReport = async (start: string, end: string) => {
  const { data } = await apiClient.get(`/reports/weekly?start=${start}&end=${end}`);
  return data;
};

export const getCustomerReport = async (customerId: number) => {
  const { data } = await apiClient.get(`/reports/customer/${customerId}`);
  return data;
};

export const getLineReport = async (lineId: number, from: string, to: string) => {
  const { data } = await apiClient.get(`/reports/line/${lineId}?from=${from}&to=${to}`);
  return data;
};

export const getEfficiencyReport = async (params?: { line_id?: number; from?: string; to?: string }) => {
  const { data } = await apiClient.get('/reports/efficiency', { params });
  return data;
};

export const getCompanyReport = async (params?: { date?: string; from?: string; to?: string }) => {
  const { data } = await apiClient.get('/reports/company', { params });
  return data;
};
