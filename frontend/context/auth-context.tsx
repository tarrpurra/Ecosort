import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiService } from '../utils/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await apiService.initializeToken();
        setIsAuthenticated(!!token);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (token: string) => {
    await apiService.setToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await apiService.clearToken();
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout }),
    [isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
