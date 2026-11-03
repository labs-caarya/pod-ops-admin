import { queryOptions } from "@tanstack/react-query";
import {
  getActivationBudget,
  getAssessment,
  getExperienceDirectory,
  getExperienceLedger,
  getExperienceMember,
  getExperienceRules,
  getInternalEvent,
  getWorkItemUpdates,
  listAssessments,
  listInternalEvents,
  listLorRequests,
  listTalentReferrals,
  getTalentReferralUnseenCount,
  listWorkItems,
} from "@/lib/experienceApi";

export const experienceKeys = {
  all: ["admin", "experience"] as const,
  directory: ["admin", "experience", "directory"] as const,
  member: (userId: string) => ["admin", "experience", "member", userId] as const,
  ledger: ["admin", "experience", "ledger"] as const,
  rules: ["admin", "experience", "rules"] as const,
  work: ["admin", "experience", "work"] as const,
  assessments: ["admin", "experience", "assessments"] as const,
  events: ["admin", "experience", "events"] as const,
  referrals: ["admin", "experience", "referrals"] as const,
  referralUnread: ["admin", "experience", "referrals", "unread"] as const,
  lor: ["admin", "experience", "lor"] as const,
};

const THIRTY_SECONDS = 30_000;

export const experienceDirectoryQuery = (search: string, collegeId: string) =>
  queryOptions({
    queryKey: [...experienceKeys.directory, search, collegeId],
    queryFn: () => getExperienceDirectory({ search, collegeId }),
    staleTime: THIRTY_SECONDS,
  });

export const experienceMemberQuery = (userId: string) =>
  queryOptions({
    queryKey: experienceKeys.member(userId),
    queryFn: () => getExperienceMember(userId),
    staleTime: THIRTY_SECONDS,
    enabled: Boolean(userId),
  });

export const experienceLedgerQuery = (params: { userId?: string; source?: string; includeRevoked?: boolean }) =>
  queryOptions({
    queryKey: [...experienceKeys.ledger, params],
    queryFn: () => getExperienceLedger({ ...params, limit: 50 }),
    staleTime: THIRTY_SECONDS,
  });

export const experienceRulesQuery = () =>
  queryOptions({ queryKey: experienceKeys.rules, queryFn: getExperienceRules, staleTime: THIRTY_SECONDS });

export const workItemsQuery = (status: string) =>
  queryOptions({
    queryKey: [...experienceKeys.work, status],
    queryFn: () => listWorkItems({ status }),
    staleTime: THIRTY_SECONDS,
  });

export const workUpdatesQuery = (id: string) =>
  queryOptions({
    queryKey: [...experienceKeys.work, "updates", id],
    queryFn: () => getWorkItemUpdates(id),
    enabled: Boolean(id),
  });

export const assessmentsQuery = () =>
  queryOptions({ queryKey: experienceKeys.assessments, queryFn: listAssessments, staleTime: THIRTY_SECONDS });

export const assessmentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: [...experienceKeys.assessments, id],
    queryFn: () => getAssessment(id),
    enabled: Boolean(id),
  });

export const internalEventsQuery = (when: "upcoming" | "past" | "") =>
  queryOptions({
    queryKey: [...experienceKeys.events, when],
    queryFn: () => listInternalEvents(when || undefined),
    staleTime: THIRTY_SECONDS,
  });

export const internalEventQuery = (id: string) =>
  queryOptions({
    queryKey: [...experienceKeys.events, "detail", id],
    queryFn: () => getInternalEvent(id),
    enabled: Boolean(id),
  });

export const activationBudgetQuery = () =>
  queryOptions({ queryKey: [...experienceKeys.assessments, "activation-budget"], queryFn: getActivationBudget, staleTime: THIRTY_SECONDS });

export const referralsQuery = (status: string) =>
  queryOptions({
    queryKey: [...experienceKeys.referrals, status],
    queryFn: () => listTalentReferrals(status),
    staleTime: THIRTY_SECONDS,
  });

export const talentReferralUnseenQuery = () =>
  queryOptions({ queryKey: experienceKeys.referralUnread, queryFn: getTalentReferralUnseenCount, staleTime: THIRTY_SECONDS, refetchInterval: THIRTY_SECONDS });

export const lorQuery = (status: string) =>
  queryOptions({
    queryKey: [...experienceKeys.lor, status],
    queryFn: () => listLorRequests(status),
    staleTime: THIRTY_SECONDS,
  });
