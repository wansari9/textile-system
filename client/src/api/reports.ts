import apiClient from '../lib/client';

export const getDailyReport = async (date: string) => {
  const { data } = await apiClient.get(`/reports/daily?date=${date}`);
  return data;
};

// ... other report API calls (weekly, products, efficiency)