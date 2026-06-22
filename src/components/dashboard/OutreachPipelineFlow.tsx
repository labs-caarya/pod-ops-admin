import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OUTREACH_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Contact, OutreachStage } from "@/lib/types";

const ACTIVE_STAGES: OutreachStage[] = [
  "to_contact",
  "outreach_sent",
  "in_conversation",
  "meeting",
  "proposal",
  "partner",
];

export function OutreachPipelineFlow({ contacts }: { contacts: Contact[] }) {
  const counts = ACTIVE_STAGES.map((key) => ({
    ...OUTREACH_STAGES.find((s) => s.key === key)!,
    count: contacts.filter((c) => c.stage === key).length,
  }));

  const passed = contacts.filter((c) => c.stage === "passed").length;
  const totalActive = counts.reduce((s, c) => s + c.count, 0);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-ink">Outreach pipeline</h2>
          <p className="text-sm text-ink-muted">{totalActive} active conversations in the Rolodex.</p>
        </div>
        <Link to="/rolodex" className="flex shrink-0 items-center gap-1 text-sm text-ruby-bright hover:underline">
          Open Rolodex <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-max items-stretch gap-1 sm:min-w-0 sm:w-full sm:gap-2">
          {counts.map((stage, i) => (
            <div key={stage.key} className="flex min-w-[4.5rem] flex-1 items-stretch sm:min-w-0">
              <div
                className={cn(
                  "flex flex-1 flex-col items-center justify-center rounded-xl border px-2 py-4 text-center transition-colors sm:py-5",
                  stage.count > 0 ? "border-line-strong bg-surface-2" : "border-line bg-surface-2/50 opacity-70",
                )}
              >
                <span className="font-display text-2xl font-black text-ink sm:text-3xl">{stage.count}</span>
                <Badge tone={stage.tone} className="mt-2 text-[9px] leading-tight sm:text-[10px]">
                  {stage.label}
                </Badge>
              </div>
              {i < counts.length - 1 && (
                <div className="flex w-3 shrink-0 items-center justify-center text-ink-faint sm:w-5" aria-hidden>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {passed > 0 && (
        <p className="mt-3 text-xs text-ink-faint">
          {passed} passed · not shown in active pipeline
        </p>
      )}
    </Card>
  );
}
