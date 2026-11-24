import type { SessionUser } from '../domain';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getSessionUser = (): SessionUser | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as SessionUser) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token: string, user: SessionUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
