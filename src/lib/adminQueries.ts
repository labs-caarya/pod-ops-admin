import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  listColleges,
  listFutureCraftApplicants,
  listLeaderGoals,
  listMentors,
  listManagedUsers,
  getAdminDashboard,
  listPodPortfolio,
  listPodComments,
  listPodCommentUnreadCounts,
  listChallenges,
  listPodActivationData,
  listKnowledgeResources,
  getKnowledgeResourceOptions,
  listAdminContent,
  listAdminAudiences,
  listAdminEvents,
  type College,
  type FutureCraftApplicant,
  type AllowedUser,
  type AdminDashboardData,
  type PodPortfolioEntry,
  type PodComment,
  type PodCommentUnreadCount,
  type PodActivationData,
} from "@/lib/api";
import type { KnowledgeResource, KnowledgeResourceOptions } from "@/lib/knowledgeSpace/types";
import type { ContentItem } from "@/lib/content";
import type { Audience } from "@/lib/audiences";
import type { AdminEvent } from "@/lib/events";
import type { Challenge, PodLeaderGoal, PodMentor } from "@/lib/types";

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const adminQueryKeys = {
  colleges: ["admin", "colleges"] as const,
  managedUsers: ["admin", "managed-users"] as const,
  futureCraftApplicants: ["admin", "future-craft-applicants"] as const,
  leaderGoals: ["admin", "leader-goals"] as const,
  mentors: ["admin", "mentors"] as const,
  dashboard: ["admin", "dashboard"] as const,
  podPortfolio: ["admin", "pod-portfolio"] as const,
  podComments: (collegeId: string) => ["admin", "pod-comments", collegeId] as const,
  podCommentUnreadCounts: ["admin", "pod-comment-unread-counts"] as const,
  challenges: ["admin", "challenges"] as const,
  podActivation: ["admin", "pod-activation"] as const,
  knowledgeResources: ["admin", "knowledge-resources"] as const,
  knowledgeResourceOptions: ["admin", "knowledge-resource-options"] as const,
  content: ["admin", "content"] as const,
  audiences: ["admin", "audiences"] as const,
  events: ["admin", "events"] as const,
};

export function collegesQueryOptions() {
  return queryOptions<College[]>({
    queryKey: adminQueryKeys.colleges,
    queryFn: listColleges,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function dashboardQueryOptions() {
  return queryOptions<AdminDashboardData>({
    queryKey: adminQueryKeys.dashboard,
    queryFn: getAdminDashboard,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function podPortfolioQueryOptions() {
  return queryOptions<PodPortfolioEntry[]>({
    queryKey: adminQueryKeys.podPortfolio,
    queryFn: listPodPortfolio,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function podCommentsQueryOptions(collegeId: string) {
  return queryOptions<PodComment[]>({
    queryKey: adminQueryKeys.podComments(collegeId),
    queryFn: () => listPodComments(collegeId),
    enabled: Boolean(collegeId),
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function podCommentUnreadCountsQueryOptions() {
  return queryOptions<PodCommentUnreadCount[]>({
    queryKey: adminQueryKeys.podCommentUnreadCounts,
    queryFn: listPodCommentUnreadCounts,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function challengesQueryOptions() {
  return queryOptions<Challenge[]>({
    queryKey: adminQueryKeys.challenges,
    queryFn: listChallenges,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function podActivationQueryOptions() {
  return queryOptions<PodActivationData>({
    queryKey: adminQueryKeys.podActivation,
    queryFn: listPodActivationData,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function knowledgeResourcesQueryOptions() {
  return queryOptions<KnowledgeResource[]>({
    queryKey: adminQueryKeys.knowledgeResources,
    queryFn: listKnowledgeResources,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function knowledgeResourceOptionsQueryOptions() {
  return queryOptions<KnowledgeResourceOptions>({
    queryKey: adminQueryKeys.knowledgeResourceOptions,
    queryFn: getKnowledgeResourceOptions,
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function adminContentQueryOptions() {
  return queryOptions<ContentItem[]>({
    queryKey: adminQueryKeys.content,
    queryFn: listAdminContent,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function adminAudiencesQueryOptions() {
  return queryOptions<Audience[]>({ queryKey: adminQueryKeys.audiences, queryFn: listAdminAudiences, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function adminEventsQueryOptions() { return queryOptions<AdminEvent[]>({ queryKey: adminQueryKeys.events, queryFn: listAdminEvents, staleTime: 30_000, gcTime: THIRTY_MINUTES }); }

export function managedUsersQueryOptions() {
  return queryOptions<AllowedUser[]>({
    queryKey: adminQueryKeys.managedUsers,
    queryFn: listManagedUsers,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function futureCraftApplicantsQueryOptions() {
  return queryOptions<FutureCraftApplicant[]>({
    queryKey: adminQueryKeys.futureCraftApplicants,
    queryFn: listFutureCraftApplicants,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function leaderGoalsQueryOptions() {
  return queryOptions<PodLeaderGoal[]>({
    queryKey: adminQueryKeys.leaderGoals,
    queryFn: listLeaderGoals,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function mentorsQueryOptions() {
  return queryOptions<PodMentor[]>({
    queryKey: adminQueryKeys.mentors,
    queryFn: listMentors,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function warmAdminWorkspaceCache(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery(collegesQueryOptions()),
    queryClient.prefetchQuery(managedUsersQueryOptions()),
    queryClient.prefetchQuery(futureCraftApplicantsQueryOptions()),
    queryClient.prefetchQuery(leaderGoalsQueryOptions()),
    queryClient.prefetchQuery(mentorsQueryOptions()),
    queryClient.prefetchQuery(dashboardQueryOptions()),
    queryClient.prefetchQuery(podPortfolioQueryOptions()),
    queryClient.prefetchQuery(challengesQueryOptions()),
    queryClient.prefetchQuery(podActivationQueryOptions()),
    queryClient.prefetchQuery(knowledgeResourcesQueryOptions()),
    queryClient.prefetchQuery(knowledgeResourceOptionsQueryOptions()),
    queryClient.prefetchQuery(adminContentQueryOptions()),
    queryClient.prefetchQuery(adminEventsQueryOptions()),
  ]);
}
