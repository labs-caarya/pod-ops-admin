export const loadAdminPodsPage = () => import("@/pages/AdminPods");
export const loadAdminPodDetailPage = () => import("@/pages/AdminPodDetail");
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
export const loadEventManagementPage = () => import("@/pages/EventManagement");
export const loadAdminQuarterlyGoalsPage = () => import("@/pages/AdminQuarterlyGoals");
export const loadAskMokshaPage = () => import("@/pages/AskMoksha");

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/moksha": loadAskMokshaPage,
  "/pods": loadAdminPodsPage,
  "/challenges": loadChallengeVaultPage,
  "/knowledge-space": loadAdminKnowledgeSpacePage,
  "/content": loadContentStudioPage,
  "/events": loadEventManagementPage,
  "/quarterly-goals": loadAdminQuarterlyGoalsPage,
};

export function preloadAdminRoute(pathname: string) {
  const preload = routePreloaders[pathname];
  return preload ? preload() : Promise.resolve();
}

export function preloadAdminRouteModules() {
  return Promise.all(Object.values(routePreloaders).map((preload) => preload()));
}
