import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Layers, Network, Vault } from "lucide-react";
import { NAV_SECTIONS, type NavItem } from "@/config/nav";
import { preloadAdminRoute } from "@/lib/adminRouteModules";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const TAB_PATHS = new Set(["/", "/pods", "/challenges"]);
const MORE_SECTIONS = NAV_SECTIONS.map((section) => ({
  ...section,
  items: section.items.filter((item) => !TAB_PATHS.has(item.to)),
}));

function isDashboardPath(pathname: string) {
  return pathname === "/";
}

function isMokshaPath(pathname: string) {
  return pathname === "/moksha";
}

function isPodsPath(pathname: string) {
  return pathname === "/pods" || pathname.startsWith("/pods/");
}

function isChallengesPath(pathname: string) {
  return pathname === "/challenges" || pathname.startsWith("/challenges/");
}

export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [operationsOpen, setOperationsOpen] = useState(false);

  const { user } = useAuth();
  const crewManager = user?.accountType === "crew_manager" || user?.permissions?.includes("pod_ops:crew_manager") === true;
  const sections = useMemo(() => crewManager
    ? MORE_SECTIONS.map((section) => ({ ...section, items: section.items.filter((item) => item.crewManager) })).filter((section) => section.items.length)
    : MORE_SECTIONS, [crewManager]);
  const operationsActive = sections.some(({ items }) => items.some((item) =>
    !item.external && (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))));

  function openOperations() {
    setOperationsOpen(true);
  }

  function goOperations(to: string) {
    setOperationsOpen(false);
    navigate(to);
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base-2/95 backdrop-blur-xl lg:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          <TabLink
            to="/"
            label="Dashboard"
            icon={LayoutDashboard}
            active={isDashboardPath(location.pathname)}
          />
          <TabLink
            to="/pods"
            label="Pods"
            icon={Network}
            active={isPodsPath(location.pathname)}
          />
          <div className="flex justify-center pb-1">
            <Link
              to="/moksha"
              aria-label="Moksha chat"
              aria-current={isMokshaPath(location.pathname) ? "page" : undefined}
              className={cn(
                "focus-ring -mt-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border bg-surface p-0.5 shadow-lg",
                isMokshaPath(location.pathname) ? "border-ruby/50 ring-2 ring-ruby/25" : "border-line",
              )}
              onMouseEnter={() => void preloadAdminRoute("/moksha")}
              onFocus={() => void preloadAdminRoute("/moksha")}
            >
              <img src="/moksha-icon.png" alt="Moksha" className="h-full w-full rounded-full object-cover" />
            </Link>
          </div>
          <TabLink
            to="/challenges"
            label="Challenges"
            icon={Vault}
            active={isChallengesPath(location.pathname)}
          />
          <OperationsTab active={operationsActive} open={operationsOpen} onClick={openOperations} />
        </div>
      </nav>

      <ResponsiveSheet
        open={operationsOpen}
        onClose={() => setOperationsOpen(false)}
        title="Workspaces"
        subtitle="Choose a workspace"
      >
        <div className="space-y-4">
          {sections.map(({ heading, items }) => (
            <MobileNavGroup key={heading} heading={heading} items={items} pathname={location.pathname} onSelect={goOperations} onExternal={() => setOperationsOpen(false)} />
          ))}
        </div>
      </ResponsiveSheet>
    </>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => void preloadAdminRoute(to)}
      onFocus={() => void preloadAdminRoute(to)}
      className={cn(
        "focus-ring flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors",
        active ? "text-ruby-bright" : "text-ink-muted hover:text-ink",
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-ruby-bright" : "text-ink-faint")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function MobileNavGroup({
  heading,
  items,
  pathname,
  onSelect,
  onExternal,
}: {
  heading: string;
  items: NavItem[];
  pathname: string;
  onSelect: (to: string) => void;
  onExternal: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">{heading}</p>
      {items.map((item) => {
        const selected =
          !item.external && (pathname === item.to || pathname.startsWith(`${item.to}/`));
        return (
          <button
            key={item.to}
            type="button"
            onClick={() => {
              if (item.external) {
                onExternal();
                window.open(item.to, "_blank", "noopener,noreferrer");
                return;
              }
              onSelect(item.to);
            }}
            onMouseEnter={() => {
              if (!item.external) void preloadAdminRoute(item.to);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              selected ? "border-ruby/40 bg-ruby/10" : "border-line bg-surface-2 hover:border-line-strong",
            )}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", selected ? "text-ruby-bright" : "text-ink-muted")} />
            <span className="text-sm font-semibold text-ink">{item.label}</span>
            {item.external ? (
              <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-ink-faint">New tab</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function OperationsTab({ active, open, onClick }: { active: boolean; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "focus-ring flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors",
        active ? "text-ruby-bright" : "text-ink-muted hover:text-ink",
      )}
    >
      <Layers className={cn("h-5 w-5", active ? "text-ruby-bright" : "text-ink-faint")} />
      <span>More</span>
    </button>
  );
}
