import { TOKEN_KEY } from "@/lib/constants";
import type { PodRoleApi } from "@/lib/podRoles";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export interface AllowedUser {
  id?: string;
  username?: string;
  name?: string;
  primary_role?: string;
  permissions?: string[];
  podId?: string;
  podName?: string;
  podRole?: PodRoleApi;
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

export interface College {
  id: string;
  name: string;
  crew: string;
  isPod: boolean;
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

function apiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as { error?: { message?: string }; message?: string };
  return record.error?.message || record.message || fallback;
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as { data?: T };
  return record.data !== undefined ? record.data : (payload as T);
}

function unwrapList<T>(payload: unknown, key: string): T[] {
  const data = unwrapData<unknown>(payload);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && key in data) {
    const list = (data as Record<string, unknown>)[key];
    return Array.isArray(list) ? (list as T[]) : [];
  }
  if (payload && typeof payload === "object" && key in payload) {
    const list = (payload as Record<string, unknown>)[key];
    return Array.isArray(list) ? (list as T[]) : [];
  }
  return [];
}

function unwrapEntity<T>(payload: unknown, key: string): T {
  const data = unwrapData<unknown>(payload);
  if (data && typeof data === "object" && key in data) {
    return (data as Record<string, T>)[key];
  }
  if (payload && typeof payload === "object" && key in payload) {
    return (payload as Record<string, T>)[key];
  }
  if (data && typeof data === "object" && "id" in data) {
    return data as T;
  }
  throw new Error("Response was incomplete.");
}

function normalizeCollege(college: Partial<College> & { _id?: string }): College {
  const id = college.id || college._id || "";
  return {
    id,
    name: college.name || "",
    crew: college.crew || "",
    isPod: Boolean(college.isPod),
    createdAt: college.createdAt,
    updatedAt: college.updatedAt,
  };
}

function normalizeColleges(colleges: unknown): College[] {
  return unwrapList<Partial<College> & { _id?: string }>(colleges, "colleges").map(normalizeCollege);
}

async function readJson(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Backend is not configured (VITE_API_BASE_URL).");
  }
}

async function requestJson(path: string, options: RequestInit = {}) {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Request failed (${res.status}).`));
  }
  return payload;
}

export async function loginWithCredentials(
  username: string,
  password: string,
  podId?: string,
  podRole?: PodRoleApi,
): Promise<{ access_token: string; user: AllowedUser }> {
  ensureApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: String(username || "").trim(),
      password: String(password || ""),
      ...(podId ? { podId } : {}),
      ...(podRole ? { podRole } : {}),
    }),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Sign-in failed (${res.status}).`));
  }

  const data = unwrapData<{ access_token: string; user: AllowedUser }>(payload);
  if (!data?.access_token || !data?.user) {
    throw new Error("Sign-in response was incomplete.");
  }

  return data;
}

export async function listManagedUsers(): Promise<AllowedUser[]> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: authHeaders(),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not load users (${res.status}).`));
  }
  return unwrapList<AllowedUser>(payload, "users");
}

export async function createManagedUser(input: {
  username: string;
  name: string;
  password: string;
  podId: string;
  podRole: PodRoleApi;
}): Promise<AllowedUser> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not create user (${res.status}).`));
  }
  return unwrapEntity<AllowedUser>(payload, "user");
}

export async function updateManagedUser(
  id: string,
  input: Partial<{ username: string; name: string; password: string; isActive: boolean; podId: string; podRole: PodRoleApi }>,
): Promise<AllowedUser> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not update user (${res.status}).`));
  }
  return unwrapEntity<AllowedUser>(payload, "user");
}

export async function deleteManagedUser(id: string): Promise<void> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const payload = await readJson(res);
    throw new Error(apiErrorMessage(payload, `Delete failed (${res.status}).`));
  }
}

export async function listManagedPods(): Promise<ManagedPod[]> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/pods`, {
    headers: authHeaders(),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not load pods (${res.status}).`));
  }
  return unwrapList<ManagedPod>(payload, "pods");
}

export async function listPublicPods(): Promise<ManagedPod[]> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/pods/public`);
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not load pods (${res.status}).`));
  }
  return unwrapList<ManagedPod>(payload, "pods");
}

export async function createManagedPod(input: {
  collegeName: string;
  podLeader: string;
  podTalentManager: string;
  podOutreachManager: string;
  podResearcher: string;
  podPartnerManager: string;
}): Promise<ManagedPod> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/pods`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not create pod (${res.status}).`));
  }
  return unwrapEntity<ManagedPod>(payload, "pod");
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
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/pods/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not update pod (${res.status}).`));
  }
  return unwrapEntity<ManagedPod>(payload, "pod");
}

export async function deleteManagedPod(id: string): Promise<void> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/pods/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const payload = await readJson(res);
    throw new Error(apiErrorMessage(payload, `Delete failed (${res.status}).`));
  }
}

export async function listFutureCraftApplicants(): Promise<FutureCraftApplicant[]> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/future-crafts/applicants`, {
    headers: authHeaders(),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not load applicants (${res.status}).`));
  }
  return unwrapList<FutureCraftApplicant>(payload, "applicants");
}

export async function listColleges(): Promise<College[]> {
  const payload = await requestJson("/colleges");
  return normalizeColleges(payload);
}

export async function createCollege(input: {
  name: string;
  crew: string;
  isPod: boolean;
}): Promise<College> {
  const payload = await requestJson("/colleges", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeCollege(unwrapEntity<Partial<College> & { _id?: string }>(payload, "college"));
}

export async function updateCollege(
  id: string,
  input: { name: string; crew: string; isPod: boolean },
): Promise<College> {
  const payload = await requestJson(`/colleges/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalizeCollege(unwrapEntity<Partial<College> & { _id?: string }>(payload, "college"));
}

export async function deleteCollege(id: string): Promise<void> {
  await requestJson(`/colleges/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
