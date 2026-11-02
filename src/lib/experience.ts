import type { PodRoleApi } from "@/lib/podRoles";

export const CREDIT_SOURCES = [
  "update_day",
  "work_update",
  "work_completion",
  "research_added",
  "research_completed",
  "referral_opening",
  "referral_selected",
  "assessment",
  "activation_task",
  "internal_event",
  "manual",
] as const;
export type CreditSource = (typeof CREDIT_SOURCES)[number];

export const CREDIT_SOURCE_LABELS: Record<CreditSource, string> = {
  update_day: "Daily work update",
  work_update: "Work progress update",
  work_completion: "Work completed",
  research_added: "Research added",
  research_completed: "Research completed",
  referral_opening: "Talent referred to an opening",
  referral_selected: "Talent referred into a program",
  assessment: "Assessment passed",
  activation_task: "Pod setup task",
  internal_event: "Internal event",
  manual: "Issued by CREW",
};

export interface CreditEntry {
  id: string;
  userId: string;
  userName: string;
  collegeName: string;
  podRole: string;
  amount: number;
  source: CreditSource;
  sourceLabel: string;
  title: string;
  note: string;
  issuedByName: string;
  revoked: boolean;
  revokeReason: string;
  createdAt: string;
}

export interface ExperienceMemberRow {
  id: string;
  name: string;
  username: string;
  collegeId: string;
  collegeName: string;
  podRole: string;
  balance: number;
  entries: number;
  lastEarnedAt: string | null;
  lorEligible: boolean;
}

export interface ExperienceDirectory {
  members: ExperienceMemberRow[];
  totals: { members: number; credits: number; lorEligible: number };
  lorThreshold: number;
}

export interface ExperienceRules {
  updateDayCredits: number;
  minUpdateWords: number;
  workUpdateCredits: number;
  minWorkUpdateWords: number;
  maxWorkUpdateAwardsPerItem: number;
  workCompletionCredits: number;
  researchAddedCredits: number;
  researchCompletedCredits: number;
  minResearchVerdictWords: number;
  dailyResearchCreditCap: number;
  referralOpeningCredits: number;
  referralSelectedCredits: number;
  eventAttendedCredits: number;
  eventParticipatedCredits: number;
  eventHostedCredits: number;
  activationPoolCredits: number;
  lorThreshold: number;
}

export interface RuleField {
  key: keyof ExperienceRules;
  label: string;
  hint: string;
  group: "Updates" | "Work" | "Research" | "Referrals" | "Internal events" | "Activation" | "Letter of Recommendation";
}

export const RULE_FIELDS: RuleField[] = [
  { key: "updateDayCredits", label: "Credits per update day", hint: "Paid once per day when a member sends a proper work update.", group: "Updates" },
  { key: "minUpdateWords", label: "Minimum words for an update", hint: "Shorter updates do not count as a proper update.", group: "Updates" },
  { key: "workUpdateCredits", label: "Credits per work update", hint: "Default for progress updates on assigned work. Can be overridden per item.", group: "Work" },
  { key: "minWorkUpdateWords", label: "Minimum words for a work update", hint: "Also applies to the note when sending work for review.", group: "Work" },
  { key: "maxWorkUpdateAwardsPerItem", label: "Paid updates per work item", hint: "After this many paid updates, further updates earn nothing.", group: "Work" },
  { key: "workCompletionCredits", label: "Credits on completion", hint: "Default when you mark work complete. Can be overridden per item.", group: "Work" },
  { key: "researchCompletedCredits", label: "Credits for completing a research", hint: "Paid once when a consulting research has every section filled: startup, founder, online presence, pod fit, and a score.", group: "Research" },
  { key: "dailyResearchCreditCap", label: "Paid researches per day", hint: "Limits filler entries.", group: "Research" },
  { key: "researchAddedCredits", label: "Credits for adding a research profile", hint: "Optional extra for starting a profile. Off (0) by default.", group: "Research" },
  { key: "referralOpeningCredits", label: "Referral to an existing opening", hint: "Paid when CREW accepts a referral to an opening.", group: "Referrals" },
  { key: "referralSelectedCredits", label: "Referral admitted to a program", hint: "Paid when a referred talent is selected for a program and added to the roster.", group: "Referrals" },
  { key: "eventAttendedCredits", label: "Attended an event", hint: "Default for the Attended tier. An event can override it.", group: "Internal events" },
  { key: "eventParticipatedCredits", label: "Actively participated", hint: "Default for the Participated tier.", group: "Internal events" },
  { key: "eventHostedCredits", label: "Hosted an event", hint: "Default for the Hosted tier.", group: "Internal events" },
  { key: "activationPoolCredits", label: "Activation pool per member", hint: "Split between the assessments for a role and its pod setup tasks. Assessments keep what you set on them; the rest is shared across the setup tasks.", group: "Activation" },
  { key: "lorThreshold", label: "Credits needed for an LoR", hint: "Members at or above this balance can request a Letter of Recommendation.", group: "Letter of Recommendation" },
];

export interface LorStatus {
  threshold: number;
  balance: number;
  remaining: number;
  percent: number;
  eligible: boolean;
  canRequest: boolean;
  request: LorRequest | null;
}

export interface ExperienceMemberOverview {
  member: { id: string; name: string; username: string; collegeId: string; collegeName: string; podRole: string };
  balance: number;
  thisMonth: number;
  lor: LorStatus;
  streak: { current: number; longest: number; total: number };
  breakdown: { source: CreditSource; label: string; total: number; count: number }[];
  recent: CreditEntry[];
  rules: ExperienceRules;
}

