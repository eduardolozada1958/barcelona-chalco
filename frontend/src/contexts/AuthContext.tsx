import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as authApi from '@/api/auth';
import { STORAGE_KEYS } from '@utils/constants';

export type SessionRole = 'admin' | 'coach' | 'parent';

export interface SessionUser {
  id:       string;
  email:    string;
  role:     SessionRole;
  fullName: string;
}

interface AuthState {
  user:        SessionUser | null;
  loading:     boolean;
  login:       (email: string, password: string) => Promise<void>;
  register:    (body: authApi.RegisterParentBody) => Promise<authApi.RegisterParentResult>;
  logout:      () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function mapMeToUser(raw: Record<string, unknown>): SessionUser {
  return {
    id:       String(raw.id),
    email:    String(raw.email),
    role:     raw.role as SessionRole,
    fullName: String(raw.full_name ?? raw.fullName ?? ''),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser(mapMeToUser(res.data as Record<string, unknown>));
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (!res.success || !res.data) throw new Error(res.message ?? 'Error al iniciar sesión');
    const { accessToken, refreshToken, user: u } = res.data;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    setUser({
      id:       u.id,
      email:    u.email,
      role:     u.role as SessionRole,
      fullName: u.fullName ?? '',
    });
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  }, []);

  const register = useCallback(async (body: authApi.RegisterParentBody) => {
    const res = await authApi.registerParent(body);
    if (!res.success || !res.data) throw new Error(res.message ?? 'Error al registrarse');
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignorar */
    }
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
