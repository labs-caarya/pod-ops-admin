import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  Microscope,
  Send,
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
import { CompactStatGrid } from "@/components/ui/CompactStatGrid";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { formatPodRole } from "@/lib/podRoles";
import { formatDate } from "@/lib/utils";

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
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={LayoutDashboard}
        title="Pod Ops Control Room"
        description="Live network health, leadership, profile submissions, and delivery blockers from the backend."
        className="mb-0 shrink-0"
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <CompactStatGrid label="Dashboard metrics" className="grid-cols-2 xl:grid-cols-4">
        <DashboardStatLink to="/pods">
          <StatCard className="h-24 p-3" label="Active pods" value={data.metrics.activePods} icon={Building2} tone="ruby" />
        </DashboardStatLink>
        <DashboardStatLink to="/pods-admin">
          <StatCard className="h-24 p-3" label="Active pod leaders" value={data.metrics.activePodLeaders ?? 0} icon={UserRound} tone="info" />
        </DashboardStatLink>
        <DashboardStatLink to="/challenges">
          <StatCard className="h-24 p-3" label="Open challenges" value={data.metrics.openChallenges} icon={TriangleAlert} tone="amber" />
        </DashboardStatLink>
        <StatCard className="h-24 p-3" label="New profile submissions" value={data.metrics.applicants} icon={BriefcaseBusiness} tone="good" />
      </CompactStatGrid>

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

        <Card className="flex max-h-[22rem] flex-col p-4 sm:max-h-none sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Priorities</p>
              <h3 className="font-display text-lg font-bold text-ink">Recently updated blockers</h3>
            </div>
            <Badge tone="amber">{data.priorities.length} open</Badge>
          </div>
          <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto pr-1 sm:overflow-visible sm:pr-0">
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
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-ruby-bright" />
              <h2 className="font-display text-lg font-bold text-ink">Tasks assigned to pod leaders</h2>
              <Badge tone="info">{data.leaderTasks?.length || 0} active</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">A clear view of the work every pod leader currently owns.</p>
          </div>
          <Link to="/leader-goals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ruby-bright hover:text-amber-bright">
            View all tasks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {data.leaderTasks?.length ? (
          <div className="mt-4 grid max-h-[24rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {data.leaderTasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display font-bold leading-snug text-ink">{task.title}</p>
                  <Badge tone="ruby">{formatPodRole(task.assignedPodRole)}</Badge>
                </div>
                {task.description ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{task.description}</p> : null}
                <div className="mt-3 border-t border-line pt-3 text-xs text-ink-faint">
                  <p className="font-medium text-ink-muted">{task.assigneeName || "Role owner not named"}</p>
                  <p className="mt-1">{task.collegeName || "Pod not named"}</p>
                  <p className="mt-2 flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-surface-2 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-ink">No active pod-leader tasks</p>
            <p className="mt-1 text-sm text-ink-muted">New assignments will appear here as soon as they are created.</p>
          </div>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="flex max-h-[28rem] flex-col p-4 sm:max-h-none sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Pod health board</h3>
              <p className="text-sm text-ink-muted">Calculated from unresolved and high-severity challenges.</p>
            </div>
            <Link to="/pods" className="text-sm text-ruby-bright hover:underline">View all</Link>
          </div>
          <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto pr-1 sm:overflow-visible sm:pr-0">
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
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">New profile submissions</h3>
                <p className="text-sm text-ink-muted">Weekly submissions across Observership, Apprenticeship, and Internship.</p>
              </div>
              <Activity className="h-5 w-5 text-ruby-bright" />
            </div>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-muted" aria-label="Submission pathways">
              <ChartKey color="bg-info" label="Observership" />
              <ChartKey color="bg-amber-bright" label="Apprenticeship" />
              <ChartKey color="bg-good" label="Internship" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.throughput} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#36262b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#b9a6a4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7c6a6c", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1113", border: "1px solid #36262b", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="observership" name="Observership" stroke="#38bdf8" fill="#38bdf822" />
                  <Area type="monotone" dataKey="apprenticeship" name="Apprenticeship" stroke="#f5a524" fill="#f5a52422" />
                  <Area type="monotone" dataKey="internship" name="Internship" stroke="#34d399" fill="#34d39922" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-ruby-bright" />
              <h3 className="font-display text-lg font-bold text-ink">Live activity counters</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.workflowCounts.map((item) => (
                <div key={item.id} className="rounded-xl border border-line bg-surface-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-ink-muted">{item.label}</p>
                    {item.id === "research" ? <Microscope className="h-3.5 w-3.5 shrink-0 text-info" /> : null}
                    {item.id === "outreach" ? <Send className="h-3.5 w-3.5 shrink-0 text-good" /> : null}
                  </div>
                  <p className="mt-1 font-display text-2xl font-black text-gradient">{item.count}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}

function ChartKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
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

function DashboardStatLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ruby-bright/70 ${className || ""}`}
    >
      {children}
    </Link>
  );
}
