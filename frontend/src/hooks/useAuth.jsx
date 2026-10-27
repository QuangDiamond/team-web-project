import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true cho đến khi biết user đã đăng nhập hay chưa (gọi /me lúc mở app)
  const [initializing, setInitializing] = useState(true);

  // Lấy lại user từ cookie khi F5 trang
  useEffect(() => {
    authService.me()
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  // Trả về error (có status, errors) để page tự xử lý, vd: 403 chưa kích hoạt
  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  // Đăng ký xong chưa đăng nhập, phải kích hoạt email trước
  const register = useCallback(async (data) => {
    try {
      await authService.register(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  const completeGoogleRegister = useCallback(async (data) => {
    try {
      const response = await authService.completeGoogleRegister(data);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = { user, initializing, login, register, completeGoogleRegister, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
