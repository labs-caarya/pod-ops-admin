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
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { ServiceStrengthChart } from "@/components/dashboard/ServiceStrengthChart";
import { TalentDistributionMap } from "@/components/dashboard/TalentDistributionMap";
import { OutreachPipelineFlow } from "@/components/dashboard/OutreachPipelineFlow";
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
import { formatGoalAmount, getLevelUpSnapshot } from "@/lib/data/levelUp";
import { LEVEL_UP_RESOURCE_PATH } from "@/lib/data/levelUpResource";
import { CLOSED_WIN } from "@/lib/constants";

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

  const levelUp = useMemo(() => getLevelUpSnapshot(goals), [goals]);

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
        {/* Level-up objectives */}
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink">Level-up objectives</h2>
                <Badge tone="ruby">Level {levelUp.currentLevel}</Badge>
                <span className="text-xs text-ink-faint">→ Level {levelUp.nextLevel}</span>
                <Badge tone={levelUp.readyToLevelUp ? "good" : levelUp.overallProgress >= 60 ? "amber" : "muted"}>
                  {levelUp.objectivesComplete}/{levelUp.objectivesTotal} complete
                </Badge>
              </div>
              <p className="text-sm text-ink-muted">
                Hit every objective below to level up your pod. Each pillar unlocks the next tier of Caarya support.
              </p>
            </div>
            <Link
              to={LEVEL_UP_RESOURCE_PATH}
              className="flex shrink-0 items-center gap-1 text-sm text-ruby-bright hover:underline"
            >
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {levelUp.objectives.map(({ goal: g, progress: p, complete }) => (
              <div key={g.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-ink">
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Complete" />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-strong text-[9px] font-bold text-ink-faint">
                        {Math.round(p)}%
                      </span>
                    )}
                    <Badge tone="muted" className="shrink-0 text-[10px]">{g.pillar}</Badge>
                    <span className="truncate">{g.title}</span>
                  </span>
                  <span className="shrink-0 text-ink-muted">
                    <span className="font-semibold text-ink">{formatGoalAmount(g, g.current)}</span>
                    {" / "}
                    {formatGoalAmount(g, g.target)}
                  </span>
                </div>
                <ProgressBar value={p} tone={complete ? "good" : p >= 60 ? "amber" : "ruby"} />
              </div>
            ))}
          </div>
          {levelUp.readyToLevelUp && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-good/30 bg-good/10 px-3 py-2 text-sm text-good">
              <Zap className="h-4 w-4 shrink-0" />
              All objectives met — your pod is ready to level up to Level {levelUp.nextLevel}!
            </div>
          )}
        </Card>

        {/* Progress toward next level */}
        <Card className="flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start font-display text-lg font-bold text-ink">Progress pulse</h2>
          <p className="mb-1 self-start text-sm text-ink-muted">Completed toward Level {levelUp.nextLevel}.</p>
          <p className="mb-3 self-start text-xs text-ink-faint">
            {levelUp.objectivesComplete} of {levelUp.objectivesTotal} objectives done ·{" "}
            {levelUp.overallProgress}% overall
          </p>
          <div className="relative h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ name: "p", value: levelUp.overallProgress, fill: "#fb3a63" }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "#2b1c20" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black text-gradient">{levelUp.overallProgress}%</span>
              <span className="text-xs text-ink-faint">to Level {levelUp.nextLevel}</span>
            </div>
          </div>
          <div className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-center text-xs text-ink-muted">
            <span className="font-semibold text-ink">Level {levelUp.currentLevel}</span>
            {" → "}
            <span className="font-semibold text-ruby-bright">Level {levelUp.nextLevel}</span>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ServiceStrengthChart talent={talent} />

        {/* Top research */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Top targets</h2>
            <Link to="/research" className="flex items-center gap-1 text-sm text-ruby-bright hover:underline">
              Research HIVE <ArrowRight className="h-3.5 w-3.5" />
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

      <div className="mt-4">
        <OutreachPipelineFlow contacts={contacts} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TalentDistributionMap talent={talent} />
        </div>
        <div className="flex flex-col gap-3">
          <QuickLink to="/talent" icon={Users} title="Place talent" desc={`${talent.filter((t) => t.status === "Available").length} students available`} />
          <QuickLink to="/opportunities" icon={Briefcase} title="Share opportunities" desc={`${stats.sharedJobs} live · ${jobs.reduce((a, j) => a + j.applicants, 0)} applicants`} />
          <QuickLink to="/partners" icon={IndianRupee} title="Sponsorship leverage" desc={`${partners.filter((p) => p.sponsorshipEnabled).length} academic partners enabled`} />
        </div>
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
    <Link to={to} className="block h-full">
      <Card hover className="flex h-full items-center gap-3 p-4">
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
