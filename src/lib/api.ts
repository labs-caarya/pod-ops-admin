import { CHRONOS_BE_URL, POD_REQUIRED_PASS, REQUIRE_POD_PASS } from "@/config/env";

/**
 * chronos-be is used ONLY for the sign-in token exchange (mirrors
 * chirag-sandbox `exchangePhoneForToken`). After Firebase verifies the phone,
 * we ask chronos-be whether the number is an allowed user and get back a JWT.
 */
export interface AllowedUser {
  phoneNumber: string;
  name?: string;
  email?: string;
  primary_role?: string;
}

export async function exchangePhoneForToken(
  verifiedPhoneNumber: string,
): Promise<{ access_token: string; user: AllowedUser }> {
  if (!CHRONOS_BE_URL) {
    throw new Error("Sign-in backend is not configured (VITE_CHRONOS_BE_URL).");
  }

  const url = new URL(
    `${CHRONOS_BE_URL}/admin/allowed-users/${encodeURIComponent(verifiedPhoneNumber)}/check`,
  );
  if (REQUIRE_POD_PASS) {
    url.searchParams.set("requiredPass", POD_REQUIRED_PASS);
  }

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message || `Sign-in failed (${res.status}).`);
  }

  const data = payload?.data || payload || {};
  if (!data.exists || !data.token) {
    throw new Error(
      REQUIRE_POD_PASS
        ? "This number isn't authorized for pod-ops access."
        : "This number isn't on the allowed-users list.",
    );
  }

  return {
    access_token: data.token,
    user: { phoneNumber: verifiedPhoneNumber, ...(data.user || {}) },
  };
}
