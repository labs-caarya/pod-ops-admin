import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/utils";

export function Topbar() {
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

  const name = user?.name || user?.username || user?.phoneNumber || "Pod Member";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-base/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
          <img src="/admin-logo.png" alt="" className="h-full w-full object-cover" />
        </div>
        <p className="font-display text-sm font-bold text-ink">Pod Admin</p>
      </div>
      <div className="hidden min-w-0 lg:block">
        <p className="font-display text-sm font-bold text-ink">Pod Ops Control Room</p>
        <p className="text-xs text-ink-faint">Network overview, pod portfolio, and operations.</p>
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
