"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "./api";

interface UserData {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  community_status: string;
  kudos_points: number;
  follower_count: number;
  following_count: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    isVerified: boolean
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ds_token");
}

function getStoredUser(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ds_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setToken(getStoredToken());
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{
      access_token: string;
      user: UserData;
    }>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("ds_token", res.access_token);
    localStorage.setItem("ds_user", JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      isVerified: boolean
    ) => {
      const res = await apiFetch<{
        access_token: string;
        user: UserData;
      }>("/users/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
          is_verified: isVerified,
        }),
      });
      localStorage.setItem("ds_token", res.access_token);
      localStorage.setItem("ds_user", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await apiFetch<UserData>("/users/me");
      localStorage.setItem("ds_user", JSON.stringify(fresh));
      setUser(fresh);
    } catch {
      // silently fail — user will see stale data
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ds_token");
    localStorage.removeItem("ds_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
