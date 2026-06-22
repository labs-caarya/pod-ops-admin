import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Microscope,
  Contact2,
  Users,
  Briefcase,
  Building2,
  Target,
  TrendingUp,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import {
  contactStore,
  goalStore,
  jobStore,
  partnerStore,
  researchStore,
  talentStore,
  POD,
} from "@/lib/data/collections";
import { computeScore } from "@/lib/data/scoring";
import { CLOSED_WIN, pct } from "@/lib/constants";

export default function Dashboard() {
  const research = useCollection(researchStore);
  const contacts = useCollection(contactStore);
  const talent = useCollection(talentStore);
  const jobs = useCollection(jobStore);
  const partners = useCollection(partnerStore);
  const goals = useCollection(goalStore);

  const stats = useMemo(() => {
    const partnersWon = contacts.filter((c) => c.stage === CLOSED_WIN).length;
    const placed = talent.filter((t) => t.status === "Placed").length;
    const sharedJobs = jobs.filter((j) => j.status === "Shared" || j.status === "Open").length;
    const activePartners = partners.filter((p) => p.stage === "Active" || p.stage === "Strategic").length;
    return { partnersWon, placed, sharedJobs, activePartners };
  }, [contacts, talent, jobs, partners]);

  const overallProgress = useMemo(() => {
    if (!goals.length) return 0;
    const sum = goals.reduce((acc, g) => acc + Math.min(100, pct(g.current, g.target)), 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  const pipelineData = useMemo(() => {
    const buckets: Record<string, number> = {};
    contacts.forEach((c) => {
      buckets[c.stage] = (buckets[c.stage] || 0) + 1;
    });
    const labels: Record<string, string> = {
      to_contact: "To Contact",
      outreach_sent: "Sent",
      in_conversation: "Talking",
      meeting: "Meeting",
      proposal: "Proposal",
      partner: "Won",
      passed: "Passed",
    };
    return Object.entries(labels).map(([key, label]) => ({ name: label, value: buckets[key] || 0 }));
  }, [contacts]);

  const topResearch = useMemo(
    () =>
      [...research]
        .map((r) => ({ ...r, score: computeScore(r.scores) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4),
    [research],
  );

  return (
    <div>
      <PageHeader
        icon={Target}
        title={`Good to see you, ${POD.name}`}
        description={POD.tagline}
        actions={
          <Link
            to="/ask"
            className="btn-primary focus-ring inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4" /> Ask Moksha
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Brands researched" value={research.length} icon={Microscope} tone="ruby" hint={`${topResearch.filter((r) => r.score >= 60).length} strong+`} />
        <StatCard label="In outreach" value={contacts.length} icon={Contact2} tone="amber" hint={`${stats.partnersWon} won`} />
        <StatCard label="Talent mapped" value={talent.length} icon={Users} tone="info" hint={`${stats.placed} placed`} />
        <StatCard label="Active partners" value={stats.activePartners} icon={Building2} tone="good" hint={`${partners.length} total`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Goal alignment */}
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Goal alignment</h2>
              <p className="text-sm text-ink-muted">How the pod is tracking against its objectives.</p>
            </div>
            <Badge tone={overallProgress >= 60 ? "good" : "amber"}>{overallProgress}% on track</Badge>
          </div>
          <div className="space-y-4">
            {goals.map((g) => {
              const p = Math.min(100, pct(g.current, g.target));
              const isMoney = g.unit === "₹";
              const fmt = (n: number) =>
                isMoney ? `₹${(n / 1000).toFixed(0)}k` : `${n} ${g.unit}`;
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink">
                      <Badge tone="muted" className="text-[10px]">{g.pillar}</Badge>
                      {g.title}
                    </span>
                    <span className="text-ink-muted">
                      <span className="font-semibold text-ink">{fmt(g.current)}</span> / {fmt(g.target)}
                    </span>
                  </div>
                  <ProgressBar value={p} tone={p >= 60 ? "good" : "ruby"} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Overall radial */}
        <Card className="flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start font-display text-lg font-bold text-ink">Sprint pulse</h2>
          <p className="mb-2 self-start text-sm text-ink-muted">Average goal completion.</p>
          <div className="relative h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ name: "p", value: overallProgress, fill: "#fb3a63" }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "#2b1c20" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black text-gradient">{overallProgress}%</span>
              <span className="text-xs text-ink-faint">on track</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Outreach pipeline */}
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Outreach pipeline</h2>
            <Link to="/rolodex" className="flex items-center gap-1 text-sm text-ruby-bright hover:underline">
              Open Rolodex <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#7c6a6c", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(225,29,72,0.08)" }}
                  contentStyle={{
                    background: "#1a1113",
                    border: "1px solid #36262b",
                    borderRadius: 12,
                    color: "#f6ece9",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((_, i) => (
                    <Cell key={i} fill={i >= 5 ? "#34d399" : "#fb3a63"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top research */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Top targets</h2>
            <Link to="/research" className="flex items-center gap-1 text-sm text-ruby-bright hover:underline">
              HIVE <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {topResearch.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                  <p className="truncate text-xs text-ink-faint">{r.sector}</p>
                </div>
                <span className="ml-2 font-display text-sm font-black text-amber-bright">{r.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink to="/talent" icon={Users} title="Place talent" desc={`${talent.filter((t) => t.status === "Available").length} students available`} />
        <QuickLink to="/opportunities" icon={Briefcase} title="Share opportunities" desc={`${stats.sharedJobs} live · ${jobs.reduce((a, j) => a + j.applicants, 0)} applicants`} />
        <QuickLink to="/partners" icon={IndianRupee} title="Sponsorship leverage" desc={`${partners.filter((p) => p.sponsorshipEnabled).length} academic partners enabled`} />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to}>
      <Card hover className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ruby/10 text-ruby-bright">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-ink-muted">{desc}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 text-ink-faint" />
      </Card>
    </Link>
  );
}
