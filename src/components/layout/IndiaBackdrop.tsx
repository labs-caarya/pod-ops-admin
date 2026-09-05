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
      {/* Ambient grid + glows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 82% 8%, rgba(251,191,36,0.08), transparent 58%)," +
            "radial-gradient(72% 62% at 8% 90%, rgba(251,58,99,0.07), transparent 60%)," +
            "radial-gradient(120% 120% at 50% 50%, transparent 38%, rgba(0,0,0,0.58) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.65) 1px, transparent 1px)",
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
      {showMarkers ? (
        <>
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

          <div className="absolute right-[-2%] top-1/2 hidden h-[132%] -translate-y-1/2 md:block">
            <IndiaMapCanvas
              animate
              markers={markers}
              labelMode="hover"
              className="h-full aspect-square w-auto"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
