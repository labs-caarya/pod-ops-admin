import { Suspense, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileTabBar } from "./MobileTabBar";
import { MokshaAssistant } from "@/components/moksha/MokshaAssistant";
import { Loader2 } from "lucide-react";
import { preloadAdminRouteModules } from "@/lib/adminRouteModules";
import { warmAdminWorkspaceCache } from "@/lib/adminQueries";

export function AppShell() {
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

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="mx-auto w-full max-w-[90rem] px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <Suspense fallback={<RouteLoadFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <MobileTabBar />
        <MokshaAssistant />
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
