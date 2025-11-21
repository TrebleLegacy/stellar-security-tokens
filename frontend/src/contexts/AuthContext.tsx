import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LoginResponse } from '@/types';

interface AuthContextType {
  token: string | null;
  user: LoginResponse | null;
  login: (response: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  role: 'investor' | 'company' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Token é uma string simples, não precisa de JSON.parse/stringify
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  
  const [user, setUser] = useLocalStorage<LoginResponse | null>('user', null);

  const setToken = (value: string | null) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
  };

  const login = (response: LoginResponse) => {
    setToken(response.token);
    setUser(response);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

