import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "@/config/nav";
import { preloadAdminRoute } from "@/lib/adminRouteModules";
import { cn } from "@/lib/utils";
import { AdminLogo } from "./CaaryaLogo";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-60 flex-col border-r border-line bg-base-2/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <AdminLogo className="h-9" />
      </div>

      {/* Pod identity */}
      <div className="mx-3 mt-3 rounded-xl border border-line bg-gradient-to-br from-surface-2 to-base p-3">
        <div className="flex flex-col gap-1.5">
          <p className="truncate text-xs text-ink-muted">All India Pod Network</p>
          <span className="truncate text-[10px] text-ink-faint">Live operations and network oversight.</span>
          <span className="w-fit rounded-full bg-ruby/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ruby-bright">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} className="mb-4">
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
        Caarya · Admin dashboard
      </div>
    </div>
  );
}
