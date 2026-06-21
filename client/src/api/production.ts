import apiClient from '../lib/client';

export const logHourlyProduction = async (payload: {
  assignment_id: number;
  line_id: number;
  product_id: number;
  production_date: string;
  hour_number: number;
  qty_produced: number;
  qty_defect: number;
}) => {
  const { data } = await apiClient.post('/production/hourly', payload);
  return data;
};

export const getHourlyProduction = async (date: string) => {
  const { data } = await apiClient.get(`/production/hourly?date=${date}`);
  return data;
};
