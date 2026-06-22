import { Link } from "react-router-dom";
import { ArrowLeft, Target, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { goalStore, POD } from "@/lib/data/collections";
import { formatGoalAmount, getLevelUpSnapshot } from "@/lib/data/levelUp";

const PILLAR_GUIDE: {
  pillar: string;
  summary: string;
  howTo: string;
  link: { to: string; label: string };
}[] = [
  {
    pillar: "Research",
    summary: "Build depth in HIVE — profile brands, score fit, and know when to push to outreach.",
    howTo: "Each brand researched and scored in Research HIVE counts toward your target.",
    link: { to: "/research", label: "Research HIVE" },
  },
  {
    pillar: "Network",
    summary: "Convert outreach into real partners — clubs, councils, industry, and campus companies.",
    howTo: "Partners won in Rolodex (closed-won stage) count toward this objective.",
    link: { to: "/rolodex", label: "Rolodex" },
  },
  {
    pillar: "Talent",
    summary: "Map students and place them on partner and pod opportunities.",
    howTo: "Students marked Placed on your Talent Map count toward placement goals.",
    link: { to: "/talent", label: "Talent Map" },
  },
  {
    pillar: "Opportunities",
    summary: "Pump internships and gigs into the network so talent can mobilise.",
    howTo: "Opportunities shared or live on the Opportunity Canvas count toward this goal.",
    link: { to: "/opportunities", label: "Opportunity Canvas" },
  },
  {
    pillar: "Brand",
    summary: "Mobilise sponsorship value through academic partner leverage dashboards.",
    howTo: "Total ₹ value of sponsorship assets committed or delivered across enabled academic partners.",
    link: { to: "/partners", label: "Partners" },
  },
];

const LEVEL_UNLOCKS: Record<number, string[]> = {
  4: [
    "Priority access to Caarya industry partner intros",
    "Expanded placement agent capacity across your crew",
    "Sponsorship leverage templates for academic partners",
    "Pod spotlight in the Caarya network",
  ],
};

export default function ResourceLevelUp() {
  const goals = useCollection(goalStore);
  const levelUp = getLevelUpSnapshot(goals);
  const unlocks = LEVEL_UNLOCKS[levelUp.nextLevel] ?? [
    "More Caarya support, tooling, and network access as your pod proves impact.",
  ];

  return (
    <div>
      <Link
        to="/resources"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Resources
      </Link>

      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="ruby">Guide</Badge>
          <Badge tone="muted">Pod ops</Badge>
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
          How pod leveling works
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Caarya pods level up by hitting objectives across five pillars — research, network, talent,
          opportunities, and brand. Every objective must reach its target before your pod advances.
        </p>
      </div>

      <Card className="mb-6 border-ruby/25 bg-gradient-to-br from-ruby/10 via-surface-2 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ruby-bright">Your pod today</p>
            <p className="mt-1 font-display text-xl font-black text-ink">
              {POD.name} · Level {levelUp.currentLevel}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{POD.college} · {POD.crew}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface/80 px-4 py-3 text-right">
            <p className="text-xs text-ink-faint">Progress to Level {levelUp.nextLevel}</p>
            <p className="font-display text-2xl font-black text-gradient">{levelUp.overallProgress}%</p>
            <p className="text-xs text-ink-muted">
              {levelUp.objectivesComplete}/{levelUp.objectivesTotal} objectives complete
            </p>
          </div>
        </div>
        {levelUp.readyToLevelUp && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-good/30 bg-good/10 px-3 py-2 text-sm text-good">
            <Zap className="h-4 w-4 shrink-0" />
            All objectives met — your pod is ready to level up!
          </div>
        )}
      </Card>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-ruby/15 text-ruby-bright">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="font-display font-bold text-ink">1 · Objectives</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Each level defines targets across five pillars. Progress is tracked automatically from your
            activity in this portal — HIVE profiles, Rolodex wins, placed talent, shared jobs, and
            sponsorship value.
          </p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber/15 text-amber-bright">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="font-display font-bold text-ink">2 · All must complete</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Levelling up is not an average — you need <strong className="text-ink">every</strong> objective
            at 100% before advancing. The progress pulse on your dashboard shows overall momentum, but
            the gate is all-or-nothing per level.
          </p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-good/15 text-good">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="font-display font-bold text-ink">3 · Unlock support</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Higher levels unlock more Caarya backing — intros, tooling, templates, and visibility. Prove
            impact at each tier before the next unlocks.
          </p>
        </Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-ink">Current level-up objectives</h2>
      <p className="mb-4 text-sm text-ink-muted">
        Targets for Level {levelUp.nextLevel} — live from your dashboard.
      </p>
      <div className="mb-8 space-y-3">
        {levelUp.objectives.map(({ goal: g, progress: p, complete }) => {
          const guide = PILLAR_GUIDE.find((x) => x.pillar === g.pillar);
          return (
            <Card key={g.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="muted">{g.pillar}</Badge>
                    {complete && <Badge tone="good">Complete</Badge>}
                  </div>
                  <p className="mt-1 font-semibold text-ink">{g.title}</p>
                  {guide && <p className="mt-1 text-sm text-ink-muted">{guide.howTo}</p>}
                </div>
                <div className="text-right text-sm">
                  <span className="font-semibold text-ink">{formatGoalAmount(g, g.current)}</span>
                  <span className="text-ink-muted"> / {formatGoalAmount(g, g.target)}</span>
                </div>
              </div>
              <ProgressBar value={p} tone={complete ? "good" : p >= 60 ? "amber" : "ruby"} className="mt-3" />
              {guide && (
                <Link
                  to={guide.link.to}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-ruby-bright hover:underline"
                >
                  Go to {guide.link.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-ink">The five pillars</h2>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {PILLAR_GUIDE.map((g) => (
          <Card key={g.pillar} className="p-4">
            <Badge tone="muted" className="mb-2">{g.pillar}</Badge>
            <p className="text-sm text-ink-muted">{g.summary}</p>
            <Link
              to={g.link.to}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ruby-bright hover:underline"
            >
              {g.link.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          What unlocks at Level {levelUp.nextLevel}
        </h2>
        <ul className="mt-3 space-y-2">
          {unlocks.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
              {item}
            </li>
          ))}
        </ul>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-ruby-bright hover:underline">
          Back to dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </div>
  );
}
