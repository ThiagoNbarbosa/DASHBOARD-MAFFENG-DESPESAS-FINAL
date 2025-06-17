import { apiRequest } from './queryClient';
import type { User, LoginData } from '@shared/schema';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const authApi = {
  login: async (credentials: LoginData): Promise<AuthUser> => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout');
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    } catch (error) {
      return null;
    }
  },
};
