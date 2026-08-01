import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import IndiaBackdrop from "@/components/layout/IndiaBackdrop";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import {
  loadAdminPodRegistryPage,
  loadAdminPodsPage,
  loadAdminUsersPage,
  loadAdminLeaderGoalsPage,
  loadAdminPodMentorsPage,
  loadChallengeVaultPage,
  loadChallengeDetailPage,
  loadFutureCraftApplicantsPage,
  loadCastleApplicantsPage,
  loadIndustryApplicantsPage,
  loadAdminPodActivationPage,
  loadAdminPodActivationDetailPage,
} from "@/lib/adminRouteModules";

const AdminPods = lazy(loadAdminPodsPage);
const AdminPodRegistry = lazy(loadAdminPodRegistryPage);
const AdminUsers = lazy(loadAdminUsersPage);
const AdminLeaderGoals = lazy(loadAdminLeaderGoalsPage);
const AdminPodMentors = lazy(loadAdminPodMentorsPage);
const ChallengeVault = lazy(loadChallengeVaultPage);
const ChallengeDetail = lazy(loadChallengeDetailPage);
const FutureCraftApplicants = lazy(loadFutureCraftApplicantsPage);
const CastleApplicants = lazy(loadCastleApplicantsPage);
const IndustryApplicants = lazy(loadIndustryApplicantsPage);
const AdminPodActivation = lazy(loadAdminPodActivationPage);
const AdminPodActivationDetail = lazy(loadAdminPodActivationDetailPage);

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
          <Route path="/pods" element={<AdminPods />} />
          <Route path="/pods-admin" element={<AdminPodRegistry />} />
          <Route path="/access" element={<AdminUsers />} />
          <Route path="/challenges" element={<ChallengeVault />} />
          <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />
          <Route path="/pod-activation" element={<AdminPodActivation />} />
          <Route path="/pod-activation/:collegeId" element={<AdminPodActivationDetail />} />
          <Route path="/leader-goals" element={<AdminLeaderGoals />} />
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
