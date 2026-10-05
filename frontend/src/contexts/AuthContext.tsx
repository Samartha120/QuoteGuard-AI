import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/authApi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // On mount, we just try to fetch the user. The cookie will be sent automatically.
  // If it fails (401), the user is not authenticated.
  useEffect(() => {
    authApi
      .getMe()
      .then((me) => setUser(me))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    // User is NOT set yet. OTP must be verified next.
  };

  const verifyLoginOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyLoginOtp(email, otp);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password);
    // User is NOT set yet. OTP must be verified next.
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyOtp(email, otp);
    setUser(res.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await authApi.googleLogin(idToken);
    setUser(res.user);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, verifyLoginOtp, register, verifyOtp, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
