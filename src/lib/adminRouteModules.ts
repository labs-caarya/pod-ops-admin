export const loadAdminPodsPage = () => import("@/pages/AdminPods");
export const loadAdminPodDetailPage = () => import("@/pages/AdminPodDetail");
export const loadAdminPodRegistryPage = () => import("@/pages/AdminPodRegistry");
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
export const loadProgressReportPage = () => import("@/pages/ProgressReport");
export const loadContentStudioPage = () => import("@/pages/ContentStudio");
export const loadProgramManagementPage = () => import("@/pages/ProgramManagement");
export const loadEventManagementPage = () => import("@/pages/EventManagement");
export const loadAdminQuarterlyGoalsPage = () => import("@/pages/AdminQuarterlyGoals");
export const loadAskMokshaPage = () => import("@/pages/AskMoksha");
export const loadPartnersPage = () => import("@/pages/Partners");
export const loadPartnerDetailPage = () => import("@/pages/PartnerDetail");
export const loadTalentMapPage = () => import("@/pages/TalentMap");
export const loadResearchPage = () => import("@/pages/Research");
export const loadResearchDetailPage = () => import("@/pages/ResearchDetail");
export const loadRolodexPage = () => import("@/pages/Rolodex");
export const loadOpportunitiesPage = () => import("@/pages/Opportunities");
export const loadPlacementAgentPage = () => import("@/pages/PlacementAgent");
export const loadCommunityNewsPage = () => import("@/pages/CommunityNews");
export const loadExperienceCreditsPage = () => import("@/pages/ExperienceCredits");
export const loadAssessmentsPage = () => import("@/pages/Assessments");
export const loadInternalEventsPage = () => import("@/pages/InternalEvents");

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/progress-report": loadProgressReportPage,
  "/moksha": loadAskMokshaPage,
  "/pods": loadAdminPodsPage,
  "/challenges": loadChallengeVaultPage,
  "/knowledge-space": loadAdminKnowledgeSpacePage,
  "/content": loadContentStudioPage,
  "/programs": loadProgramManagementPage,
  "/events": loadEventManagementPage,
  "/quarterly-targets": loadAdminQuarterlyGoalsPage,
  "/partners": loadPartnersPage,
  "/talent-map": loadTalentMapPage,
  "/research": loadResearchPage,
  "/rolodex": loadRolodexPage,
  "/opportunities": loadOpportunitiesPage,
  "/placement": loadPlacementAgentPage,
  "/community-news": loadCommunityNewsPage,
  "/experience": loadExperienceCreditsPage,
  "/assessments": loadAssessmentsPage,
  "/internal-events": loadInternalEventsPage,
};

export function preloadAdminRoute(pathname: string) {
  const preload = routePreloaders[pathname];
  return preload ? preload() : Promise.resolve();
}

export function preloadAdminRouteModules() {
  return Promise.all(Object.values(routePreloaders).map((preload) => preload()));
}
