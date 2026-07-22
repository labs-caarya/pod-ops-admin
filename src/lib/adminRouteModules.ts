export const loadAdminPodsPage = () => import("@/pages/AdminPods");
export const loadAdminPodRegistryPage = () => import("@/pages/AdminPodRegistry");
export const loadAdminUsersPage = () => import("@/pages/AdminUsers");
export const loadAdminLeaderGoalsPage = () => import("@/pages/AdminLeaderGoals");
export const loadAdminPodMentorsPage = () => import("@/pages/AdminPodMentors");
export const loadChallengeVaultPage = () => import("@/pages/ChallengeVault");
export const loadChallengeDetailPage = () => import("@/pages/ChallengeDetail");
export const loadFutureCraftApplicantsPage = () => import("@/pages/FutureCraftApplicants");
export const loadCastleApplicantsPage = () => import("@/pages/CastleApplicants");
export const loadIndustryApplicantsPage = () => import("@/pages/IndustryApplicants");

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/pods": loadAdminPodsPage,
  "/pods-admin": loadAdminPodRegistryPage,
  "/access": loadAdminUsersPage,
  "/challenges": loadChallengeVaultPage,
  "/leader-goals": loadAdminLeaderGoalsPage,
  "/mentors": loadAdminPodMentorsPage,
  "/applicants/futurecraft": loadFutureCraftApplicantsPage,
  "/applicants/castle": loadCastleApplicantsPage,
  "/applicants/industry": loadIndustryApplicantsPage,
  "/future-craft-applicants": loadFutureCraftApplicantsPage,
};

export function preloadAdminRoute(pathname: string) {
  const preload = routePreloaders[pathname];
  return preload ? preload() : Promise.resolve();
}

export function preloadAdminRouteModules() {
  return Promise.all(Object.values(routePreloaders).map((preload) => preload()));
}
