import { Briefcase, MapPin, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/Misc";
import { TALENT_STATUS_TONE } from "@/lib/constants";
import { talentStore } from "@/lib/data/collections";
import { normalizeTalent } from "@/lib/data/services";
import type { TalentMember } from "@/lib/types";

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

  const togglePlace = (m: TalentMember) => {
    if (m.status === "Placed") {
      talentStore.upsert({ id: m.id, status: "Available", placedAt: "" });
    } else {
      talentStore.upsert({ id: m.id, status: "Placed" });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((m) => {
        const member = normalizeTalent(m);
        return (
        <Card key={m.id} hover className="flex flex-col p-4">
          <div className="flex items-start gap-3">
            <Avatar name={member.name} color={member.avatarColor} className="h-11 w-11 text-sm" />
            <button onClick={() => onOpen(m)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-display font-bold text-ink">{member.name}</p>
              <p className="truncate text-xs text-ink-muted">{member.talentRole} · {member.level}</p>
            </button>
            <Badge tone={TALENT_STATUS_TONE[member.status] ?? "muted"}>{member.status}</Badge>
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
            <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {member.college}</p>
            <p className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {member.availability}{member.placedAt ? ` · ${member.placedAt}` : ""}</p>
            {member.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {member.email}</p>}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onOpen(m)}>Edit</Button>
            <Button
              size="sm"
              variant={member.status === "Placed" ? "outline" : "primary"}
              className="flex-1"
              onClick={() => togglePlace(m)}
            >
              {member.status === "Placed" ? "Unplace" : "Place"}
            </Button>
          </div>
        </Card>
        );
      })}
    </div>
  );
}
