import { TOKEN_KEY } from "@/lib/constants";
import { normalizeLeaderGoal } from "@/lib/leaderGoals";
import { normalizeMentor } from "@/lib/mentors";
import type { PodActivationArtifact, PodActivationProgress } from "@/lib/podActivation/types";
import type { PodRoleApi } from "@/lib/podRoles";
import type { Challenge, PodLeaderGoal, PodMentor } from "@/lib/types";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export interface AllowedUser {
  id?: string;
  username?: string;
  name?: string;
  primary_role?: string;
  permissions?: string[];
  collegeId?: string;
  collegeName?: string;
  collegeCrew?: string;
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

export interface TechnicalSkill {
  name: string;
  proficiency: number;
}

export interface Tool {
  id: string;
  name: string;
  source?: string;
  iconKey?: string | null;
}

export interface Profile {
  id: string;
  personal: {
    fullName: string;
    headline: string;
    location: string;
    email: string;
    phone: string;
    linkedin?: string;
    collegeName?: string;
    yearOfGraduation?: string;
    projectsWorkedOn?: string;
  };
  roles: string[];
  status: string;
  technicalSkills?: TechnicalSkill[];
  transferableSkills?: Record<string, unknown>;
  tools?: Tool[];
  humanCentricity?: { responses: Record<string, unknown> };
  workPreferences?: Record<string, unknown>;
  schemaVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt: string;
}

export interface PodPortfolioEntry extends ManagedPod {
  memberCount: number;
  openChallenges: number;
  criticalChallenges: number;
  resolvedChallenges: number;
  activationPercent: number;
  health: "Thriving" | "Watching" | "At Risk";
}

export interface AdminDashboardData {
  metrics: {
    activePods: number;
    activeUsers: number;
    openChallenges: number;
    applicants: number;
  };
  attention: {
    podsUnderWatch: number;
    criticalChallenges: number;
    inactiveUsers: number;
  };
  priorities: {
    id: string;
    title: string;
    owner: string;
    severity: Challenge["severity"];
    status: Challenge["status"];
    collegeId: string;
    updatedAt?: string;
  }[];
  pods: PodPortfolioEntry[];
  throughput: {
    week: string;
    challenges: number;
    futurecraft: number;
    industry: number;
  }[];
  workflowCounts: {
    id: string;
    label: string;
    count: number;
  }[];
}

export interface PodActivationData {
  progress: PodActivationProgress[];
  artifacts: PodActivationArtifact[];
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
  collegeId?: string,
  podRole?: PodRoleApi,
): Promise<{ access_token: string; user: AllowedUser }> {
  ensureApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: String(username || "").trim(),
      password: String(password || ""),
      ...(collegeId ? { collegeId } : {}),
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
  collegeId: string;
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
  input: Partial<{ username: string; name: string; password: string; isActive: boolean; collegeId: string; podRole: PodRoleApi }>,
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

export async function listIndustryApplicants(): Promise<Profile[]> {
  ensureApiBaseUrl();
  const res = await fetch(`${API_BASE_URL}/profile`, {
    headers: authHeaders(),
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(payload, `Could not load industry applicants (${res.status}).`));
  }
  const data = unwrapData<Profile[]>(payload);
  return Array.isArray(data) ? data : [];
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

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const payload = await requestJson("/admin/dashboard");
  const data = unwrapData<AdminDashboardData>(payload);
  if (!data) throw new Error("Dashboard response was incomplete.");
  return data;
}

export async function listPodPortfolio(): Promise<PodPortfolioEntry[]> {
  const payload = await requestJson("/admin/pod-portfolio");
  const data = unwrapData<PodPortfolioEntry[]>(payload);
  return Array.isArray(data) ? data : [];
}

export async function listChallenges(): Promise<Challenge[]> {
  const payload = await requestJson("/challenges");
  const data = unwrapData<Challenge[]>(payload);
  return Array.isArray(data) ? data : [];
}

type ChallengeWrite = Omit<Challenge, "id" | "collegeName" | "createdAt" | "updatedAt">;

function challengePayload(challenge: Challenge): ChallengeWrite {
  const { id: _id, collegeName: _collegeName, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = challenge;
  return payload;
}

export async function createChallenge(challenge: Challenge): Promise<Challenge> {
  const payload = await requestJson("/challenges", {
    method: "POST",
    body: JSON.stringify(challengePayload(challenge)),
  });
  const data = unwrapData<Challenge>(payload);
  if (!data?.id) throw new Error("Challenge response was incomplete.");
  return data;
}

export async function updateChallenge(challenge: Challenge): Promise<Challenge> {
  const payload = await requestJson(`/challenges/${encodeURIComponent(challenge.id)}`, {
    method: "PATCH",
    body: JSON.stringify(challengePayload(challenge)),
  });
  const data = unwrapData<Challenge>(payload);
  if (!data?.id) throw new Error("Challenge response was incomplete.");
  return data;
}

export async function deleteChallenge(id: string): Promise<void> {
  await requestJson(`/challenges/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listPodActivationData(): Promise<PodActivationData> {
  const payload = await requestJson("/pod-activation");
  const data = unwrapData<PodActivationData>(payload);
  return {
    progress: Array.isArray(data?.progress) ? data.progress : [],
    artifacts: Array.isArray(data?.artifacts) ? data.artifacts : [],
  };
}

export async function savePodActivationProgress(
  input: Omit<PodActivationProgress, "id" | "createdAt" | "updatedAt">,
): Promise<PodActivationProgress> {
  const payload = await requestJson("/pod-activation/progress", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  const data = unwrapData<PodActivationProgress>(payload);
  if (!data?.id) throw new Error("Activation progress response was incomplete.");
  return data;
}

export async function deletePodActivationProgress(collegeId: string, itemId: string): Promise<void> {
  await requestJson(`/pod-activation/progress/${encodeURIComponent(collegeId)}/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export async function savePodActivationArtifact(
  input: Omit<PodActivationArtifact, "id" | "createdAt" | "updatedAt">,
): Promise<PodActivationArtifact> {
  const payload = await requestJson("/pod-activation/artifacts", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  const data = unwrapData<PodActivationArtifact>(payload);
  if (!data?.id) throw new Error("Activation artifact response was incomplete.");
  return data;
}

export async function deletePodActivationArtifact(collegeId: string, itemId: string): Promise<void> {
  await requestJson(`/pod-activation/artifacts/${encodeURIComponent(collegeId)}/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

function unwrapLeaderGoals(payload: unknown): PodLeaderGoal[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as {
    data?: PodLeaderGoal[] | { goals?: PodLeaderGoal[] };
    goals?: PodLeaderGoal[];
  };
  const data = record.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.goals)) return data.goals;
  if (Array.isArray(record.goals)) return record.goals;
  return [];
}

export async function listLeaderGoals(): Promise<PodLeaderGoal[]> {
  const payload = await requestJson("/leader-goals");
  return unwrapLeaderGoals(payload).map(normalizeLeaderGoal);
}

export async function upsertLeaderGoal(goal: PodLeaderGoal): Promise<PodLeaderGoal> {
  const normalized = normalizeLeaderGoal(goal);
  const exists = /^[a-f\d]{24}$/i.test(normalized.id);
  const payload = await requestJson(`/leader-goals${exists ? `/${normalized.id}` : ""}`, {
    method: exists ? "PATCH" : "POST",
    body: JSON.stringify(normalized),
  });
  const saved = unwrapData<PodLeaderGoal>(payload);
  if (!saved?.id) throw new Error("Leader goal response was incomplete.");
  return normalizeLeaderGoal(saved);
}

export async function deleteLeaderGoal(id: string): Promise<void> {
  await requestJson(`/leader-goals/${encodeURIComponent(id)}`, { method: "DELETE" });
}

function unwrapMentors(payload: unknown): PodMentor[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as {
    data?: PodMentor[] | { mentors?: PodMentor[] };
    mentors?: PodMentor[];
  };
  const data = record.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.mentors)) return data.mentors;
  if (Array.isArray(record.mentors)) return record.mentors;
  return [];
}

export async function listMentors(): Promise<PodMentor[]> {
  const payload = await requestJson("/mentors");
  return unwrapMentors(payload).map(normalizeMentor);
}

export async function upsertMentor(mentor: PodMentor): Promise<PodMentor> {
  const normalized = normalizeMentor(mentor);
  const exists = /^[a-f\d]{24}$/i.test(normalized.id);
  const payload = await requestJson(`/mentors${exists ? `/${normalized.id}` : ""}`, {
    method: exists ? "PATCH" : "POST",
    body: JSON.stringify(normalized),
  });
  const saved = unwrapData<PodMentor>(payload);
  if (!saved?.id) throw new Error("Mentor response was incomplete.");
  return normalizeMentor(saved);
}

export async function deleteMentor(id: string): Promise<void> {
  await requestJson(`/mentors/${encodeURIComponent(id)}`, { method: "DELETE" });
}
