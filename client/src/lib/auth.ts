import { apiRequest } from './queryClient';
import type { User, LoginData, SignUpData } from '@shared/schema';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const authApi = {
  login: async (credentials: LoginData): Promise<AuthUser> => {
    return await apiRequest('/api/auth/login', 'POST', credentials);
  },

  signup: async (userData: SignUpData): Promise<AuthUser> => {
    return await apiRequest('/api/auth/signup', 'POST', userData);
  },

  logout: async (): Promise<void> => {
    await apiRequest('/api/auth/logout', 'POST');
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      return await apiRequest('/api/auth/me', 'GET');
    } catch (error) {
      return null;
    }
  },
};
