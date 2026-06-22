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
  labelMode?: "hover" | "always";
  /** Larger pins for mobile full-screen map */
  pinSize?: "sm" | "lg";
}

export function IndiaMapCanvas({
  className,
  markers,
  animate = false,
  prominent = false,
  labelMode = "always",
  pinSize = "sm",
}: IndiaMapCanvasProps) {
  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        className={cn("absolute inset-0", animate && "animate-[float-slow_14s_ease-in-out_infinite]")}
        style={{
          ...MAP_MASK,
          background: prominent
            ? "linear-gradient(155deg, rgba(251,58,99,0.22) 0%, rgba(245,158,11,0.12) 50%, rgba(251,58,99,0.08) 100%)"
            : "linear-gradient(155deg, rgba(251,58,99,0.16) 0%, rgba(245,158,11,0.09) 50%, rgba(251,58,99,0.05) 100%)",
        }}
      />

      <img
        src="/india-map.svg"
        alt=""
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.09]",
          animate && "animate-[float-slow_14s_ease-in-out_infinite]",
        )}
        style={{
          filter: "invert(36%) sepia(90%) saturate(1800%) hue-rotate(315deg) brightness(100%)",
        }}
      />

      {markers?.map((marker, i) => (
        <CampusPin key={marker.id} marker={marker} delayMs={i * 120} labelMode={labelMode} pinSize={pinSize} />
      ))}
    </div>
  );
}

function CampusPin({
  marker,
  delayMs,
  labelMode,
  pinSize,
}: {
  marker: CampusMarker;
  delayMs: number;
  labelMode: "hover" | "always";
  pinSize: "sm" | "lg";
}) {
  const large = pinSize === "lg";

  return (
    <div
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
    >
      <span
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ruby-bright/40 animate-ping",
          large ? "h-7 w-7" : "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6",
        )}
        style={{ animationDuration: "2.4s", animationDelay: `${delayMs}ms` }}
      />
      <span
        className={cn(
          "relative block rounded-full border border-white/40 bg-gradient-to-br from-ruby-bright to-amber",
          large
            ? "h-3 w-3 shadow-[0_0_14px_rgba(251,58,99,0.85)]"
            : "h-1.5 w-1.5 shadow-[0_0_8px_rgba(251,58,99,0.65)] sm:h-2 sm:w-2 md:h-2.5 md:w-2.5",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-line/80 bg-base-2/95 px-2 py-0.5 text-[9px] font-semibold text-ink shadow-lg backdrop-blur-sm transition-opacity duration-200 sm:left-3 sm:block sm:px-2 sm:py-1 sm:text-[10px]",
          labelMode === "hover" ? "opacity-0 group-hover:opacity-100" : "opacity-100",
        )}
      >
        {marker.label}
        {marker.hint && (
          <span className="ml-1 hidden font-normal text-ink-faint md:inline">· {marker.hint}</span>
        )}
      </span>
    </div>
  );
}
