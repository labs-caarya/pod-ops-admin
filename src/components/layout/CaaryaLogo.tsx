import { cn } from "@/lib/utils";

/** Caarya mark + wordmark — uses `public/logo.svg` */
export function CaaryaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        className="h-full w-auto shrink-0"
      />
      <span className="font-display text-lg font-black lowercase tracking-tight text-ink">caarya</span>
    </div>
  );
}
