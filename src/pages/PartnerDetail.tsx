import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Factory,
  Mail,
  Phone,
  Users2,
  IndianRupee,
  Plus,
  Trash2,
  Sparkles,
  Rocket,
  Megaphone,
  Pencil,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { partnerStore, talentStore } from "@/lib/data/collections";
import { PARTNER_STAGE_TONE } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { SponsorshipAsset, TalentMember } from "@/lib/types";
import { PartnerDrawer } from "@/components/partners/PartnerDrawer";
import { TalentGrid } from "@/components/talent/TalentGrid";
import { TalentDrawer } from "@/components/talent/TalentDrawer";

const ASSET_STATUS_TONE: Record<string, Tone> = {
  Available: "good",
  Committed: "amber",
  Delivered: "info",
};

type Tab = "overview" | "sponsorship" | "talent";

export default function PartnerDetail() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const partners = useCollection(partnerStore);
  const talent = useCollection(talentStore);
  const partner = partners.find((p) => p.id === partnerId);

  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [talentEditing, setTalentEditing] = useState<TalentMember | "new" | null>(null);

  const partnerTalent = useMemo(
    () => talent.filter((t) => t.partnerId === partnerId),
    [talent, partnerId],
  );

  if (!partner) {
    return (
      <EmptyState
        icon={Building2}
        title="Partner not found"
        description="This partner may have been removed."
        action={<Link to="/partners"><Button>Back to partners</Button></Link>}
      />
    );
  }

  const isAcademic = partner.type === "Academic";
  const isCampusCompany = partner.type === "Campus Company";
  const PartnerIcon = isAcademic ? GraduationCap : isCampusCompany ? Rocket : Factory;
  const typeTone = isAcademic ? "ruby" : isCampusCompany ? "info" : "amber";
  const totalLeverage = partner.sponsorshipAssets.reduce((s, a) => s + a.value, 0);
  const committed = partner.sponsorshipAssets.filter((a) => a.status !== "Available").reduce((s, a) => s + a.value, 0);
  const totalAudience = partner.sponsorshipAssets.reduce((s, a) => s + a.audience, 0);

  const updateAsset = (id: string, patch: Partial<SponsorshipAsset>) => {
    partnerStore.upsert({
      id: partner.id,
      sponsorshipAssets: partner.sponsorshipAssets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };
  const removeAsset = (id: string) => {
    partnerStore.upsert({ id: partner.id, sponsorshipAssets: partner.sponsorshipAssets.filter((a) => a.id !== id) });
  };
  const addAsset = () => {
    const asset: SponsorshipAsset = {
      id: makeId("sa"),
      label: "New leverage asset",
      value: 50000,
      audience: 500,
      format: "On-ground",
      status: "Available",
    };
    partnerStore.upsert({ id: partner.id, sponsorshipAssets: [...partner.sponsorshipAssets, asset] });
  };
  const enableSponsorship = () => partnerStore.upsert({ id: partner.id, sponsorshipEnabled: true });

  const newTalent = (): TalentMember => ({
    id: makeId("tal"),
    name: "",
    college: partner.name,
    partnerId: partner.id,
    primarySkill: "",
    skills: [],
    talentRole: "Content Creator",
    serviceOfferings: [],
    level: "Explorer",
    status: "Available",
    availability: "",
  });

  const pieData = [
    { name: "Available", value: totalLeverage - committed, fill: "#34d399" },
    { name: "Committed / Delivered", value: committed, fill: "#fb3a63" },
  ].filter((d) => d.value > 0);

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "sponsorship", label: "Sponsorship Leverage", show: isAcademic },
    { key: "talent", label: "Talent Map", show: isAcademic },
  ];

  return (
    <div>
      <Link to="/partners" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All partners
      </Link>

      <PageHeader
        icon={PartnerIcon}
        title={partner.name}
        description={`${partner.kind} · ${partner.city}`}
        actions={
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={PARTNER_STAGE_TONE[partner.stage] ?? "muted"}>{partner.stage}</Badge>
        <Badge tone={typeTone}>{partner.type}</Badge>
        {partner.tags.map((t) => <Badge key={t} tone="muted">{t}</Badge>)}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-line">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "relative -mb-px border-b-2 border-ruby px-4 py-2.5 text-sm font-semibold text-ink"
                : "border-b-2 border-transparent px-4 py-2.5 text-sm text-ink-muted hover:text-ink"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-display text-lg font-bold text-ink">About</h3>
            <p className="mt-2 text-sm text-ink-muted">{partner.description || "No description yet."}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Info label="Owner" value={partner.owner || "—"} />
              <Info label="Members" value={partner.memberCount ? String(partner.memberCount) : "—"} />
              <Info label="Contact" value={partner.contactName ? `${partner.contactName} · ${partner.contactRole}` : "—"} />
              <Info label="Stage" value={partner.stage} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {partner.email && (
                <a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink hover:border-line-strong">
                  <Mail className="h-4 w-4 text-ruby-bright" /> {partner.email}
                </a>
              )}
              {partner.phone && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink">
                  <Phone className="h-4 w-4 text-amber-bright" /> {partner.phone}
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-lg font-bold text-ink">At a glance</h3>
            <div className="mt-3 space-y-3">
              <Info label="Type" value={`${partner.type} · ${partner.kind}`} />
              {isAcademic && (
                <>
                  <Info label="Students mapped" value={String(partnerTalent.length)} />
                  <Info
                    label="Sponsorship leverage"
                    value={partner.sponsorshipEnabled ? `₹${(totalLeverage / 100000).toFixed(1)}L` : "Not enabled"}
                  />
                </>
              )}
            </div>
            {isAcademic && (
              <div className="mt-4 flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={() => setTab("sponsorship")}>
                  <IndianRupee className="h-4 w-4" /> Sponsorship dashboard
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setTab("talent")}>
                  <Users2 className="h-4 w-4" /> Talent map
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Sponsorship leverage */}
      {tab === "sponsorship" && (
        <div>
          {!partner.sponsorshipEnabled ? (
            <EmptyState
              icon={Sparkles}
              title="Sponsorship leverage not enabled"
              description="Enable a sponsorship-leverage dashboard to show this academic partner the value your pod can mobilise for them."
              action={<Button onClick={enableSponsorship}><Sparkles className="h-4 w-4" /> Enable dashboard</Button>}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Total leverage" value={`₹${(totalLeverage / 100000).toFixed(2)}L`} icon={IndianRupee} tone="ruby" />
                <StatCard label="Committed" value={`₹${(committed / 100000).toFixed(2)}L`} icon={Megaphone} tone="amber" />
                <StatCard label="Combined reach" value={totalAudience.toLocaleString("en-IN")} icon={Users2} tone="info" />
                <StatCard label="Assets" value={partner.sponsorshipAssets.length} icon={Building2} tone="good" />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-ink">Leverage assets</h3>
                    <Button size="sm" onClick={addAsset}><Plus className="h-4 w-4" /> Add asset</Button>
                  </div>
                  <div className="space-y-2">
                    {partner.sponsorshipAssets.length === 0 && (
                      <p className="py-6 text-center text-sm text-ink-faint">No assets yet — add one to start.</p>
                    )}
                    {partner.sponsorshipAssets.map((a) => (
                      <div key={a.id} className="rounded-xl border border-line bg-surface-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <Input
                            value={a.label}
                            onChange={(e) => updateAsset(a.id, { label: e.target.value })}
                            className="flex-1 border-transparent bg-transparent px-0 font-semibold focus:border-transparent focus:ring-0"
                          />
                          <button onClick={() => removeAsset(a.id)} className="rounded-lg p-1 text-ink-faint hover:text-bad">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label className="text-xs">
                            <span className="text-ink-faint">Value (₹)</span>
                            <Input type="number" value={a.value} onChange={(e) => updateAsset(a.id, { value: Number(e.target.value) })} className="mt-1 h-8 px-2 py-1" />
                          </label>
                          <label className="text-xs">
                            <span className="text-ink-faint">Audience</span>
                            <Input type="number" value={a.audience} onChange={(e) => updateAsset(a.id, { audience: Number(e.target.value) })} className="mt-1 h-8 px-2 py-1" />
                          </label>
                          <label className="text-xs">
                            <span className="text-ink-faint">Format</span>
                            <Input value={a.format} onChange={(e) => updateAsset(a.id, { format: e.target.value })} className="mt-1 h-8 px-2 py-1" />
                          </label>
                          <label className="text-xs">
                            <span className="text-ink-faint">Status</span>
                            <Select
                              value={a.status}
                              onChange={(e) => updateAsset(a.id, { status: e.target.value as SponsorshipAsset["status"] })}
                              className="mt-1 h-8 px-2 py-1"
                            >
                              <option value="Available">Available</option>
                              <option value="Committed">Committed</option>
                              <option value="Delivered">Delivered</option>
                            </Select>
                          </label>
                        </div>
                        <div className="mt-2">
                          <Badge tone={ASSET_STATUS_TONE[a.status] ?? "muted"}>{a.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="flex flex-col p-5">
                  <h3 className="font-display text-lg font-bold text-ink">Commitment split</h3>
                  <p className="text-sm text-ink-muted">Value available vs mobilised.</p>
                  <div className="mt-2 h-56">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                            {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 12, color: "#b9a6a4" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ink-faint">No value yet</div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Talent map */}
      {tab === "talent" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">{partner.name} · Talent map</h3>
              <p className="text-sm text-ink-muted">Students from this academic partner you can place on opportunities.</p>
            </div>
            <Button onClick={() => setTalentEditing("new")}><Plus className="h-4 w-4" /> Add student</Button>
          </div>
          <TalentGrid members={partnerTalent} onOpen={(m) => setTalentEditing(m)} />
        </div>
      )}

      {editing && (
        <PartnerDrawer
          partner={partner}
          isNew={false}
          onClose={() => {
            setEditing(false);
            if (!partnerStore.get(partner.id)) navigate("/partners");
          }}
        />
      )}
      {talentEditing && (
        <TalentDrawer
          member={talentEditing === "new" ? newTalent() : talentEditing}
          isNew={talentEditing === "new"}
          onClose={() => setTalentEditing(null)}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
