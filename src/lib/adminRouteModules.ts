export const loadAdminPodsPage = () => import("@/pages/AdminPods");
export const loadAdminPodRegistryPage = () => import("@/pages/AdminPodRegistry");
export const loadAdminUsersPage = () => import("@/pages/AdminUsers");
export const loadFutureCraftApplicantsPage = () => import("@/pages/FutureCraftApplicants");

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/pods": loadAdminPodsPage,
  "/pods-admin": loadAdminPodRegistryPage,
  "/access": loadAdminUsersPage,
  "/future-craft-applicants": loadFutureCraftApplicantsPage,
};

export function preloadAdminRoute(pathname: string) {
  const preload = routePreloaders[pathname];
  return preload ? preload() : Promise.resolve();
}

export function preloadAdminRouteModules() {
  return Promise.all(Object.values(routePreloaders).map((preload) => preload()));
}
