import { useContext, useState, useCallback, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.js';
import * as authService from '../services/authService.js';
import { setAccountLockedHandler, setSessionExpiredHandler } from '../services/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // true cho đến khi biết user đã đăng nhập hay chưa (gọi /me lúc mở app)
  const [initializing, setInitializing] = useState(true);
  // true sau khi user tự bấm Log out: PrivateRoute không ghi nhớ trang cũ, lần đăng nhập sau về /dashboard
  const [loggedOutByUser, setLoggedOutByUser] = useState(false);
  // true khi API báo tài khoản bị khóa (lúc mở app hoặc đang dùng, UC37, D19):
  // màn /login hiện thông báo khóa và PrivateRoute không nhớ trang cũ
  const [accountLockedOnStart, setAccountLockedOnStart] = useState(false);

  // Bất kỳ request nào trả 403 "tài khoản bị khóa" -> xóa user, PrivateRoute tự đưa về /login (UC37-B3)
  useEffect(() => {
    setAccountLockedHandler(() => {
      setAccountLockedOnStart(true);
      setUser(null);
    });
    setSessionExpiredHandler(() => setUser(null));
    return () => {
      setAccountLockedHandler(null);
      setSessionExpiredHandler(null);
    };
  }, []);

  // Lấy lại user từ cookie khi F5 trang
  useEffect(() => {
    authService.me()
      .then((response) => {
        setUser(response.data);
        try {
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch {}
      })
      .catch(() => {
        // 403 tài khoản bị khóa đã được handler ở trên xử lý
        setUser(null);
        try {
          localStorage.removeItem('user');
        } catch {}
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  // Trả về error (có status, errors) để page tự xử lý, vd: 403 chưa kích hoạt
  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setLoggedOutByUser(false);
      setAccountLockedOnStart(false);
      const userData = response.data;
      setUser(userData);
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {}
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  // Đăng ký xong chưa đăng nhập, phải kích hoạt email trước
  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data);
      const userData = response?.data?.user || response?.data;
      if (userData) {
        setUser(userData);
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {}
      }
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  const completeGoogleRegister = useCallback(async (data) => {
    try {
      const response = await authService.completeGoogleRegister(data);
      setLoggedOutByUser(false);
      const userData = response.data;
      setUser(userData);
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {}
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setLoggedOutByUser(true);
      setUser(null);
      try {
        localStorage.removeItem('user');
      } catch {}
    }
  }, []);

  // Gọi khi màn /login đã hiện (sau Log out hoặc bị khóa): chỉ lần chuyển trang đó mới không nhớ trang cũ (D2-B2).
  // Màn /login đã đọc accountLockedOnStart lúc mở nên xóa được luôn
  const clearLoggedOutByUser = useCallback(() => {
    setLoggedOutByUser(false);
    setAccountLockedOnStart(false);
  }, []);

  const resetPassword = useCallback(async (data) => {
    await authService.resetPassword(data);
    setLoggedOutByUser(true);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (data) => {
    const response = await authService.changePassword(data);
    setUser(response.data);
  }, []);

  const updateAvatarUrl = useCallback((avatarUrl) => {
    setUser((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, avatar_url: avatarUrl };
      try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const value = { user, initializing, loggedOutByUser, clearLoggedOutByUser, accountLockedOnStart, login, register, completeGoogleRegister, logout, resetPassword, changePassword, updateAvatarUrl };

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
