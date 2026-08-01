import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  listColleges,
  listFutureCraftApplicants,
  listLeaderGoals,
  listMentors,
  listManagedUsers,
  getAdminDashboard,
  listPodPortfolio,
  listChallenges,
  listPodActivationData,
  type College,
  type FutureCraftApplicant,
  type AllowedUser,
  type AdminDashboardData,
  type PodPortfolioEntry,
  type PodActivationData,
} from "@/lib/api";
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
  challenges: ["admin", "challenges"] as const,
  podActivation: ["admin", "pod-activation"] as const,
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
  ]);
}
