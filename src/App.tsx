import { lazy } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import IndiaBackdrop from "@/components/layout/IndiaBackdrop";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import AskMoksha from "@/pages/AskMoksha";
import {
  loadAdminPodRegistryPage,
  loadAdminPodDetailPage,
  loadAdminPodsPage,
  loadAdminPodMentorsPage,
  loadChallengeVaultPage,
  loadChallengeDetailPage,
  loadFutureCraftApplicantsPage,
  loadCastleApplicantsPage,
  loadIndustryApplicantsPage,
  loadAdminKnowledgeSpacePage,
  loadPodReportsPage,
  loadProgressReportPage,
  loadContentStudioPage,
  loadProgramManagementPage,
  loadEventManagementPage,
  loadAdminQuarterlyGoalsPage,
  loadPartnersPage,
  loadPartnerDetailPage,
  loadTalentMapPage,
  loadResearchPage,
  loadResearchDetailPage,
  loadRolodexPage,
  loadOpportunitiesPage,
  loadPlacementAgentPage,
  loadCommunityNewsPage,
} from "@/lib/adminRouteModules";

const AdminPods = lazy(loadAdminPodsPage);
const AdminPodDetail = lazy(loadAdminPodDetailPage);
const AdminPodRegistry = lazy(loadAdminPodRegistryPage);
const AdminPodMentors = lazy(loadAdminPodMentorsPage);
const ChallengeVault = lazy(loadChallengeVaultPage);
const ChallengeDetail = lazy(loadChallengeDetailPage);
const FutureCraftApplicants = lazy(loadFutureCraftApplicantsPage);
const CastleApplicants = lazy(loadCastleApplicantsPage);
const IndustryApplicants = lazy(loadIndustryApplicantsPage);
const AdminKnowledgeSpace = lazy(loadAdminKnowledgeSpacePage);
const PodReports = lazy(loadPodReportsPage);
const ProgressReport = lazy(loadProgressReportPage);
const ContentStudio = lazy(loadContentStudioPage);
const ProgramManagement = lazy(loadProgramManagementPage);
const EventManagement = lazy(loadEventManagementPage);
const AdminQuarterlyGoals = lazy(loadAdminQuarterlyGoalsPage);
const Partners = lazy(loadPartnersPage);
const PartnerDetail = lazy(loadPartnerDetailPage);
const TalentMap = lazy(loadTalentMapPage);
const Research = lazy(loadResearchPage);
const ResearchDetail = lazy(loadResearchDetailPage);
const Rolodex = lazy(loadRolodexPage);
const Opportunities = lazy(loadOpportunitiesPage);
const PlacementAgent = lazy(loadPlacementAgentPage);
const CommunityNews = lazy(loadCommunityNewsPage);

function PodOpsRedirect() {
  const { collegeId = "" } = useParams();
  return <Navigate to={`/pods/${collegeId}?tab=ops`} replace />;
}

function ProtectedRoutes() {
  const { isAuthenticated, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ruby-bright" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <AppShell />;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const onLogin = location.pathname === "/login";

  return (
    <>
      <IndiaBackdrop showMarkers={onLogin} />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/progress-report" element={<ProgressReport />} />
          <Route path="/moksha" element={<AskMoksha />} />
          <Route path="/pods" element={<AdminPods />} />
          <Route path="/pods/:podId" element={<AdminPodDetail />} />
          <Route path="/reports" element={<PodReports />} />
          <Route path="/pods-admin" element={<AdminPodRegistry />} />
          <Route path="/challenges" element={<ChallengeVault />} />
          <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />
          <Route path="/pod-activation" element={<Navigate to="/" replace />} />
          <Route path="/pod-activation/:collegeId" element={<PodOpsRedirect />} />
          <Route path="/knowledge-space" element={<AdminKnowledgeSpace />} />
          <Route path="/content" element={<ContentStudio />} />
          <Route path="/programs" element={<ProgramManagement />} />
          <Route path="/events" element={<EventManagement />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:partnerId" element={<PartnerDetail />} />
          <Route path="/talent-map" element={<TalentMap />} />
          <Route path="/research" element={<Research />} />
          <Route path="/research/:researchId" element={<ResearchDetail />} />
          <Route path="/rolodex" element={<Rolodex />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/placement" element={<PlacementAgent />} />
          <Route path="/community-news" element={<CommunityNews />} />
          <Route path="/quarterly-targets" element={<AdminQuarterlyGoals />} />
          <Route path="/quarterly-goals" element={<Navigate to="/quarterly-targets" replace />} />
          <Route path="/leader-goals" element={<Navigate to="/pods" replace />} />
          <Route path="/mentors" element={<AdminPodMentors />} />
          <Route path="/applicants/futurecraft" element={<FutureCraftApplicants />} />
          <Route path="/applicants/castle" element={<CastleApplicants />} />
          <Route path="/applicants/industry" element={<IndustryApplicants />} />
          <Route path="/future-craft-applicants" element={<Navigate to="/applicants/futurecraft" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
