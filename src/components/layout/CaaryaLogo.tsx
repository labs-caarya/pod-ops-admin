/** Caarya mark, recolored for the dark ruby/amber theme. */
export function CaaryaLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 112 112" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
        <circle cx="56" cy="56" r="40" fill="#9f1239" opacity="0.45" />
        <rect x="28" y="28" width="56" height="56" fill="#e11d48" />
        <polygon points="56,76 84,36 28,36" fill="#fbbf24" />
      </svg>
      <span className="font-display text-lg font-black lowercase tracking-tight text-ink">caarya</span>
    </div>
  );
}
