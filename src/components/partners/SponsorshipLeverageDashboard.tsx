import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  IndianRupee,
  Megaphone,
  Users2,
  Building2,
  Plus,
  Trash2,
  Factory,
  Layers,
  UserCheck,
  Share2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { ServiceStrengthChart } from "@/components/dashboard/ServiceStrengthChart";
import { TalentDistributionMap } from "@/components/dashboard/TalentDistributionMap";
import {
  assetsByFormat,
  buildLeverageSnapshot,
} from "@/lib/data/sponsorshipLeverage";
import type { Partner, SponsorshipAsset, TalentMember } from "@/lib/types";

const ASSET_STATUS_TONE: Record<string, Tone> = {
  Available: "good",
  Committed: "amber",
  Delivered: "info",
};

const tooltipStyle = {
  background: "#1a1113",
  border: "1px solid #36262b",
  borderRadius: 12,
  color: "#f6ece9",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Talent Placement": "#38bdf8",
  "Innovation Consulting": "#fbbf24",
  "Brand Engagement": "#fb3a63",
  "Brand Promotion": "#a78bfa",
};

export function SponsorshipLeverageDashboard({
  partner,
  partnerTalent,
  onEnable,
  onAddAsset,
  onUpdateAsset,
  onRemoveAsset,
  onOpenTalentMap,
}: {
  partner: Partner;
  partnerTalent: TalentMember[];
  onEnable: () => void;
  onAddAsset: () => void;
  onUpdateAsset: (id: string, patch: Partial<SponsorshipAsset>) => void;
  onRemoveAsset: (id: string) => void;
  onOpenTalentMap?: () => void;
}) {
  if (!partner.sponsorshipEnabled) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sponsorship leverage dashboard"
        description="Enable a full capability + talent dashboard so industry partners see what this academic community can deliver — reach, services, and student talent in one pitch-ready view."
        action={
          <Button onClick={onEnable}>
            <Sparkles className="h-4 w-4" /> Enable dashboard
          </Button>
        }
      />
    );
  }

  const snapshot = buildLeverageSnapshot(partner, partnerTalent);
  const formatReach = assetsByFormat(partner.sponsorshipAssets);

  const pieData = [
    { name: "Available", value: snapshot.availableLeverage, fill: "#34d399" },
    { name: "Committed / Delivered", value: snapshot.committed, fill: "#fb3a63" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Industry-facing pitch */}
      <Card className="relative overflow-hidden border-ruby/25 bg-gradient-to-br from-ruby/10 via-surface-2 to-amber/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ruby/30 bg-ruby/15 text-ruby-bright">
            <Factory className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-bright">
              Industry sponsor view
            </p>
            <h2 className="mt-1 font-display text-xl font-black text-ink sm:text-2xl">
              {snapshot.pitchHeadline}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
              {snapshot.pitchSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {partner.tags.map((t) => (
                <Badge key={t} tone="muted">{t}</Badge>
              ))}
              {snapshot.deliverables.slice(0, 4).map((d) => (
                <Badge key={d.serviceId} tone="good">{d.label}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface/80 px-4 py-3 text-right">
            <p className="text-xs text-ink-faint">Community size</p>
            <p className="font-display text-2xl font-black text-ink">{partner.memberCount}+</p>
            <p className="text-xs text-ink-muted">members · {partner.city}</p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Sponsorship inventory" value={`₹${(snapshot.totalLeverage / 100000).toFixed(1)}L`} icon={IndianRupee} tone="ruby" />
        <StatCard label="Combined reach" value={snapshot.totalAudience.toLocaleString("en-IN")} icon={Megaphone} tone="amber" />
        <StatCard label="Mapped talent" value={snapshot.mappedTalent} icon={Users2} tone="info" />
        <StatCard label="Available now" value={snapshot.availableTalent} icon={UserCheck} tone="good" />
        <StatCard label="Services ready" value={snapshot.activeServices} icon={Layers} tone="ruby" />
        <StatCard label="Sponsor assets" value={snapshot.assetCount} icon={Building2} tone="amber" />
      </div>

      {/* Service deliverables for industry */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-display text-lg font-bold text-ink">What industry partners get</h3>
          <p className="text-sm text-ink-muted">
            Caarya services this academic partner can mobilise — tied to real student capacity and sponsorship inventory.
          </p>
        </div>
        {snapshot.deliverables.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink-muted">
            Map students with service offerings to show industry sponsors what you can deliver.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.deliverables.map((d) => (
              <div
                key={d.serviceId}
                className="rounded-xl border border-line bg-surface-2 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">{d.category}</p>
                    <p className="font-display font-bold text-ink">{d.label}</p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ background: CATEGORY_COLORS[d.category] ?? "#fb3a63" }}
                  >
                    {d.talentCount} students
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{d.pitch}</p>
                {d.linkedAssets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.linkedAssets.map((a) => (
                      <span key={a} className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-ink-faint">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Capability chart + category strength */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ServiceStrengthChart
            talent={partnerTalent}
            title="Service capability"
            subtitle={`Student opt-ins per Caarya service — proof of delivery capacity for ${partner.name}.`}
            hideLink
          />
        </div>
        <Card className="p-5">
          <h3 className="font-display text-lg font-bold text-ink">Capability pillars</h3>
          <p className="text-sm text-ink-muted">Grouped service strength at a glance.</p>
          <div className="mt-4 space-y-3">
            {snapshot.categoryStrength.map((row) => {
              const max = Math.max(1, ...snapshot.categoryStrength.map((r) => r.count));
              const pct = (row.count / max) * 100;
              return (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-muted">{row.label}</span>
                    <span className="font-bold text-ink">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ruby to-amber"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {snapshot.categoryStrength.every((r) => r.count === 0) && (
              <p className="text-sm text-ink-faint">Add mapped talent to show capability pillars.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Talent insights (summary — full map lives on Talent Map tab) */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Talent insights</h3>
            <p className="text-sm text-ink-muted">
              Role breakdown for {partner.name} — the human proof behind every service on this dashboard.
            </p>
          </div>
          {onOpenTalentMap && (
            <Button size="sm" variant="secondary" onClick={onOpenTalentMap}>
              <Users2 className="h-4 w-4" /> Full talent map <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <TalentDistributionMap talent={partnerTalent} compact />
        <p className="mt-3 text-xs text-ink-faint">
          {snapshot.mappedTalent} students mapped · {snapshot.availableTalent} available now
          {snapshot.mappedTalent === 0 && onOpenTalentMap && (
            <> — <button type="button" onClick={onOpenTalentMap} className="text-ruby-bright hover:underline">Add students on the Talent Map tab</button></>
          )}
        </p>
      </Card>

      {/* Sponsorship inventory */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Sponsorship inventory</h3>
              <p className="text-sm text-ink-muted">
                Named assets an industry partner can sponsor — audience, format and value.
              </p>
            </div>
            <Button size="sm" onClick={onAddAsset}>
              <Plus className="h-4 w-4" /> Add asset
            </Button>
          </div>
          <div className="space-y-2">
            {partner.sponsorshipAssets.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-faint">No assets yet — add inventory industry can sponsor.</p>
            )}
            {partner.sponsorshipAssets.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Input
                    value={a.label}
                    onChange={(e) => onUpdateAsset(a.id, { label: e.target.value })}
                    className="flex-1 border-transparent bg-transparent px-0 font-semibold focus:border-transparent focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveAsset(a.id)}
                    className="rounded-lg p-1 text-ink-faint hover:text-bad"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="text-xs">
                    <span className="text-ink-faint">Value (₹)</span>
                    <Input type="number" value={a.value} onChange={(e) => onUpdateAsset(a.id, { value: Number(e.target.value) })} className="mt-1 h-8 px-2 py-1" />
                  </label>
                  <label className="text-xs">
                    <span className="text-ink-faint">Audience</span>
                    <Input type="number" value={a.audience} onChange={(e) => onUpdateAsset(a.id, { audience: Number(e.target.value) })} className="mt-1 h-8 px-2 py-1" />
                  </label>
                  <label className="text-xs">
                    <span className="text-ink-faint">Format</span>
                    <Input value={a.format} onChange={(e) => onUpdateAsset(a.id, { format: e.target.value })} className="mt-1 h-8 px-2 py-1" />
                  </label>
                  <label className="text-xs">
                    <span className="text-ink-faint">Status</span>
                    <Select
                      value={a.status}
                      onChange={(e) => onUpdateAsset(a.id, { status: e.target.value as SponsorshipAsset["status"] })}
                      className="mt-1 h-8 px-2 py-1"
                    >
                      <option value="Available">Available</option>
                      <option value="Committed">Committed</option>
                      <option value="Delivered">Delivered</option>
                    </Select>
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={ASSET_STATUS_TONE[a.status] ?? "muted"}>{a.status}</Badge>
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <Share2 className="h-3 w-3" /> {a.audience.toLocaleString("en-IN")} reach
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="flex flex-col p-5">
            <h3 className="font-display text-lg font-bold text-ink">Value mobilised</h3>
            <p className="text-sm text-ink-muted">Available vs committed sponsorship value.</p>
            <div className="mt-2 h-48">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3} stroke="none">
                      {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11, color: "#b9a6a4" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-faint">Add assets to chart value</div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-lg font-bold text-ink">Reach by format</h3>
            <p className="text-sm text-ink-muted">Where industry gets exposure.</p>
            <div className="mt-3 h-44">
              {formatReach.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatReach} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#36262b" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#7c6a6c", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="format" width={72} tick={{ fill: "#b9a6a4", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString("en-IN"), "Audience"]} />
                    <Bar dataKey="audience" fill="#fb3a63" radius={[0, 6, 6, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-faint">No format data yet</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
