import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import IndiaBackdrop from "@/components/layout/IndiaBackdrop";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPods from "@/pages/AdminPods";
import AdminPodRegistry from "@/pages/AdminPodRegistry";
import AdminUsers from "@/pages/AdminUsers";
import FutureCraftApplicants from "@/pages/FutureCraftApplicants";

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
          <Route path="/future-craft-applicants" element={<FutureCraftApplicants />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
