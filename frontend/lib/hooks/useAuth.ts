"use client";

import { useEffect, useState } from "react";

import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  decodeAccessToken,
  getAccessToken,
  getStoredAuthUser,
  isTokenExpired,
} from "@/lib/utils/permissions";

interface AuthState {
  userId: number | null;
  roles: string[];
  firstName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState & { logout: () => void } {
  const [state, setState] = useState<AuthState>({
    userId: null,
    roles: [],
    firstName: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = getAccessToken();
    const payload = token ? decodeAccessToken(token) : null;
    const storedUser = getStoredAuthUser();

    if (!payload || isTokenExpired(payload)) {
      setState({
        userId: null,
        roles: [],
        firstName: storedUser?.firstName ?? null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    setState({
      userId: payload.sub,
      roles: payload.roles,
      firstName: payload.firstName || storedUser?.firstName || null,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setState({
      userId: null,
      roles: [],
      firstName: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return { ...state, logout };
}
