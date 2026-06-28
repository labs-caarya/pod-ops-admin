import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  listFutureCraftApplicants,
  listManagedPods,
  listManagedUsers,
  type FutureCraftApplicant,
  type ManagedPod,
  type AllowedUser,
} from "@/lib/api";

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const adminQueryKeys = {
  managedPods: ["admin", "managed-pods"] as const,
  managedUsers: ["admin", "managed-users"] as const,
  futureCraftApplicants: ["admin", "future-craft-applicants"] as const,
};

export function managedPodsQueryOptions() {
  return queryOptions<ManagedPod[]>({
    queryKey: adminQueryKeys.managedPods,
    queryFn: listManagedPods,
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

export function warmAdminWorkspaceCache(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery(managedPodsQueryOptions()),
    queryClient.prefetchQuery(managedUsersQueryOptions()),
    queryClient.prefetchQuery(futureCraftApplicantsQueryOptions()),
  ]);
}
