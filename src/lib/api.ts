import { AUTH_API_URL, TOKEN_KEY } from "@/config/env";
import type { PodRole } from "@/lib/podRoles";

export interface AllowedUser {
  id?: string;
  username?: string;
  name?: string;
  primary_role?: string;
  permissions?: string[];
  podId?: string;
  podName?: string;
  podRole?: PodRole;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  phoneNumber?: string;
}

export interface ManagedPod {
  id: string;
  name: string;
  collegeName: string;
  clubs: string[];
  podLeader: string;
  podTalentManager: string;
  podOutreachManager: string;
  podResearcher: string;
  podPartnerManager: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FutureCraftApplicant {
  id: string;
  name: string;
  email: string;
  college: string;
  year: string;
  createdAt?: string | null;
  hasMatchingPod: boolean;
  matchingPodName?: string;
  matchingPodCollegeName?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.message || `Request failed (${res.status}).`);
  }
  return payload as T;
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loginWithCredentials(
  username: string,
  password: string,
  podId?: string,
  podRole?: PodRole,
): Promise<{ access_token: string; user: AllowedUser }> {
  if (!AUTH_API_URL) {
    throw new Error("Sign-in backend is not configured (VITE_AUTH_API_URL).");
  }

  const res = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: String(username || "").trim(),
      password: String(password || ""),
      ...(podId ? { podId } : {}),
      ...(podRole ? { podRole } : {}),
    }),
  });
  return parseResponse(res);
}

export async function listManagedUsers(): Promise<AllowedUser[]> {
  const res = await fetch(`${AUTH_API_URL}/users`, {
    headers: authHeaders(),
  });
  const payload = await parseResponse<{ users: AllowedUser[] }>(res);
  return payload.users || [];
}

export async function createManagedUser(input: {
  username: string;
  name: string;
  password: string;
  podId: string;
  podRole: PodRole;
}): Promise<AllowedUser> {
  const res = await fetch(`${AUTH_API_URL}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await parseResponse<{ user: AllowedUser }>(res);
  return payload.user;
}

export async function updateManagedUser(
  id: string,
  input: Partial<{ username: string; name: string; password: string; isActive: boolean; podId: string; podRole: PodRole }>,
): Promise<AllowedUser> {
  const res = await fetch(`${AUTH_API_URL}/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await parseResponse<{ user: AllowedUser }>(res);
  return payload.user;
}

export async function deleteManagedUser(id: string): Promise<void> {
  const res = await fetch(`${AUTH_API_URL}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || `Delete failed (${res.status}).`);
  }
}

export async function listManagedPods(): Promise<ManagedPod[]> {
  const res = await fetch(`${AUTH_API_URL}/pods`, {
    headers: authHeaders(),
  });
  const payload = await parseResponse<{ pods: ManagedPod[] }>(res);
  return payload.pods || [];
}

export async function listPublicPods(): Promise<ManagedPod[]> {
  const res = await fetch(`${AUTH_API_URL}/pods/public`);
  const payload = await parseResponse<{ pods: ManagedPod[] }>(res);
  return payload.pods || [];
}

export async function createManagedPod(input: {
  collegeName: string;
  podLeader: string;
  podTalentManager: string;
  podOutreachManager: string;
  podResearcher: string;
  podPartnerManager: string;
}): Promise<ManagedPod> {
  const res = await fetch(`${AUTH_API_URL}/pods`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await parseResponse<{ pod: ManagedPod }>(res);
  return payload.pod;
}

export async function updateManagedPod(
  id: string,
  input: Partial<{
    collegeName: string;
    podLeader: string;
    podTalentManager: string;
    podOutreachManager: string;
    podResearcher: string;
    podPartnerManager: string;
  }>,
): Promise<ManagedPod> {
  const res = await fetch(`${AUTH_API_URL}/pods/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await parseResponse<{ pod: ManagedPod }>(res);
  return payload.pod;
}

export async function deleteManagedPod(id: string): Promise<void> {
  const res = await fetch(`${AUTH_API_URL}/pods/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || `Delete failed (${res.status}).`);
  }
}

export async function listFutureCraftApplicants(): Promise<FutureCraftApplicant[]> {
  const res = await fetch(`${AUTH_API_URL}/future-crafts/applicants`, {
    headers: authHeaders(),
  });
  const payload = await parseResponse<{ applicants: FutureCraftApplicant[] }>(res);
  return payload.applicants || [];
}
