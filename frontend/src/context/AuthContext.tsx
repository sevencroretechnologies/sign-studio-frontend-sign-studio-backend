import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/api';

/**
 * Mirrors the `dashboard` object returned by the backend on login / profile.
 * The frontend must never compute these values — it only reads them.
 */
interface DashboardConfig {
  /** Whether to render the My Dashboard tab. */
  show_my_dashboard: boolean;
  /** Whether to render the Admin Dashboard tab. */
  show_admin_dashboard: boolean;
  /** Which tab key should be active on first load ('staff' | 'admin'). */
  default_dashboard: 'staff' | 'admin';
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  roles: string[];
  permissions: string[];
  primary_role: string;
  primary_role_icon: string;
  primary_role_hierarchy: number;
  /** Complete dashboard layout config — computed by the backend, consumed as-is by the frontend. */
  dashboard: DashboardConfig;
  staff_member_id?: number;
  org_id?: number;
  company_id?: number;
  organization_name?: string;
  company_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data.data;

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authService.getProfile();
      const userData = response.data.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [token]);

  const hasAdminRoleString = user?.roles?.some(r => typeof r === 'string' ? r.toLowerCase().includes('admin') : false) ?? false;
  const isAdmin = user?.dashboard?.show_admin_dashboard || hasAdminRoleString || (user?.primary_role_hierarchy ? user.primary_role_hierarchy <= 2 : false);

  const hasPermission = (permission: string) => {
    // Admin users have all permissions
    if (isAdmin) {
      return true;
    }
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isLoading,
        login,
        logout,
        refreshUser,
        hasPermission,
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
