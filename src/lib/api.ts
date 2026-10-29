import { TOKEN_KEY } from "@/lib/constants";
import { normalizeLeaderGoal } from "@/lib/leaderGoals";
import { normalizeMentor } from "@/lib/mentors";
import type { PodActivationArtifact, PodActivationProgress } from "@/lib/podActivation/types";
import type { PodRoleApi } from "@/lib/podRoles";
import type { Challenge, PodLeaderGoal, PodMentor } from "@/lib/types";
import type {
  KnowledgeResource,
  KnowledgeResourceOptions,
  KnowledgeResourceWriteInput,
} from "@/lib/knowledgeSpace/types";
import type { ContentItem, ContentWriteInput } from "@/lib/content";
import type { Audience, AudienceWriteInput } from "@/lib/audiences";
import type { AdminEvent, AdminEventWriteInput } from "@/lib/events";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export interface AllowedUser {
  id?: string;
  username?: string;
  name?: string;
  primary_role?: string;
  accountType?: "super_admin" | "pod_ops_admin" | "pod_leader";
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

export interface CrewLeadReport {
  collegeId: string;
  collegeName: string;
  crew: string;
  body: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ManagedPod {
  id: string;
  name: string;
  collegeName: string;
  crew?: string;
  clubs: string[];
  podLeader: string;
  podTalentManager: string;
  podOutreachManager: string;
  podResearcher: string;
  podPartnerManager: string;
  podStrategicPartnershipAssociate?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ClubStage = "Prospect" | "Engaged" | "Active" | "Strategic";

export const CLUB_STAGES: ClubStage[] = ["Prospect", "Engaged", "Active", "Strategic"];

export interface CollegeClub {
  id: string;
  name: string;
  stage: ClubStage;
  contribution: string;
  archivedAt: string | null;
}

export type PodClub = Omit<CollegeClub, "archivedAt">;

export interface College {
  id: string;
  name: string;
  crew: string;
  isPod: boolean;
  clubs: CollegeClub[];
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
  lookingFor?: string[];
  engagementGigs?: string[];
  nanoInfluencer?: {
    interested?: boolean | null;
    instagramHandle?: string;
    followers?: string;
  };
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

export interface PodPortfolioEntry extends Omit<ManagedPod, "clubs"> {
  clubs: PodClub[];
  memberCount: number;
  openChallenges: number;
  criticalChallenges: number;
  resolvedChallenges: number;
  activationPercent: number;
  health: "Thriving" | "Watching" | "At Risk";
}

export interface PodComment {
  id: string;
  collegeId: string;
  collegeName: string;
  body: string;
  visibility: "admin" | "pod" | "both";
  status: "open" | "resolved";
  createdBy: string;
  createdByName: string;
  createdByUsername: string;
  resolvedBy: string | null;
  resolvedByName: string;
  resolvedAt: string | null;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
  isUnread: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canResolve: boolean;
}

export interface PodCommentUnreadCount {
  collegeId: string;
  unreadCount: number;
}

export interface PodPeriodMetrics {
  researchCreated: number;
  researchScored: number;
  outreachActivities: number;
  meetings: number;
  opportunitiesCreated: number;
  opportunitiesShared: number;
  offersSent: number;
  offersAccepted: number;
  placements: number;
  challengesOpened: number;
  challengesResolved: number;
  goalsCompleted: number;
}

export interface PodInsight {
  collegeId: string;
  podName: string;
  collegeName: string;
  crew: string;
  health: PodPortfolioEntry["health"];
  activationPercent: number;
  daily: PodPeriodMetrics;
  weekly: PodPeriodMetrics;
  previousWeek: PodPeriodMetrics;
  snapshot: {
    activePartners: number;
    talentMapped: number;
    openOpportunities: number;
    openChallenges: number;
    criticalChallenges: number;
    overdueGoals: number;
    mentors: number;
    contactsInConversation: number;
  };
  level: {
    current: number;
    next: number;
    progress: number;
    name: string;
    nextName: string;
    checks: {
      id: string;
      label: string;
      current: number;
      target: number;
      unit: string;
      met: boolean;
    }[];
  };
}

export interface AdminDashboardData {
  metrics: {
    activePods: number;
    activeUsers: number;
    activePodLeaders?: number;
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
  insights: PodInsight[];
  leaderTasks: {
    id: string;
    collegeId: string;
    collegeName: string;
    assignedPodRole: PodRoleApi;
    assigneeName: string;
    title: string;
    description: string;
    status: "active";
    dueDate?: string | null;
  }[];
  throughput: {
    week: string;
    observership: number;
    apprenticeship: number;
    internship: number;
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
    clubs: Array.isArray(college.clubs) ? college.clubs : [],
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
      application: "pod-ops-admin",
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

export async function getCurrentSession(): Promise<AllowedUser> {
  const payload = await requestJson("/auth/session");
  const data = unwrapData<AllowedUser>(payload);
  if (!data?.id) throw new Error("Session response was incomplete.");
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

export async function addCollegeClub(
  collegeId: string,
  input: { name: string; stage?: ClubStage; contribution?: string },
): Promise<College> {
  const payload = await requestJson(`/colleges/${encodeURIComponent(collegeId)}/clubs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeCollege(unwrapEntity<Partial<College> & { _id?: string }>(payload, "college"));
}

export async function updateCollegeClub(
  collegeId: string,
  clubId: string,
  input: Partial<{ name: string; stage: ClubStage; contribution: string; archived: boolean }>,
): Promise<College> {
  const payload = await requestJson(
    `/colleges/${encodeURIComponent(collegeId)}/clubs/${encodeURIComponent(clubId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return normalizeCollege(unwrapEntity<Partial<College> & { _id?: string }>(payload, "college"));
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const payload = await requestJson("/admin/dashboard");
  const data = unwrapData<AdminDashboardData>(payload);
  if (!data) throw new Error("Dashboard response was incomplete.");
  return data;
}

export async function listCrewLeadReports(): Promise<CrewLeadReport[]> {
  const payload = await requestJson("/admin/progress-reports");
  const data = unwrapData<CrewLeadReport[]>(payload);
  return Array.isArray(data) ? data : [];
}

export async function saveCrewLeadReport(collegeId: string, body: string): Promise<CrewLeadReport> {
  const payload = await requestJson(`/admin/progress-reports/${encodeURIComponent(collegeId)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
  const data = unwrapData<CrewLeadReport>(payload);
  if (!data?.collegeId) throw new Error("Progress report response was incomplete.");
  return data;
}

export async function listPodPortfolio(): Promise<PodPortfolioEntry[]> {
  const payload = await requestJson("/admin/pod-portfolio");
  const data = unwrapData<PodPortfolioEntry[]>(payload);
  return Array.isArray(data) ? data : [];
}

export interface NetworkPartner {
  id: string;
  name: string;
  institution: string;
  category: string;
  spaType: string;
  domain: string;
  podId: string;
  podName: string;
  createdAt: string;
}

interface StrategicPartnerRecord {
  _id?: string;
  id?: string;
  startupName?: string;
  institution?: string;
  category?: string;
  spaType?: string;
  domain?: string;
  pod?: { _id?: string; id?: string; name?: string } | string | null;
  createdAt?: string;
}

function normalizeNetworkPartner(partner: StrategicPartnerRecord): NetworkPartner | null {
  const id = partner._id || partner.id || "";
  if (!id) return null;
  const pod = partner.pod;
  const podId = typeof pod === "string" ? pod : pod?._id || pod?.id || "";
  const podName = typeof pod === "string" ? "" : pod?.name || "";
  return {
    id,
    name: partner.startupName || "Untitled partner",
    institution: partner.institution || "",
    category: partner.category || "",
    spaType: partner.spaType || "",
    domain: partner.domain || "",
    podId,
    podName,
    createdAt: partner.createdAt || "",
  };
}

export interface MarketingCalendarCampaign {
  id: string;
  title: string;
  status: string;
  ownerName: string;
  startDate: string | null;
  endDate: string | null;
}

export interface ContentCalendarItem {
  id: string;
  title: string;
  status: string;
  channel: string;
  format: string;
  ownerName: string;
  targetDate: string | null;
}

function recordId(record: { id?: string; _id?: string }) {
  return record.id || record._id || "";
}

export async function listMarketingCampaigns(): Promise<MarketingCalendarCampaign[]> {
  const payload = await requestJson("/marketing/campaigns");
  const data = unwrapData<Array<Partial<MarketingCalendarCampaign> & { _id?: string }>>(payload);
  if (!Array.isArray(data)) return [];
  return data.flatMap((campaign) => {
    const id = recordId(campaign);
    if (!id) return [];
    return [{
      id,
      title: campaign.title || "Untitled campaign",
      status: campaign.status || "",
      ownerName: campaign.ownerName || "",
      startDate: campaign.startDate || null,
      endDate: campaign.endDate || null,
    }];
  });
}

export async function listContentCalendar(): Promise<ContentCalendarItem[]> {
  const payload = await requestJson("/marketing/content");
  const data = unwrapData<Array<Partial<ContentCalendarItem> & { _id?: string }>>(payload);
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const id = recordId(item);
    if (!id) return [];
    return [{
      id,
      title: item.title || "Untitled content",
      status: item.status || "",
      channel: item.channel || "",
      format: item.format || "",
      ownerName: item.ownerName || "",
      targetDate: item.targetDate || null,
    }];
  });
}

export async function listNetworkPartners(): Promise<NetworkPartner[]> {
  const payload = await requestJson("/admin/strategic-partners");
  const data = unwrapData<StrategicPartnerRecord[]>(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeNetworkPartner)
    .filter((partner): partner is NetworkPartner => Boolean(partner))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function listPodComments(collegeId: string): Promise<PodComment[]> {
  const payload = await requestJson(`/pod-comments?collegeId=${encodeURIComponent(collegeId)}&status=all`);
  const data = unwrapData<PodComment[]>(payload);
  return Array.isArray(data) ? data : [];
}

export async function listPodCommentUnreadCounts(): Promise<PodCommentUnreadCount[]> {
  const payload = await requestJson('/pod-comments/unread-counts');
  const data = unwrapData<PodCommentUnreadCount[]>(payload);
  return Array.isArray(data) ? data : [];
}

export async function markPodCommentsRead(collegeId: string): Promise<void> {
  await requestJson('/pod-comments/read', {
    method: 'POST',
    body: JSON.stringify({ collegeId }),
  });
}

export async function createPodComment(input: { collegeId: string; body: string; visibility: PodComment["visibility"] }): Promise<PodComment> {
  const payload = await requestJson("/pod-comments", { method: "POST", body: JSON.stringify(input) });
  const data = unwrapData<PodComment>(payload);
  if (!data?.id) throw new Error("Comment response was incomplete.");
  return data;
}

export async function updatePodComment(id: string, input: { body: string; visibility: PodComment["visibility"] }): Promise<PodComment> {
  const payload = await requestJson(`/pod-comments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  const data = unwrapData<PodComment>(payload);
  if (!data?.id) throw new Error("Comment response was incomplete.");
  return data;
}

export async function deletePodComment(id: string): Promise<void> {
  await requestJson(`/pod-comments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function resolvePodComment(id: string, resolutionNote: string): Promise<PodComment> {
  const payload = await requestJson(`/pod-comments/${encodeURIComponent(id)}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolutionNote }),
  });
  const data = unwrapData<PodComment>(payload);
  if (!data?.id) throw new Error("Comment response was incomplete.");
  return data;
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

export async function listKnowledgeResources(): Promise<KnowledgeResource[]> {
  const payload = await requestJson("/knowledge-resources");
  return unwrapList<KnowledgeResource>(payload, "resources");
}

export async function getKnowledgeResourceOptions(): Promise<KnowledgeResourceOptions> {
  const payload = await requestJson("/knowledge-resources/options");
  const data = unwrapData<KnowledgeResourceOptions>(payload);
  if (!data?.domains || !data?.permissions) {
    throw new Error("Knowledge Space options response was incomplete.");
  }
  return data;
}

export async function createKnowledgeResource(input: KnowledgeResourceWriteInput): Promise<KnowledgeResource> {
  const payload = await requestJson("/knowledge-resources", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = unwrapData<KnowledgeResource>(payload);
  if (!data?.id) throw new Error("Knowledge resource response was incomplete.");
  return data;
}

export async function updateKnowledgeResource(
  id: string,
  input: KnowledgeResourceWriteInput,
): Promise<KnowledgeResource> {
  const payload = await requestJson(`/knowledge-resources/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const data = unwrapData<KnowledgeResource>(payload);
  if (!data?.id) throw new Error("Knowledge resource response was incomplete.");
  return data;
}

export async function deleteKnowledgeResource(id: string): Promise<void> {
  await requestJson(`/knowledge-resources/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listAdminContent(): Promise<ContentItem[]> {
  const payload = await requestJson("/admin/content");
  return unwrapList<ContentItem>(payload, "content");
}

export async function getAdminContentOptions(): Promise<import("@/lib/content").ContentDirectoryOptions> {
  const payload = await requestJson("/admin/content/options");
  const data = unwrapData<import("@/lib/content").ContentDirectoryOptions>(payload);
  if (!data?.contentTypes || !data.platforms || !data.taxonomy) throw new Error("Content directory response was incomplete.");
  return data;
}

export async function createAdminContent(input: ContentWriteInput): Promise<ContentItem> {
  const payload = await requestJson("/admin/content", { method: "POST", body: JSON.stringify(input) });
  const data = unwrapData<ContentItem>(payload);
  if (!data?.id) throw new Error("Content response was incomplete.");
  return data;
}

export async function updateAdminContent(id: string, input: ContentWriteInput): Promise<ContentItem> {
  const payload = await requestJson(`/admin/content/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  const data = unwrapData<ContentItem>(payload);
  if (!data?.id) throw new Error("Content response was incomplete.");
  return data;
}

export async function deleteAdminContent(id: string): Promise<void> {
  await requestJson(`/admin/content/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listAdminAudiences(): Promise<Audience[]> { return unwrapList<Audience>(await requestJson("/admin/audiences"), "audiences"); }
export async function createAdminAudience(input: AudienceWriteInput): Promise<Audience> { const data = unwrapData<Audience>(await requestJson("/admin/audiences", { method: "POST", body: JSON.stringify(input) })); if (!data?.id) throw new Error("Audience response was incomplete."); return data; }
export async function updateAdminAudience(id: string, input: AudienceWriteInput): Promise<Audience> { const data = unwrapData<Audience>(await requestJson(`/admin/audiences/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })); if (!data?.id) throw new Error("Audience response was incomplete."); return data; }
export async function deleteAdminAudience(id: string): Promise<void> { await requestJson(`/admin/audiences/${encodeURIComponent(id)}`, { method: "DELETE" }); }

export async function listAdminEvents(): Promise<AdminEvent[]> { return unwrapList<AdminEvent>(await requestJson("/admin/events"), "events"); }
export async function createAdminEvent(input: AdminEventWriteInput): Promise<AdminEvent> { const data = unwrapData<AdminEvent>(await requestJson("/admin/events", { method: "POST", body: JSON.stringify(input) })); if (!data?.id) throw new Error("Event response was incomplete."); return data; }
export async function updateAdminEvent(id: string, input: AdminEventWriteInput): Promise<AdminEvent> { const data = unwrapData<AdminEvent>(await requestJson(`/admin/events/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })); if (!data?.id) throw new Error("Event response was incomplete."); return data; }
export async function deleteAdminEvent(id: string): Promise<void> { await requestJson(`/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" }); }
