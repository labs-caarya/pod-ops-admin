import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, ChevronDown } from "lucide-react";
import type { PodPortfolioEntry } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import {
  buildQuarterlySnapshot,
  getQuarterlyGoalDef,
  quarterlyProgressSource,
  QUARTERLY_SECTIONS,
} from "@/lib/quarterlyGoals";
import { cn } from "@/lib/utils";

type QuarterlySnapshot = ReturnType<typeof buildQuarterlySnapshot>;

function progressTone(percent: number): "ruby" | "amber" | "good" {
  if (percent >= 70) return "good";
  if (percent >= 35) return "amber";
  return "ruby";
}

export function QuarterlyTargetsBreakdown({
  snapshot,
  className,
}: {
  snapshot: QuarterlySnapshot;
  className?: string;
}) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  function toggleSection(sectionId: string) {
    setOpenSectionId((current) => (current === sectionId ? null : sectionId));
  }

  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {snapshot.sections.map((section) => {
        const def = QUARTERLY_SECTIONS.find((item) => item.id === section.id);
        if (!def) return null;
        const open = openSectionId === section.id;
        return (
          <li key={section.id} className="overflow-hidden rounded-xl border border-line bg-surface-2">
            <button
              type="button"
              className="focus-ring relative w-full px-3 py-2.5 pr-10 text-left"
              aria-expanded={open}
              aria-label={open ? `Collapse ${def.title}` : `Expand ${def.title} progress`}
              onClick={() => toggleSection(section.id)}
            >
              <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted">
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                  aria-hidden="true"
                />
              </span>
              <span className="block min-w-0 pr-1">
                <span className="truncate text-sm font-semibold text-ink">{def.title}</span>
                <ProgressBar className="mt-2 h-1.5" value={section.percent} tone={progressTone(section.percent)} />
                <span className="mt-1 block text-[11px] text-ink-faint">
                  {section.complete}/{section.total} targets met · <span className="font-bold tabular-nums text-ink-muted">{section.percent}%</span>
                </span>
              </span>
            </button>
            {open ? (
              <div className="border-t border-line px-3 pb-3 pt-2">
                <ul className="space-y-2">
                  {section.goals.map((goalProgress) => {
                    const goal = getQuarterlyGoalDef(goalProgress.id);
                    if (!goal) return null;
                    return (
                      <li key={goalProgress.id} className="rounded-lg border border-line bg-surface px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold leading-snug text-ink">{goal.title}</p>
                          {goalProgress.complete ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Target met" />
                          ) : (
                            <Badge tone={progressTone(goalProgress.percent)} className="shrink-0 text-[10px] tabular-nums">
                              {goalProgress.percent}%
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 font-display text-sm font-black tabular-nums text-ink">
                          {goalProgress.current}
                          <span className="text-xs font-semibold text-ink-muted"> / {goalProgress.target} {goal.unit}</span>
                        </p>
                        <ProgressBar className="mt-1.5 h-1" value={goalProgress.percent} tone={progressTone(goalProgress.percent)} />
                        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{quarterlyProgressSource(goal.id)}</p>
                        <Link
                          to={goal.href}
                          className="focus-ring mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ruby-bright hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {goal.trackHint}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function PodQuarterlyProgressCard({
  pod,
  snapshot,
}: {
  pod: PodPortfolioEntry;
  snapshot: QuarterlySnapshot;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative rounded-xl border border-line bg-surface-2 p-4 pr-12">
      <button
        type="button"
        className="focus-ring absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
        aria-expanded={open}
        aria-label={open ? "Hide target breakdown" : "Show where progress was made"}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      <Link to={`/pods/${pod.id}`} className="focus-ring block min-w-0 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{pod.name}</p>
            <p className="text-xs text-ink-muted">{pod.collegeName} · {snapshot.complete}/{snapshot.total} targets</p>
          </div>
          <span className="font-display text-lg font-black tabular-nums text-ink">{snapshot.percent}%</span>
        </div>
        <ProgressBar className="mt-2" value={snapshot.percent} tone={progressTone(snapshot.percent)} />
      </Link>
      {open ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs text-ink-faint">Where progress is counted for {pod.name}</p>
          <QuarterlyTargetsBreakdown snapshot={snapshot} className="sm:grid-cols-1" />
        </div>
      ) : null}
    </div>
  );
}
