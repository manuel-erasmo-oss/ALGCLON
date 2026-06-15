import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((data) => {
          setUser(data.user || data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const token = data.token || data.access_token;
    if (token) {
      localStorage.setItem('token', token);
    }
    const userData = data.user || data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await apiRegister(formData);
    const token = data.token || data.access_token;
    if (token) {
      localStorage.setItem('token', token);
    }
    const userData = data.user || data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
