import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getTalentDistribution, TALENT_ROLES } from "@/lib/data/services";
import { cn } from "@/lib/utils";
import type { TalentMember } from "@/lib/types";

const ROLE_COLORS = [
  "bg-ruby/20 text-ruby-bright",
  "bg-amber/20 text-amber-bright",
  "bg-info/20 text-info",
  "bg-good/20 text-good",
  "bg-ruby/15 text-ink",
  "bg-amber/15 text-ink-muted",
  "bg-surface-3 text-ink-muted",
  "bg-surface-3 text-ink-faint",
  "bg-surface-3 text-ink-faint",
];

export function TalentDistributionMap({ talent, compact }: { talent: TalentMember[]; compact?: boolean }) {
  const rows = getTalentDistribution(talent);
  const total = talent.length;

  const content = (
    <>
      <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3")}>
        {TALENT_ROLES.map((role, i) => {
          const row = rows.find((r) => r.role === role);
          const count = row?.count ?? 0;
          return (
            <div
              key={role}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition-colors",
                count > 0 && "hover:border-line-strong",
              )}
            >
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS[i % ROLE_COLORS.length])}>
                {role}
              </span>
              <span className="font-display text-lg font-black text-ink">{count}</span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-ink-faint">
          {total} students mapped across {rows.length} role{rows.length === 1 ? "" : "s"}
        </p>
      )}
    </>
  );

  if (compact) return content;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Talent distribution</h2>
          <p className="text-sm text-ink-muted">Developers, designers, nano-influencers & more in your mapped pool.</p>
        </div>
        <Link to="/talent" className="flex shrink-0 items-center gap-1 text-sm text-ruby-bright hover:underline">
          Talent Map <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {content}
    </Card>
  );
}
