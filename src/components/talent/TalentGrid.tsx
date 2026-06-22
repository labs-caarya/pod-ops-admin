import { Briefcase, MapPin, Mail, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/Misc";
import { TALENT_STATUS_TONE } from "@/lib/constants";
import { normalizeTalent } from "@/lib/data/services";
import type { TalentMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TalentGrid({
  members,
  onOpen,
}: {
  members: TalentMember[];
  onOpen: (m: TalentMember) => void;
}) {
  if (members.length === 0) {
    return <EmptyState icon={Briefcase} title="No talent here yet" description="Add students to start mapping skills and availability." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((m) => {
        const member = normalizeTalent(m);
        return (
          <Card key={m.id} hover className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge tone={TALENT_STATUS_TONE[member.status] ?? "muted"}>{member.status}</Badge>
              <button
                type="button"
                onClick={() => onOpen(m)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-faint",
                  "transition-colors hover:border-line hover:bg-surface-3 hover:text-ruby-bright",
                )}
                aria-label={`Edit ${member.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <Avatar name={member.name} color={member.avatarColor} className="h-11 w-11 shrink-0 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-bold text-ink">{member.name}</p>
                <p className="truncate text-xs text-ink-muted">{member.talentRole} · {member.level}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {member.skills.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-ink-muted">{s}</span>
              ))}
              {member.serviceOfferings.length > 0 && (
                <span className="rounded-full bg-ruby/10 px-2 py-0.5 text-[11px] text-ruby-bright">
                  {member.serviceOfferings.length} service{member.serviceOfferings.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-xs text-ink-faint">
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {member.college}</p>
              <p className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 shrink-0" />
                {member.availability}{member.placedAt ? ` · ${member.placedAt}` : ""}
              </p>
              {member.email && (
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /> {member.email}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
