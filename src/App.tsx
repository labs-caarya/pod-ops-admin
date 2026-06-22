import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import IndiaBackdrop from "@/components/layout/IndiaBackdrop";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Research from "@/pages/Research";
import Rolodex from "@/pages/Rolodex";
import TalentMap from "@/pages/TalentMap";
import Opportunities from "@/pages/Opportunities";
import Partners from "@/pages/Partners";
import PartnerDetail from "@/pages/PartnerDetail";
import AskMoksha from "@/pages/AskMoksha";

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/research" element={<Research />} />
          <Route path="/rolodex" element={<Rolodex />} />
          <Route path="/talent" element={<TalentMap />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:partnerId" element={<PartnerDetail />} />
          <Route path="/ask" element={<AskMoksha />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
