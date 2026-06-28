import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginWithCredentials, type AllowedUser } from "@/lib/api";
import { TOKEN_KEY, USER_KEY } from "@/config/env";

type StatusType = "" | "success" | "error" | "info";
export interface AuthStatus {
  message: string;
  type: StatusType;
}

interface AuthContextValue {
  isAuthenticating: boolean;
  user: AllowedUser | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  isSigningIn: boolean;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearStatus: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function read(key: string) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenValid(token: string) {
  const payload = decodeJwt(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return (payload.exp as number) * 1000 > Date.now();
}

function isAdminUser(user: AllowedUser | null) {
  if (!user) return false;
  return user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<AllowedUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>({ message: "", type: "" });
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const token = read(TOKEN_KEY);
    if (!token || !isTokenValid(token)) {
      remove(TOKEN_KEY);
      remove(USER_KEY);
      setUser(null);
      setIsAuthenticating(false);
      return;
    }

    const raw = read(USER_KEY);
    let stored: AllowedUser | null = null;
    try {
      stored = raw ? (JSON.parse(raw) as AllowedUser) : null;
    } catch {
      stored = null;
    }

    if (!isAdminUser(stored)) {
      remove(TOKEN_KEY);
      remove(USER_KEY);
      setUser(null);
      setIsAuthenticating(false);
      return;
    }

    setUser(stored);
    setIsAuthenticating(false);
  }, []);

  const applySession = useCallback((data: { access_token: string; user: AllowedUser }) => {
    write(TOKEN_KEY, data.access_token);
    write(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      const normalizedUsername = String(username || "").trim();
      const normalizedPassword = String(password || "");

      if (!normalizedUsername || !normalizedPassword) {
        setStatus({ message: "Enter both username and password.", type: "error" });
        return;
      }

      setIsSigningIn(true);
      setStatus({ message: "Signing in…", type: "info" });
      try {
        const data = await loginWithCredentials(normalizedUsername, normalizedPassword);
        if (!isAdminUser(data.user)) {
          setStatus({ message: "This account does not have admin dashboard access.", type: "error" });
          remove(TOKEN_KEY);
          remove(USER_KEY);
          setUser(null);
          return;
        }
        applySession(data);
        setStatus({ message: `Welcome back, ${data.user.name || data.user.username || "admin"}.`, type: "success" });
      } catch (error) {
        setStatus({
          message: error instanceof Error ? error.message : "Sign-in failed.",
          type: "error",
        });
      } finally {
        setIsSigningIn(false);
      }
    },
    [applySession],
  );

  const logout = useCallback(() => {
    remove(TOKEN_KEY);
    remove(USER_KEY);
    setUser(null);
    setStatus({ message: "", type: "" });
  }, []);

  const clearStatus = useCallback(() => {
    setStatus({ message: "", type: "" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticating,
      user,
      isAuthenticated: Boolean(user),
      status,
      isSigningIn,
      loginWithCredentials: handleLogin,
      logout,
      clearStatus,
    }),
    [isAuthenticating, user, status, isSigningIn, handleLogin, logout, clearStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
