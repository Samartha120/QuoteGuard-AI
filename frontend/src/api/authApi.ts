import api from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export { TOKEN_KEY, REFRESH_TOKEN_KEY } from './client';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/register', { name, email, password });
    return res.data;
  },

  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/google', { id_token: idToken });
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  updateProfile: async (name: string): Promise<AuthUser> => {
    const res = await api.patch<AuthUser>('/auth/me', { name });
    return res.data;
  },
};
