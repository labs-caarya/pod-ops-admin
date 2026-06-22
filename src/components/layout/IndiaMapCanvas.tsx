import { cn } from "@/lib/utils";
import type { CampusMarker } from "@/lib/data/campusLocations";

const MAP_MASK = {
  WebkitMaskImage: "url(/india-map.svg)",
  maskImage: "url(/india-map.svg)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
} as const;

interface IndiaMapCanvasProps {
  className?: string;
  markers?: CampusMarker[];
  animate?: boolean;
  prominent?: boolean;
  /** "hover" keeps labels hidden until hover — cleaner on backdrop */
  labelMode?: "hover" | "always";
}

export function IndiaMapCanvas({
  className,
  markers,
  animate = false,
  prominent = false,
  labelMode = "always",
}: IndiaMapCanvasProps) {
  return (
    <div className={cn("relative aspect-square w-full max-w-lg", className)}>
      {/* Silhouette fill */}
      <div
        className={cn(
          "absolute inset-0",
          animate && "animate-[float-slow_14s_ease-in-out_infinite]",
        )}
        style={{
          ...MAP_MASK,
          background: prominent
            ? "linear-gradient(155deg, rgba(251,58,99,0.22) 0%, rgba(245,158,11,0.12) 50%, rgba(251,58,99,0.08) 100%)"
            : "linear-gradient(155deg, rgba(251,58,99,0.16) 0%, rgba(245,158,11,0.09) 50%, rgba(251,58,99,0.05) 100%)",
        }}
      />

      {/* Edge trace for definition */}
      <img
        src="/india-map.svg"
        alt=""
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.09]",
          animate && "animate-[float-slow_14s_ease-in-out_infinite]",
        )}
        style={{
          filter:
            "invert(36%) sepia(90%) saturate(1800%) hue-rotate(315deg) brightness(100%)",
        }}
      />

      {/* Campus markers */}
      {markers?.map((marker, i) => (
        <CampusPin key={marker.id} marker={marker} delayMs={i * 120} labelMode={labelMode} />
      ))}
    </div>
  );
}

function CampusPin({
  marker,
  delayMs,
  labelMode,
}: {
  marker: CampusMarker;
  delayMs: number;
  labelMode: "hover" | "always";
}) {
  return (
    <div
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ruby-bright/30 animate-ping"
        style={{ animationDuration: "2.4s", animationDelay: `${delayMs}ms` }}
      />
      <span className="relative block h-2.5 w-2.5 rounded-full border border-white/30 bg-gradient-to-br from-ruby-bright to-amber shadow-[0_0_10px_rgba(251,58,99,0.7)]" />
      <span
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-lg border border-line/80 bg-base-2/95 px-2 py-1 text-[10px] font-semibold text-ink shadow-lg backdrop-blur-sm transition-opacity duration-200",
          labelMode === "hover" ? "opacity-0 group-hover:opacity-100" : "opacity-100",
        )}
      >
        {marker.label}
        {marker.hint && (
          <span className="ml-1 font-normal text-ink-faint">· {marker.hint}</span>
        )}
      </span>
    </div>
  );
}
