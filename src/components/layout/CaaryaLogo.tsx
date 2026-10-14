import { cn } from "@/lib/utils";

export function AdminLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/admin-logo.png"
        alt="Pod Ops Admin"
        className="h-full w-auto shrink-0"
      />
      {showText && (
        <span className="font-display text-lg font-black tracking-tight text-ink">Pod Ops Admin</span>
      )}
    </div>
  );
}

export const CaaryaLogo = AdminLogo;
