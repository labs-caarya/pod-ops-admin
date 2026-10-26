export const loadAdminPodsPage = () => import("@/pages/AdminPods");
export const loadAdminPodRegistryPage = () => import("@/pages/AdminPodRegistry");
export const loadAdminLeaderGoalsPage = () => import("@/pages/AdminLeaderGoals");
export const loadAdminPodMentorsPage = () => import("@/pages/AdminPodMentors");
export const loadChallengeVaultPage = () => import("@/pages/ChallengeVault");
export const loadChallengeDetailPage = () => import("@/pages/ChallengeDetail");
export const loadFutureCraftApplicantsPage = () => import("@/pages/FutureCraftApplicants");
export const loadCastleApplicantsPage = () => import("@/pages/CastleApplicants");
export const loadIndustryApplicantsPage = () => import("@/pages/IndustryApplicants");
export const loadAdminPodActivationPage = () => import("@/pages/AdminPodActivation");
export const loadAdminPodActivationDetailPage = () => import("@/pages/AdminPodActivationDetail");
export const loadAdminKnowledgeSpacePage = () => import("@/pages/AdminKnowledgeSpace");
export const loadPodReportsPage = () => import("@/pages/PodReports");
export const loadContentStudioPage = () => import("@/pages/ContentStudio");

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/pods": loadAdminPodsPage,
  "/reports": loadPodReportsPage,
  "/pods-admin": loadAdminPodRegistryPage,
  "/challenges": loadChallengeVaultPage,
  "/pod-activation": loadAdminPodActivationPage,
  "/knowledge-space": loadAdminKnowledgeSpacePage,
  "/content": loadContentStudioPage,
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
