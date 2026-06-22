import { useMemo, useState } from "react";
import { Users, Plus, Search, UserCheck, UserPlus, Coffee, Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TalentDistributionMap } from "@/components/dashboard/TalentDistributionMap";
import { useCollection } from "@/lib/store";
import { talentStore, partnerStore } from "@/lib/data/collections";
import { getServiceStrength, normalizeTalent } from "@/lib/data/services";
import { makeId } from "@/lib/utils";
import type { TalentMember } from "@/lib/types";
import { TalentGrid } from "@/components/talent/TalentGrid";
import { TalentDrawer } from "@/components/talent/TalentDrawer";

export default function TalentMap() {
  const talent = useCollection(talentStore);
  const partners = useCollection(partnerStore);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [editing, setEditing] = useState<TalentMember | "new" | null>(null);

  const filtered = useMemo(() => {
    return talent.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (sourceFilter === "pod" && m.partnerId) return false;
      if (sourceFilter !== "all" && sourceFilter !== "pod" && m.partnerId !== sourceFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.primarySkill.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [talent, statusFilter, sourceFilter, search]);

  const stats = useMemo(
    () => ({
      available: talent.filter((m) => m.status === "Available").length,
      placed: talent.filter((m) => m.status === "Placed").length,
      bench: talent.filter((m) => m.status === "Bench").length,
      serviceOptIns: getServiceStrength(talent).reduce((s, r) => s + r.count, 0),
    }),
    [talent],
  );

  const normalizedTalent = useMemo(() => talent.map(normalizeTalent), [talent]);

  const newMember = (): TalentMember => ({
    id: makeId("tal"),
    name: "",
    college: "",
    primarySkill: "",
    skills: [],
    talentRole: "Content Creator",
    serviceOfferings: [],
    level: "Explorer",
    status: "Available",
    availability: "",
  });

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Talent Map"
        description="Map students by role and service offerings — developers, designers, nano-influencers and more."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add talent
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Available" value={stats.available} icon={UserCheck} tone="good" />
        <StatCard label="Placed" value={stats.placed} icon={UserPlus} tone="info" />
        <StatCard label="On bench" value={stats.bench} icon={Coffee} tone="muted" />
        <StatCard label="Service opt-ins" value={stats.serviceOptIns} icon={Layers} tone="ruby" hint="Across all services" />
      </div>

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-ink">Talent distribution</h2>
          <span className="text-xs text-ink-faint">{talent.length} mapped</span>
        </div>
        <TalentDistributionMap talent={normalizedTalent} compact />
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search by name or skill…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="Available">Available</option>
          <option value="Engaged">Engaged</option>
          <option value="Placed">Placed</option>
          <option value="Bench">Bench</option>
        </Select>
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-48">
          <option value="all">All sources</option>
          <option value="pod">Pod's own talent</option>
          {partners.filter((p) => p.type === "Academic").map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      <TalentGrid members={filtered} onOpen={(m) => setEditing(m)} />

      {editing && (
        <TalentDrawer
          member={editing === "new" ? newMember() : editing}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
