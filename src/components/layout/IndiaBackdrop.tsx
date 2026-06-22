import { CAMPUS_MARKERS } from "@/lib/data/campusLocations";
import { IndiaMapCanvas } from "./IndiaMapCanvas";

interface IndiaBackdropProps {
  /** Show campus hub markers (login screen) */
  showMarkers?: boolean;
}

export default function IndiaBackdrop({ showMarkers = false }: IndiaBackdropProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      <div
        className="absolute inset-0"
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

      <div className="absolute right-[-2%] top-1/2 h-[132%] -translate-y-1/2">
        <IndiaMapCanvas
          animate
          markers={showMarkers ? CAMPUS_MARKERS : undefined}
          labelMode="hover"
          className="h-full max-w-none"
        />
      </div>
    </div>
  );
}
