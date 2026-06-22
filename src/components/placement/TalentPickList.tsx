import { Avatar } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import type { CandidateMatch } from "@/lib/data/placement";
import { TALENT_STATUS_TONE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TalentPickList({
  matches,
  selectedIds,
  offeredIds,
  onToggle,
  emptyMessage = "No talent found.",
  highlightIds,
}: {
  matches: CandidateMatch[];
  selectedIds: Set<string>;
  offeredIds: Set<string>;
  onToggle: (talentId: string) => void;
  emptyMessage?: string;
  /** Extra badge label for highlighted rows (e.g. "Partner roster"). */
  highlightIds?: Set<string>;
}) {
  if (matches.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const member = match.talent;
        const alreadyOffered = offeredIds.has(member.id);
        const checked = selectedIds.has(member.id);
        const highlighted = highlightIds?.has(member.id);

        return (
          <label
            key={member.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              alreadyOffered
                ? "cursor-default border-line bg-surface-2 opacity-70"
                : checked
                  ? "border-ruby/40 bg-ruby/10"
                  : "border-line bg-surface-2 hover:border-line-strong",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 accent-ruby"
              checked={checked}
              disabled={alreadyOffered}
              onChange={() => onToggle(member.id)}
            />
            <Avatar name={member.name} color={member.avatarColor} className="h-10 w-10 shrink-0 text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{member.name}</p>
                <Badge tone={TALENT_STATUS_TONE[member.status] ?? "muted"} className="text-[10px]">
                  {member.status}
                </Badge>
                {highlighted && (
                  <Badge tone="good" className="text-[10px]">Partner roster</Badge>
                )}
                {alreadyOffered && (
                  <Badge tone="amber" className="text-[10px]">Offer sent</Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                {member.talentRole} · {member.college}
                {member.availability ? ` · ${member.availability}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ruby/15 px-2 py-0.5 text-xs font-bold text-ruby-bright">
                  {match.score}% fit
                </span>
                {match.reasons.slice(0, 3).map((r) => (
                  <span key={r} className="text-[11px] text-ink-faint">{r}</span>
                ))}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
