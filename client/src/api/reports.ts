import apiClient from '../lib/client';

export type ReportSort =
  | 'order_no'
  | 'customer'
  | 'product'
  | 'gender'
  | 'line'
  | 'produced'
  | 'defects'
  | 'target'
  | 'pct'
  | 'date';

export type SortDirection = 'asc' | 'desc';

export const getDailyReport = async (date: string, sort?: ReportSort, dir?: SortDirection) => {
  const params: Record<string, string> = { date };
  if (sort) {
    params.sort = sort;
    params.dir = dir ?? 'asc';
  }
  const { data } = await apiClient.get('/reports/daily', { params });
  return data;
};

export const getWeeklyReport = async (
  start: string,
  end: string,
  sort?: ReportSort,
  dir?: SortDirection
) => {
  const params: Record<string, string> = { start, end };
  if (sort) {
    params.sort = sort;
    params.dir = dir ?? 'asc';
  }
  const { data } = await apiClient.get('/reports/weekly', { params });
  return data;
};

export const getMonthlyReport = async (
  month: string,
  sort?: ReportSort,
  dir?: SortDirection
) => {
  const params: Record<string, string> = { month };
  if (sort) {
    params.sort = sort;
    params.dir = dir ?? 'asc';
  }
  const { data } = await apiClient.get('/reports/monthly', { params });
  return data;
};

export const getOverviewReport = async (date: string) => {
  const { data } = await apiClient.get('/reports/overview', { params: { date } });
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
