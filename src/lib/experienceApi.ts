import { requestJson, unwrapData } from "@/lib/api";
import type {
  Assessment,
  AssessmentAttempt,
  AssessmentWriteInput,
  CreditEntry,
  ExperienceDirectory,
  ExperienceMemberOverview,
  ExperienceRules,
  InternalEvent,
  InternalEventWriteInput,
  LedgerPage,
  LorRequest,
  ManualCreditInput,
  TalentReferral,
  WorkItem,
  WorkReviewInput,
  WorkUpdateEntry,
  ActivationBudgetOverview,
  AttendeeStatus,
} from "@/lib/experience";

const BASE = "/admin/experience";

function need<T>(payload: unknown, label: string): T {
  const data = unwrapData<T>(payload);
  if (data === undefined || data === null) throw new Error(`${label} response was incomplete.`);
  return data;
}

function list<T>(payload: unknown): T[] {
  const data = unwrapData<T[]>(payload);
  return Array.isArray(data) ? data : [];
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

/* ---- Members and ledger ---- */

export async function getExperienceDirectory(params: { collegeId?: string; search?: string } = {}): Promise<ExperienceDirectory> {
  return need(await requestJson(`${BASE}/members${query(params)}`), "Directory");
}

export async function getExperienceMember(userId: string): Promise<ExperienceMemberOverview> {
  return need(await requestJson(`${BASE}/members/${encodeURIComponent(userId)}`), "Member");
}

export async function getExperienceLedger(
  params: { userId?: string; collegeId?: string; source?: string; limit?: number; before?: string; includeRevoked?: boolean } = {},
): Promise<LedgerPage> {
  return need(await requestJson(`${BASE}/ledger${query(params)}`), "Ledger");
}

export async function issueExperienceCredit(input: ManualCreditInput): Promise<CreditEntry> {
  return need(await requestJson(`${BASE}/credits`, json("POST", input)), "Credit");
}

export async function revokeExperienceCredit(id: string, reason: string): Promise<CreditEntry> {
  return need(await requestJson(`${BASE}/credits/${encodeURIComponent(id)}/revoke`, json("POST", { reason })), "Credit");
}

export async function getExperienceRules(): Promise<ExperienceRules> {
  return need(await requestJson(`${BASE}/config`), "Rules");
}

export async function saveExperienceRules(rules: Partial<ExperienceRules>): Promise<ExperienceRules> {
  return need(await requestJson(`${BASE}/config`, json("PUT", rules)), "Rules");
}

/* ---- Work reviews ---- */

export async function listWorkItems(params: { status?: string; collegeId?: string } = {}): Promise<WorkItem[]> {
  return list<WorkItem>(await requestJson(`${BASE}/work${query(params)}`));
}

export async function getWorkItemUpdates(id: string): Promise<{ item: WorkItem; updates: WorkUpdateEntry[] }> {
  return need(await requestJson(`${BASE}/work/${encodeURIComponent(id)}/updates`), "Work updates");
}

export async function reviewWorkItem(id: string, input: WorkReviewInput): Promise<{ item: WorkItem; awards: { userId: string; name: string; amount: number }[] }> {
  return need(await requestJson(`${BASE}/work/${encodeURIComponent(id)}/review`, json("POST", input)), "Review");
}

/* ---- Assessments ---- */

export async function listAssessments(): Promise<Assessment[]> {
  return list<Assessment>(await requestJson(`${BASE}/assessments`));
}

export async function getAssessment(id: string): Promise<Assessment & { attempts: AssessmentAttempt[] }> {
  return need(await requestJson(`${BASE}/assessments/${encodeURIComponent(id)}`), "Assessment");
}

export async function saveAssessment(id: string | null, input: Partial<AssessmentWriteInput>): Promise<Assessment> {
  const path = id ? `${BASE}/assessments/${encodeURIComponent(id)}` : `${BASE}/assessments`;
  return need(await requestJson(path, json(id ? "PATCH" : "POST", input)), "Assessment");
}

export async function deleteAssessment(id: string): Promise<{ archived: boolean }> {
  return need(await requestJson(`${BASE}/assessments/${encodeURIComponent(id)}`, json("DELETE")), "Assessment");
}

/* ---- Internal events ---- */

export async function listInternalEvents(when?: "upcoming" | "past"): Promise<InternalEvent[]> {
  return list<InternalEvent>(await requestJson(`${BASE}/events${query({ when })}`));
}

export async function getInternalEvent(id: string): Promise<InternalEvent> {
  return need(await requestJson(`${BASE}/events/${encodeURIComponent(id)}`), "Event");
}

export async function saveInternalEvent(id: string | null, input: Partial<InternalEventWriteInput>): Promise<InternalEvent> {
  const path = id ? `${BASE}/events/${encodeURIComponent(id)}` : `${BASE}/events`;
  return need(await requestJson(path, json(id ? "PATCH" : "POST", input)), "Event");
}

export async function deleteInternalEvent(id: string): Promise<{ archived: boolean }> {
  return need(await requestJson(`${BASE}/events/${encodeURIComponent(id)}`, json("DELETE")), "Event");
}

export async function addEventAttendees(id: string, userIds: string[]): Promise<InternalEvent> {
  return need(await requestJson(`${BASE}/events/${encodeURIComponent(id)}/attendees`, json("POST", { userIds })), "Event");
}

export async function removeEventAttendee(id: string, userId: string): Promise<InternalEvent> {
  return need(await requestJson(`${BASE}/events/${encodeURIComponent(id)}/attendees/${encodeURIComponent(userId)}`, json("DELETE")), "Event");
}

export async function markEventAttendance(
  id: string,
  marks: { userId: string; status: AttendeeStatus }[],
): Promise<{ event: InternalEvent; issued: { userId: string; name: string; amount: number }[] }> {
  return need(await requestJson(`${BASE}/events/${encodeURIComponent(id)}/attendance`, json("PUT", { marks })), "Attendance");
}

/* ---- Referrals and LoR ---- */

export async function listTalentReferrals(status?: string): Promise<TalentReferral[]> {
  return list<TalentReferral>(await requestJson(`${BASE}/referrals${query({ status })}`));
}

export async function getActivationBudget(): Promise<ActivationBudgetOverview> {
  return need(await requestJson(`${BASE}/activation-budget`), "Activation budget");
}

export async function reviewTalentReferral(id: string, decision: "accepted" | "selected" | "not_selected", note: string): Promise<TalentReferral> {
  return need(await requestJson(`${BASE}/referrals/${encodeURIComponent(id)}/review`, json("POST", { decision, note })), "Referral");
}

export async function listLorRequests(status?: string): Promise<LorRequest[]> {
  return list<LorRequest>(await requestJson(`${BASE}/lor${query({ status })}`));
}

export async function reviewLorRequest(
  id: string,
  input: { decision: "issued" | "declined"; note: string; documentUrl: string },
): Promise<LorRequest> {
  return need(await requestJson(`${BASE}/lor/${encodeURIComponent(id)}/review`, json("POST", input)), "LoR");
}

export interface ContentWorkAssignment {
  id: string;
  contentId: string;
  contentName: string;
  userId: string;
  userName: string;
  collegeName: string;
  crew: string;
  roleLabel: string;
  status: "offered" | "picked_up" | "delivered" | "dropped";
  campaignTitle: string;
  dueDate: string;
  creditsAwarded: number;
}

export async function listContentAssignments(contentId: string): Promise<ContentWorkAssignment[]> {
  return list<ContentWorkAssignment>(await requestJson(`${BASE}/content-work/${encodeURIComponent(contentId)}`));
}

export async function assignContentWork(contentId: string, userIds: string[]): Promise<ContentWorkAssignment[]> {
  return list<ContentWorkAssignment>(await requestJson(`${BASE}/content-work/${encodeURIComponent(contentId)}`, json("POST", { userIds })));
}

export async function removeContentAssignment(contentId: string, userId: string): Promise<void> {
  await requestJson(`${BASE}/content-work/${encodeURIComponent(contentId)}/${encodeURIComponent(userId)}`, json("DELETE"));
}
