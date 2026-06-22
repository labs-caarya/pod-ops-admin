/** Runtime configuration.
 *
 *  Auth mirrors chirag-sandbox: Firebase phone OTP -> exchange the verified
 *  phone for a chronos-be JWT via `/admin/allowed-users/{phone}/check`. The
 *  ONLY thing chronos-be is used for is that sign-in token exchange. All
 *  feature data (research, rolodex, talent, jobs, partners) is this app's own,
 *  stored locally until/unless a dedicated backend is wired. */

const env = import.meta.env;

function envBool(value: unknown, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return String(value).trim().toLowerCase() === "true";
}

function isPlaceholder(value: string) {
  return !value || /^YOUR_/.test(value.trim());
}

/** chronos-be (moksha-be) base, incl. /api suffix. Used only for the sign-in
 *  token exchange. */
export const CHRONOS_BE_URL: string =
  (env.VITE_CHRONOS_BE_URL as string) || "";

/** chirag-ai LLM proxy base (optional) for the "Ask Moksha" agent. */
export const AI_URL: string = (env.VITE_AI_URL as string) || "";

/** When true, sign-in requires an IAM pass (CaaryaPass) on chronos-be. */
export const REQUIRE_POD_PASS: boolean = envBool(env.VITE_REQUIRE_POD_PASS, false);
export const POD_REQUIRED_PASS: string =
  (env.VITE_POD_REQUIRED_PASS as string) || "pod-ops-access";

export const POD_USER_ROLE: string =
  (env.VITE_POD_USER_ROLE as string) || "role_pod_member";

export const ENABLE_FIREBASE_AUTH: boolean = envBool(env.VITE_ENABLE_FIREBASE_AUTH, true);

export const FIREBASE = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string) || "",
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || "",
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string) || "",
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string) || "",
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "",
  appId: (env.VITE_FIREBASE_APP_ID as string) || "",
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID as string) || "",
};

const FIREBASE_REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"] as const;

export function getFirebaseConfig() {
  const usable = FIREBASE_REQUIRED_KEYS.every((k) => !isPlaceholder(FIREBASE[k]));
  return usable ? FIREBASE : null;
}

export function isFirebaseAuthEnabled() {
  return ENABLE_FIREBASE_AUTH && Boolean(getFirebaseConfig());
}

export const TOKEN_KEY = "podops.token";
export const USER_KEY = "podops.user";