export interface LedgerPage {
  items: CreditEntry[];
  nextCursor: string | null;
}

export interface ManualCreditInput {
  userId: string;
  amount: number;
  title: string;
  note?: string;
}

/* ---- Work reviews ---- */

export interface WorkUpdateEntry {
  id: string;
  workItemId: string;
  authorName: string;
  authorRole: string;
  isAdmin: boolean;
  kind: "progress" | "review_request" | "review_feedback";
  body: string;
  creditsAwarded: number;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  collegeId: string;
  collegeName: string;
  assignedPodRole: string;
  assigneeName: string;
  title: string;
  description: string;
  status: "active" | "in_review" | "done" | "discarded";
  dueDate?: string;
  creditsPerUpdate: number | null;
  completionCredits: number | null;
  submittedAt: string | null;
  submissionNote: string;
  reviewNote: string;
  completedAt: string | null;
  updateCount: number;
  lastUpdateAt: string | null;
  latestUpdates: WorkUpdateEntry[];
}

export type WorkReviewDecision = "complete" | "request_changes" | "discard";

export interface WorkReviewInput {
  decision: WorkReviewDecision;
  note?: string;
  completionCredits?: number;
}

/* ---- Assessments ---- */

export type AssessmentScope = "caarya" | "role";
export type AssessmentStatus = "draft" | "published" | "archived";

export interface AssessmentOption {
  id?: string;
  text: string;
  correct: boolean;
}

export interface AssessmentQuestion {
  id?: string;
  prompt: string;
  explanation: string;
  options: AssessmentOption[];
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  userName: string;
  collegeName: string;
  podRole: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  creditsAwarded: number;
  createdAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  scope: AssessmentScope;
  roles: PodRoleApi[];
  passMarkPercent: number;
  credits: number;
  status: AssessmentStatus;
  sortOrder: number;
  questionCount: number;
  questions: AssessmentQuestion[];
  attemptCount: number;
  passedCount: number;
  attempts?: AssessmentAttempt[];
  updatedAt?: string;
}

export type AssessmentWriteInput = Omit<Assessment, "id" | "questionCount" | "attemptCount" | "passedCount" | "attempts" | "updatedAt">;

/* ---- Internal events ---- */

export const EVENT_KINDS = ["workshop", "townhall", "meetup", "training", "social", "other"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  workshop: "Workshop",
  townhall: "Town hall",
  meetup: "Meetup",
  training: "Training",
  social: "Social",
  other: "Other",
};

/** `attended` < `participated` < `hosted`: each pays its own credits. */
export type AttendeeStatus = "rsvp" | "attended" | "participated" | "hosted" | "absent";
export const CREDIT_TIERS = ["attended", "participated", "hosted"] as const;
export type CreditTier = (typeof CREDIT_TIERS)[number];
export const CREDIT_TIER_LABELS: Record<CreditTier, string> = {
  attended: "Attended",
  participated: "Participated",
  hosted: "Hosted",
};
export type TierCredits = Record<CreditTier, number>;
export type TierOverrides = Record<CreditTier, number | null>;

export interface EventAttendee {
  userId: string;
  name: string;
  username: string;
  collegeName: string;
  podRole: string;
  status: AttendeeStatus;
  rsvpAt: string;
  rsvpSource: "member" | "admin";
  creditsAwarded: number;
}

export interface InternalEvent {
  id: string;
  title: string;
  description: string;
  kind: EventKind;
  startsAt: string;
  endsAt: string | null;
  location: string;
  /** What each tier pays for this event (the override when set, otherwise the program default). */
  credits: TierCredits;
  creditOverrides: TierOverrides;
  audienceRoles: PodRoleApi[];
  cancelled: boolean;
  rsvpCount: number;
  attendedCount: number;
  creditsIssued: number;
  attendees?: EventAttendee[];
}

export interface InternalEventWriteInput {
  title: string;
  description: string;
  kind: EventKind;
  startsAt: string;
  endsAt: string | null;
  location: string;
  creditOverrides: TierOverrides;
  audienceRoles: PodRoleApi[];
  cancelled?: boolean;
}

/* ---- Activation pool ---- */

export interface ActivationBudget {
  roleId: string;
  roleLabel: string;
  pool: number;
  assessmentCredits: number;
  taskCount: number;
  perTask: number;
  taskTotal: number;
  /** Credits in the pool that nothing pays out (rounding, or no setup tasks). Negative when over budget. */
  unallocated: number;
  overBudget: boolean;
  assessments: { id: string; title: string; scope: "caarya" | "role"; credits: number }[];
  tasks: { id: string; title: string; credits: number }[];
}

export interface ActivationBudgetOverview {
  pool: number;
  roles: ActivationBudget[];
}

/* ---- Referrals and LoR ---- */

export interface TalentReferral {
  id: string;
  referrerName: string;
  collegeName: string;
  podRole: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateCollege: string;
  candidateSkill: string;
  note: string;
  /** `opening`: referred to an existing opening. `program`: referred into one of our programs. */
  kind: "opening" | "program";
  targetTitle: string;
  status: "submitted" | "accepted" | "selected" | "not_selected";
  reviewedByName: string;
  reviewNote: string;
  creditsAwarded: number;
  createdAt: string;
}

export interface LorRequest {
  id: string;
  userId: string;
  userName: string;
  collegeName: string;
  podRole: string;
  balanceAtRequest: number;
  memberNote: string;
  status: "requested" | "issued" | "declined";
  reviewNote: string;
  documentUrl: string;
  reviewedByName: string;
  createdAt: string;
}
