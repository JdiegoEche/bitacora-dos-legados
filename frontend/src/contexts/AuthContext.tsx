import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { setAuthToken, clearAuthToken, authApi } from '../api/client';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('bitacora-auth-token');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if token exists, validate it via authApi.me()
  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setAuthToken(storedToken);

    authApi.me()
      .then((userData) => {
        setUser(userData);
        setIsLoading(false);
      })
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem('bitacora-auth-token');
        setToken(null);
        setAuthToken(null);
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string): Promise<void> => {
    // Clear stale cached data from previous session
    queryClient.clear();

    const data = await authApi.login(email);

    // Store JWT and load user profile
    const jwt = data.token;
    localStorage.setItem('bitacora-auth-token', jwt);
    setToken(jwt);
    setAuthToken(jwt);

    const userData = await authApi.me();
    setUser(userData);
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem('bitacora-auth-token');
    setUser(null);
    setToken(null);
    clearAuthToken();
    queryClient.clear();
  }, [queryClient]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
