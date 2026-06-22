import { useState, useRef, useEffect } from "react";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/utils";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = user?.name || user?.phoneNumber || "Pod Member";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-base/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="focus-ring rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="font-display text-sm font-bold text-ink">Pod Operating Portal</p>
          <p className="hidden text-xs text-ink-faint sm:block">Research · Outreach · Talent · Partners</p>
        </div>
      </div>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="focus-ring flex items-center gap-2 rounded-xl border border-line bg-surface-2 py-1.5 pl-1.5 pr-2.5 hover:border-line-strong"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-ruby-bright to-amber text-xs font-bold text-[#1a0c10]">
            {initials(name)}
          </div>
          <span className="hidden max-w-[140px] truncate text-sm text-ink sm:block">{name}</span>
          <ChevronDown className="h-4 w-4 text-ink-faint" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-base-2 shadow-2xl">
            <div className="border-b border-line px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-ink-faint">{user?.primary_role || "Pod member"}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-bad hover:bg-surface-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
