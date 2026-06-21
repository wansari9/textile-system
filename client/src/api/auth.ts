import apiClient from '../lib/client';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: 'ADMIN' | 'SUPERVISOR';
    line_id: number | null;
  };
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};
