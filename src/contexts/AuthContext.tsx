import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { exchangePhoneForToken, type AllowedUser } from "@/lib/api";
import { isFirebaseAuthEnabled, POD_USER_ROLE, TOKEN_KEY, USER_KEY } from "@/config/env";

type StatusType = "" | "success" | "error" | "info";
export interface AuthStatus {
  message: string;
  type: StatusType;
}

interface AuthContextValue {
  isAuthenticating: boolean;
  user: AllowedUser | null;
  isAuthenticated: boolean;
  isFirebaseEnabled: boolean;
  status: AuthStatus;
  otpStepVisible: boolean;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string, phone: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  resetOtp: () => void;
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

function formatFirebaseError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const code = e?.code || "";
  const message = e?.message || "Phone sign-in could not be initialized.";
  if (code === "auth/invalid-api-key" || /invalid-api-key/i.test(message)) {
    return "Firebase rejected the API key for this origin. Add this origin to the Firebase browser API key's HTTP referrers.";
  }
  return code ? `${message} (${code})` : message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<AllowedUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>({ message: "", type: "" });
  const [otpStepVisible, setOtpStepVisible] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const isFirebaseEnabled = isFirebaseAuthEnabled() && Boolean(auth);

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
    setUser(stored);
    setIsAuthenticating(false);
  }, []);

  const clearRecaptcha = () => {
    recaptchaRef.current?.clear?.();
    recaptchaRef.current = null;
  };

  const ensureRecaptcha = useCallback(async ({ reset = false } = {}) => {
    if (!auth) throw new Error("Firebase auth did not initialize.");
    if (reset) clearRecaptcha();
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "firebaseRecaptchaHost", {
        size: "invisible",
      });
    }
    await recaptchaRef.current.render();
    return recaptchaRef.current;
  }, []);

  const applySession = useCallback((data: { access_token: string; user: AllowedUser }) => {
    write(TOKEN_KEY, data.access_token);
    write(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const sendOtp = useCallback(
    async (phone: string) => {
      const digits = phone.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
      if (digits.length !== 10) {
        setStatus({ message: "Enter a full 10-digit phone number.", type: "error" });
        return;
      }
      if (!isFirebaseEnabled || !auth) {
        setStatus({
          message: "Phone sign-in is unavailable — set VITE_FIREBASE_* keys, or continue in demo mode.",
          type: "error",
        });
        return;
      }
      setIsSendingOtp(true);
      setOtpStepVisible(false);
      confirmationRef.current = null;
      setStatus({ message: "Sending code…", type: "info" });
      try {
        const verifier = await ensureRecaptcha({ reset: true });
        confirmationRef.current = await signInWithPhoneNumber(auth, `+91${digits}`, verifier);
        setOtpStepVisible(true);
        setStatus({ message: "Code sent. Check your phone.", type: "success" });
      } catch (error) {
        confirmationRef.current = null;
        clearRecaptcha();
        setStatus({ message: formatFirebaseError(error), type: "error" });
      } finally {
        setIsSendingOtp(false);
      }
    },
    [ensureRecaptcha, isFirebaseEnabled],
  );

  const verifyOtp = useCallback(
    async (otp: string, phone: string) => {
      const code = otp.replace(/\D/g, "").slice(0, 6);
      if (!confirmationRef.current) {
        setStatus({ message: "Request a code first.", type: "error" });
        return;
      }
      if (code.length !== 6) {
        setStatus({ message: "Enter the full 6-digit code.", type: "error" });
        return;
      }
      setIsVerifyingOtp(true);
      setStatus({ message: "Verifying…", type: "info" });
      try {
        const credential = await confirmationRef.current.confirm(code);
        const digits = phone.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
        const verifiedPhone = credential.user?.phoneNumber || `+91${digits}`;
        const data = await exchangePhoneForToken(verifiedPhone);
        applySession(data);
        setStatus({ message: `Welcome. Signed in as ${verifiedPhone}.`, type: "success" });
      } catch (error) {
        setStatus({ message: formatFirebaseError(error), type: "error" });
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [applySession],
  );

  const loginDemo = useCallback(() => {
    // Local-only session for offline/demo use (no chronos token). Marked so the
    // app can tell a demo session apart from a real one.
    const demoUser: AllowedUser = {
      phoneNumber: "+91 00000 00000",
      name: "Demo Pod Lead",
      primary_role: POD_USER_ROLE,
    };
    const fakeToken = `demo.${btoa(JSON.stringify({ demo: true }))}.local`;
    write(TOKEN_KEY, fakeToken);
    write(USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setStatus({ message: "Signed in to demo mode.", type: "success" });
  }, []);

  const logout = useCallback(() => {
    remove(TOKEN_KEY);
    remove(USER_KEY);
    setUser(null);
    setOtpStepVisible(false);
    confirmationRef.current = null;
    setStatus({ message: "", type: "" });
    if (auth) void signOut(auth).catch(() => {});
  }, []);

  const resetOtp = useCallback(() => {
    setOtpStepVisible(false);
    confirmationRef.current = null;
    setStatus({ message: "", type: "" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticating,
      user,
      isAuthenticated: Boolean(user),
      isFirebaseEnabled,
      status,
      otpStepVisible,
      isSendingOtp,
      isVerifyingOtp,
      sendOtp,
      verifyOtp,
      loginDemo,
      logout,
      resetOtp,
    }),
    [
      isAuthenticating,
      user,
      isFirebaseEnabled,
      status,
      otpStepVisible,
      isSendingOtp,
      isVerifyingOtp,
      sendOtp,
      verifyOtp,
      loginDemo,
      logout,
      resetOtp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
