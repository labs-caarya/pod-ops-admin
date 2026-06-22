import { HIVE_ACRONYM } from "@/lib/copy/hive";

/** Subtle HIVE acronym line — use under page titles */
export function HiveAcronym({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] tracking-wide text-ink-faint ${className}`}>
      <span className="font-semibold text-ink-muted">HIVE</span>
      {" · "}
      {HIVE_ACRONYM}
    </p>
  );
}
