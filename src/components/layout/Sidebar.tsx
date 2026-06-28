import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "@/config/nav";
import { preloadAdminRoute } from "@/lib/adminRouteModules";
import { ADMIN_WORKSPACE } from "@/lib/admin/demoData";
import { cn } from "@/lib/utils";
import { CaaryaLogo } from "./CaaryaLogo";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-line bg-base-2/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <CaaryaLogo className="h-7" />
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Pod Ops</span>
      </div>

      {/* Pod identity */}
      <div className="mx-4 mt-4 rounded-2xl border border-line bg-gradient-to-br from-surface-2 to-base p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ruby-bright to-amber text-sm font-black text-[#1a0c10]">
            {ADMIN_WORKSPACE.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-ink">{ADMIN_WORKSPACE.name}</p>
            <p className="truncate text-xs text-ink-muted">{ADMIN_WORKSPACE.network}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="truncate text-[10px] text-ink-faint">{ADMIN_WORKSPACE.tagline}</span>
          <span className="w-fit rounded-full bg-ruby/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ruby-bright">
            Demo admin
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  onMouseEnter={() => void preloadAdminRoute(item.to)}
                  onFocus={() => void preloadAdminRoute(item.to)}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                      isActive
                        ? "bg-gradient-to-r from-ruby/20 to-amber/10 font-semibold text-ink shadow-inner"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-ruby-bright" : "text-ink-faint group-hover:text-ink-muted",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-3 text-[10px] text-ink-faint">
        Caarya · Pod Ops Admin Demo
      </div>
    </div>
  );
}
