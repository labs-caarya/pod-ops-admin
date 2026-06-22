import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  GraduationCap,
  Factory,
  Users2,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { useCollection } from "@/lib/store";
import { partnerStore } from "@/lib/data/collections";
import { PARTNER_STAGE_TONE } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { Partner, PartnerType } from "@/lib/types";
import { PartnerDrawer } from "@/components/partners/PartnerDrawer";

export default function Partners() {
  const partners = useCollection(partnerStore);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | PartnerType>("all");
  const [editing, setEditing] = useState<Partner | "new" | null>(null);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.kind.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    });
  }, [partners, search, typeFilter]);

  const stats = useMemo(() => {
    const academic = partners.filter((p) => p.type === "Academic").length;
    const industry = partners.filter((p) => p.type === "Industry").length;
    const leverage = partners
      .filter((p) => p.sponsorshipEnabled)
      .reduce((sum, p) => sum + p.sponsorshipAssets.reduce((s, a) => s + a.value, 0), 0);
    return { academic, industry, leverage };
  }, [partners]);

  const newPartner = (): Partner => ({
    id: makeId("par"),
    name: "",
    type: "Academic",
    kind: "Club",
    city: "",
    stage: "Prospect",
    owner: "",
    memberCount: 0,
    description: "",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    sponsorshipEnabled: false,
    sponsorshipAssets: [],
    tags: [],
  });

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="Partners"
        description="Your academic partners (clubs & councils) and industry partners. Open an academic partner to manage its sponsorship leverage and talent map."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add partner
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Academic partners" value={stats.academic} icon={GraduationCap} tone="ruby" hint="Clubs & councils" />
        <StatCard label="Industry partners" value={stats.industry} icon={Factory} tone="amber" />
        <StatCard label="Sponsorship leverage" value={`₹${(stats.leverage / 100000).toFixed(1)}L`} icon={IndianRupee} tone="good" hint="Across academic partners" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search partners…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | PartnerType)} className="w-44">
          <option value="all">All partners</option>
          <option value="Academic">Academic</option>
          <option value="Industry">Industry</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const leverage = p.sponsorshipAssets.reduce((s, a) => s + a.value, 0);
          return (
            <Card key={p.id} hover className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.type === "Academic" ? "bg-ruby/10 text-ruby-bright" : "bg-amber/10 text-amber-bright"}`}>
                    {p.type === "Academic" ? <GraduationCap className="h-5 w-5" /> : <Factory className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display font-bold text-ink">{p.name}</h3>
                    <p className="truncate text-xs text-ink-muted">{p.kind} · {p.city}</p>
                  </div>
                </div>
                <Badge tone={PARTNER_STAGE_TONE[p.stage] ?? "muted"}>{p.stage}</Badge>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{p.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                {p.memberCount > 0 && <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {p.memberCount} members</span>}
                {p.sponsorshipEnabled && (
                  <Badge tone="good">Leverage ₹{(leverage / 100000).toFixed(1)}L</Badge>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(p)}>Edit</Button>
                <Link to={`/partners/${p.id}`} className="flex-1">
                  <Button size="sm" className="w-full">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <PartnerDrawer
          partner={editing === "new" ? newPartner() : editing}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
