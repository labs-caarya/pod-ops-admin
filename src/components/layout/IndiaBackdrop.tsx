import { CAMPUS_MARKERS } from "@/lib/data/campusLocations";
import { IndiaMapCanvas } from "./IndiaMapCanvas";

interface IndiaBackdropProps {
  showMarkers?: boolean;
}

export default function IndiaBackdrop({ showMarkers = false }: IndiaBackdropProps) {
  const markers = showMarkers ? CAMPUS_MARKERS : undefined;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      {/* Ambient glows */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 40%, rgba(225,29,72,0.12), transparent 60%)," +
            "radial-gradient(80% 60% at 50% 90%, rgba(245,158,11,0.08), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(110% 80% at 80% -10%, rgba(225,29,72,0.16), transparent 55%)," +
            "radial-gradient(90% 70% at 0% 110%, rgba(245,158,11,0.10), transparent 55%)," +
            "radial-gradient(120% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Mobile: scrim FIRST, then map + markers on top so dots stay visible */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,9,11,0.12) 0%, rgba(14,9,11,0.28) 50%, rgba(14,9,11,0.4) 100%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center md:hidden">
        <IndiaMapCanvas
          animate
          prominent
          markers={markers}
          labelMode="hover"
          pinSize="lg"
          className="size-[min(108vmin,820px)] max-w-none"
        />
      </div>

      {/* Desktop: large map on the right */}
      <div className="absolute right-[-2%] top-1/2 hidden h-[132%] -translate-y-1/2 md:block">
        <IndiaMapCanvas
          animate
          markers={markers}
          labelMode="hover"
          className="h-full aspect-square w-auto"
        />
      </div>
    </div>
  );
}
