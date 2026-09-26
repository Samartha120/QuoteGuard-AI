import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load user from localStorage or use default
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('axion_user');
    if (saved) return JSON.parse(saved);
    return {
      id: 'usr_abc123',
      name: 'Samartha Shrestha',
      email: 'samartha@axion-ai.com',
      role: 'Administrator',
    };
  });

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('axion_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('axion_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, updateUser }}>
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
