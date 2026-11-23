import apiClient from '../lib/client';

export interface NewOrderCustomer {
  customer_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface NewOrderPayload {
  customer_id?: number;
  customer?: NewOrderCustomer;
  product_name: string;
  style_code?: string;
  color?: string;
  size?: string;
  gender?: string;
  order_quantity: number;
  daily_target: number;
  status?: string;
  start_date?: string;
  due_date?: string;
  order_date?: string;
  assign?: {
    line_id: number;
    daily_target?: number;
    start_date?: string;
  };
}

export const getOrders = async (params?: {
  status?: string;
  customer_id?: number;
  line_id?: number;
  from?: string;
  to?: string;
  search?: string;
}) => {
  const { data } = await apiClient.get('/orders', { params });
  return data;
};

export const getOrder = async (id: number) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
};

export const createOrder = async (payload: NewOrderPayload) => {
  const { data } = await apiClient.post('/orders', payload);
  return data;
};
