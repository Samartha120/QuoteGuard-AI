import api from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id?: string;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface OTPResponse {
  message: string;
  email: string;
}



export const authApi = {
  login: async (email: string, password: string): Promise<OTPResponse> => {
    const res = await api.post<OTPResponse>('/auth/login', { email, password });
    return res.data;
  },

  verifyLoginOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/verify-login-otp', { email, otp });
    return res.data;
  },

  register: async (name: string, email: string, password: string): Promise<OTPResponse> => {
    const res = await api.post<OTPResponse>('/auth/register', { name, email, password });
    return res.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/verify-otp', { email, otp });
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

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
