import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Loader2, X } from "lucide-react";
import { preloadAdminRouteModules } from "@/lib/adminRouteModules";
import { warmAdminWorkspaceCache } from "@/lib/adminQueries";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const hasWarmedWorkspace = useRef(false);

  useEffect(() => {
    if (hasWarmedWorkspace.current) return;
    hasWarmedWorkspace.current = true;

    void Promise.allSettled([
      preloadAdminRouteModules(),
      warmAdminWorkspaceCache(queryClient),
    ]);
  }, [queryClient]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-6 lg:px-8 lg:py-8">
            <Suspense fallback={<RouteLoadFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function RouteLoadFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-11rem)] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-ruby-bright" />
    </div>
  );
}
