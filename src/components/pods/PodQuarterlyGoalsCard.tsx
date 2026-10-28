import { Link } from "react-router-dom";
import { ArrowUpRight, Flag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Misc";
import { buildQuarterlySnapshot, QUARTERLY_SECTIONS } from "@/lib/quarterlyGoals";

type QuarterlySnapshot = ReturnType<typeof buildQuarterlySnapshot>;

function progressTone(percent: number): "ruby" | "amber" | "good" {
  if (percent >= 70) return "good";
  if (percent >= 35) return "amber";
  return "ruby";
}

export function PodQuarterlyGoalsCard({
  snapshot,
}: {
  snapshot: QuarterlySnapshot;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-muted">
            <Flag className="h-3.5 w-3.5 text-ruby-bright" />
            Quarterly Goals
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink">Recommended quarter for financial stability</h2>
        </div>
        <Link to="/quarterly-goals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ruby-bright hover:underline">
          Playbook
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-sm text-ink-muted">{snapshot.complete} of {snapshot.total} targets met</p>
        <span className="font-display text-2xl font-black tabular-nums text-ink">{snapshot.percent}%</span>
      </div>
      <ProgressBar className="mt-2" value={snapshot.percent} tone={progressTone(snapshot.percent)} />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {snapshot.sections.map((section) => {
          const def = QUARTERLY_SECTIONS.find((item) => item.id === section.id);
          if (!def) return null;
          return (
            <li key={section.id} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink">{def.title}</p>
                <span className="text-xs font-bold tabular-nums text-ink-muted">{section.percent}%</span>
              </div>
              <ProgressBar className="mt-2 h-1.5" value={section.percent} tone={progressTone(section.percent)} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
