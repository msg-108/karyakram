import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserPublic, JWTClaims } from '../types/auth.types';
import { RoleEnum } from '../types/common.types';
import { TOKEN_KEY } from '../config/constants';
import { setAccessToken, api } from '../lib/api';

export interface AuthContextValue {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: RoleEnum | null;
  isStaff: boolean;
  isApproved: boolean;
  setAuthData: (accessToken: string, refreshToken: string, user: UserPublic) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStaff, setIsStaff] = useState<boolean>(false);

  const setAuthData = useCallback((token: string, refreshToken: string, userData: UserPublic) => {
    setAccessTokenState(token);
    setAccessToken(token);
    localStorage.setItem(TOKEN_KEY, refreshToken);
    setUser(userData);

    try {
      const decoded = jwtDecode<JWTClaims>(token);
      setIsStaff(Boolean(decoded.is_staff));
    } catch {
      setIsStaff(false);
    }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(TOKEN_KEY);
    if (refreshToken) {
      api.post('/auth/logout/', { refresh_token: refreshToken }).catch(() => {
        // Silent catch logout error
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    setAccessTokenState(null);
    setAccessToken(null);
    setUser(null);
    setIsStaff(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<UserPublic>('/me/');
      setUser(data);
    } catch {
      // Failed to fetch current user profile
    }
  }, []);

  // Initialize auth state on mount using stored refresh token
  useEffect(() => {
    const initAuth = async () => {
      const storedRefreshToken = localStorage.getItem(TOKEN_KEY);
      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.post<{ access: string; refresh?: string }>('/auth/token/refresh/', {
          refresh: storedRefreshToken,
        });

        const newAccess = data.access;
        setAccessTokenState(newAccess);
        setAccessToken(newAccess);

        if (data.refresh) {
          localStorage.setItem(TOKEN_KEY, data.refresh);
        }

        try {
          const decoded = jwtDecode<JWTClaims>(newAccess);
          setIsStaff(Boolean(decoded.is_staff));
        } catch {
          setIsStaff(false);
        }

        const userRes = await api.get<UserPublic>('/me/');
        setUser(userRes.data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setAccessTokenState(null);
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const role = user?.role || null;
  const isApproved = user?.is_approved ?? false;
  const isAuthenticated = Boolean(user && accessToken);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        role,
        isStaff,
        isApproved,
        setAuthData,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
