import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  Layers3,
  TriangleAlert,
  UserRound,
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
import { dashboardQueryOptions } from "@/lib/adminQueries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Misc";

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

export default function AdminDashboard() {
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const data = dashboardQuery.data;

  if (dashboardQuery.isPending) {
    return <Card className="p-8 text-center text-sm text-ink-muted">Loading live admin data…</Card>;
  }
  if (!data) {
    return (
      <Card className="p-8 text-center text-sm text-bad">
        {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Could not load dashboard data."}
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Pod Ops Control Room"
        description="Live network health, leadership, applicants, and delivery blockers from the backend."
        actions={
          <>
            <Link to="/access"><Button variant="outline">Leadership</Button></Link>
            <Link to="/pods"><Button>Open pod portfolio <ArrowRight className="h-4 w-4" /></Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active pods" value={data.metrics.activePods} icon={Building2} tone="ruby" />
        <StatCard label="Active users" value={data.metrics.activeUsers} icon={UserRound} tone="info" />
        <StatCard label="Open challenges" value={data.metrics.openChallenges} icon={TriangleAlert} tone="amber" />
        <StatCard label="Applicants" value={data.metrics.applicants} icon={BriefcaseBusiness} tone="good" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <Card className="p-5">
          <Badge tone="ruby">Live attention signals</Badge>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-ink">
            Focus on the pods and challenges that need intervention.
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricChip label="Pods under watch" value={data.attention.podsUnderWatch} />
            <MetricChip label="Critical challenges" value={data.attention.criticalChallenges} />
            <MetricChip label="Inactive accounts" value={data.attention.inactiveUsers} />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Priorities</p>
              <h3 className="font-display text-lg font-bold text-ink">Recently updated blockers</h3>
            </div>
            <Badge tone="amber">{data.priorities.length} open</Badge>
          </div>
          <div className="space-y-2.5">
            {data.priorities.length ? data.priorities.map((item) => (
              <Link key={item.id} to={`/challenges/${item.id}`} className="block rounded-xl border border-line bg-surface-2 p-3 hover:border-line-strong">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <Badge tone={item.severity === "Critical" ? "bad" : item.severity === "High" ? "amber" : "muted"}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{item.owner || "Unassigned"} · {item.status}</p>
              </Link>
            )) : <p className="text-sm text-ink-muted">No open challenges.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Pod health board</h3>
              <p className="text-sm text-ink-muted">Calculated from unresolved and high-severity challenges.</p>
            </div>
            <Link to="/pods" className="text-sm text-ruby-bright hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.pods.slice(0, 6).map((pod) => (
              <div key={pod.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold text-ink">{pod.name}</p>
                    <p className="text-xs text-ink-muted">{pod.collegeName} · {pod.memberCount} active users</p>
                  </div>
                  <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={pod.activationPercent} tone={pod.activationPercent >= 80 ? "good" : pod.activationPercent >= 40 ? "amber" : "ruby"} className="flex-1" />
                  <span className="text-xs tabular-nums text-ink-muted">{pod.activationPercent}% activated</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Weekly submissions</h3>
                <p className="text-sm text-ink-muted">Challenges and applicant submissions recorded by the backend.</p>
              </div>
              <Activity className="h-5 w-5 text-ruby-bright" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.throughput} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#36262b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#b9a6a4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7c6a6c", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1113", border: "1px solid #36262b", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="challenges" stroke="#fb3a63" fill="#fb3a6333" />
                  <Area type="monotone" dataKey="futurecraft" stroke="#38bdf8" fill="#38bdf833" />
                  <Area type="monotone" dataKey="industry" stroke="#34d399" fill="#34d39922" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-ruby-bright" />
              <h3 className="font-display text-lg font-bold text-ink">Live workflow records</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.workflowCounts.map((item) => (
                <div key={item.id} className="rounded-xl border border-line bg-surface-2 p-3">
                  <p className="text-xs text-ink-muted">{item.label}</p>
                  <p className="mt-1 font-display text-2xl font-black text-gradient">{item.count}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
