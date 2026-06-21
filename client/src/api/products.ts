import apiClient from '../lib/client';

export const getProducts = async (params?: { customer_id?: number; status?: string }) => {
  const { data } = await apiClient.get('/products', { params });
  return data;
};

export const getProduct = async (id: number) => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
};

export const getProductsByCustomer = async (customerId: number) => {
  const { data } = await apiClient.get(`/products/customer/${customerId}`);
  return data;
};

export const createProduct = async (payload: {
  customer_id: number;
  product_name: string;
  style_code?: string;
  color?: string;
  size?: string;
  order_quantity: number;
  daily_target: number;
  status?: string;
  start_date?: string;
  due_date?: string;
}) => {
  const { data } = await apiClient.post('/products', payload);
  return data;
};

export const updateProduct = async (id: number, payload: any) => {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: number) => {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data;
};
