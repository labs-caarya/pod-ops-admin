import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./CompactStatGrid.css";

export function CompactStatGrid({
  children,
  label = "Statistics",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section
      className={cn("compact-stat-strip flex gap-2 sm:grid sm:gap-3", className)}
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </section>
  );
}
