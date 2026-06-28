import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowRight,
  Activity,
  Clock3,
  Building2,
  BriefcaseBusiness,
  TriangleAlert,
  Layers3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Misc";
import {
  ADMIN_WORKSPACE,
  adminPods,
  commandMetrics,
  moduleCoverage,
  pipelineStages,
  todayPriorities,
} from "@/lib/admin/demoData";

const throughputSeries = [
  { week: "W1", research: 24, placements: 9, sponsors: 12 },
  { week: "W2", research: 29, placements: 11, sponsors: 14 },
  { week: "W3", research: 33, placements: 14, sponsors: 18 },
  { week: "W4", research: 31, placements: 16, sponsors: 17 },
  { week: "W5", research: 37, placements: 19, sponsors: 22 },
];

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Pod Ops Control Room"
        description={ADMIN_WORKSPACE.tagline}
        actions={
          <>
            <Link to="/access">
              <Button variant="outline">Users</Button>
            </Link>
            <Link to="/pods-admin">
              <Button variant="outline">Pod registry</Button>
            </Link>
            <Link to="/pods">
              <Button>
                Open pod portfolio <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {commandMetrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.tone === "ruby" ? Building2 : metric.tone === "amber" ? Clock3 : metric.tone === "good" ? TriangleAlert : BriefcaseBusiness}
            tone={metric.tone}
            hint={metric.hint}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Badge tone="ruby">What needs attention now</Badge>
              <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
                See the pods, partners, and follow-ups that need action first.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                This dashboard should help a pod ops or business development person decide what to
                unblock next: where partner conversations are slowing down, which pods need help,
                and where access issues are stopping work.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricChip label="Pods under watch" value="4" />
            <MetricChip label="Sponsor threads at risk" value="7" />
            <MetricChip label="Access issues blocking work" value="3" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Today’s priorities</p>
              <h3 className="font-display text-lg font-bold text-ink">Immediate interventions</h3>
            </div>
            <Badge tone="amber">4 open</Badge>
          </div>
          <div className="space-y-2.5">
            {todayPriorities.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{item.action}</p>
                  <Badge tone={item.level === "Critical" ? "bad" : item.level === "Warning" ? "amber" : "info"}>
                    {item.level}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{item.owner} · {item.target}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">{item.ts}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Pod health board</h3>
              <p className="text-sm text-ink-muted">Portfolio pulse across adoption, readiness, and interventions.</p>
            </div>
            <Link to="/pods" className="flex items-center gap-1 text-sm text-ruby-bright hover:underline">
              Open pod portfolio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {adminPods.map((pod) => (
              <div key={pod.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-bold text-ink">{pod.name}</p>
                    <p className="text-xs text-ink-muted">{pod.college} · {pod.city} · Lead {pod.lead}</p>
                  </div>
                  <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ScoreCell label="Maturity" value={`${pod.maturityScore}%`} />
                  <ScoreCell label="Coverage" value={`${pod.outreachCoverage}%`} />
                  <ScoreCell label="Placements" value={String(pod.placements)} />
                  <ScoreCell label="Approvals" value={String(pod.pendingApprovals)} />
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
                    <span>Portfolio readiness</span>
                    <span>{pod.maturityScore}%</span>
                  </div>
                  <ProgressBar value={pod.maturityScore} tone={pod.maturityScore >= 80 ? "good" : pod.maturityScore >= 60 ? "amber" : "ruby"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Delivery throughput</h3>
                <p className="text-sm text-ink-muted">Weekly admin view of research, sponsor motion, and placements.</p>
              </div>
              <Activity className="h-5 w-5 text-ruby-bright" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="researchFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fb3a63" stopOpacity={0.48} />
                      <stop offset="100%" stopColor="#fb3a63" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="placementFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#36262b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#b9a6a4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7c6a6c", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1a1113", border: "1px solid #36262b", borderRadius: 12, color: "#f6ece9" }}
                  />
                  <Area type="monotone" dataKey="research" stroke="#fb3a63" strokeWidth={2} fill="url(#researchFill)" />
                  <Area type="monotone" dataKey="placements" stroke="#38bdf8" strokeWidth={2} fill="url(#placementFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">How the network is being used</h3>
                <p className="text-sm text-ink-muted">Spot which workflows are active and which ones are getting ignored.</p>
              </div>
              <Badge tone="info">Demo</Badge>
            </div>
            <div className="space-y-3">
              {moduleCoverage.map((module) => (
                <div key={module.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink">{module.name}</span>
                    <span className="text-ink-muted">{module.adoption}%</span>
                  </div>
                  <ProgressBar value={module.adoption} tone={module.adoption >= 80 ? "good" : module.adoption >= 65 ? "amber" : "ruby"} />
                  <p className="mt-1 text-[11px] text-ink-faint">{module.freshness}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Current working stages</h3>
              <p className="text-sm text-ink-muted">Track where the live pipeline is sitting right now without fake money estimates.</p>
            </div>
            <Layers3 className="h-5 w-5 text-ruby-bright" />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Stage</p>
                <p className="mt-2 font-display text-lg font-bold text-ink">{stage.label}</p>
                <p className="mt-3 font-display text-3xl font-black text-gradient">{stage.count}</p>
                <p className="mt-2 text-sm text-ink-muted">{stage.hint}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-base-2/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-ink">{value}</p>
    </div>
  );
}
