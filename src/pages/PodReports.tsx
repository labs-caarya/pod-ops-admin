import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  Clock3,
  HeartHandshake,
  Eye,
  ListFilter,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardQueryOptions } from "@/lib/adminQueries";
import type { PodInsight, PodPeriodMetrics, PodPortfolioEntry } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { ProgressBar } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

type ReportPeriod = "daily" | "weekly";

const EMPTY_METRICS: PodPeriodMetrics = {
  researchCreated: 0,
  researchScored: 0,
  outreachActivities: 0,
  meetings: 0,
  opportunitiesCreated: 0,
  opportunitiesShared: 0,
  offersSent: 0,
  offersAccepted: 0,
  placements: 0,
  challengesOpened: 0,
  challengesResolved: 0,
  goalsCompleted: 0,
};

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

function fallbackInsight(pod: PodPortfolioEntry): PodInsight {
  return {
    collegeId: pod.id,
    podName: pod.name,
    collegeName: pod.collegeName,
    crew: pod.crew || "Unassigned crew",
    health: pod.health,
    activationPercent: pod.activationPercent,
    daily: EMPTY_METRICS,
    weekly: EMPTY_METRICS,
    previousWeek: EMPTY_METRICS,
    snapshot: {
      activePartners: 0,
      talentMapped: 0,
      openOpportunities: 0,
      openChallenges: pod.openChallenges,
      criticalChallenges: pod.criticalChallenges,
      overdueGoals: 0,
      mentors: 0,
      contactsInConversation: 0,
    },
    level: {
      current: pod.activationPercent >= 100 ? 2 : 1,
      next: pod.activationPercent >= 100 ? 3 : 2,
      progress: pod.activationPercent >= 100 ? 0 : pod.activationPercent,
      name: pod.activationPercent >= 100 ? "Activated" : "Forming",
      nextName: pod.activationPercent >= 100 ? "Operating" : "Activated",
      checks: [{
        id: "activation",
        label: "Complete pod activation",
        current: pod.activationPercent,
        target: 100,
        unit: "%",
        met: pod.activationPercent >= 100,
      }],
    },
  };
}

export default function PodReports() {
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [selectedPodIds, setSelectedPodIds] = useState<Set<string>>(new Set());
  const [selectionReady, setSelectionReady] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [quickSummaryIds, setQuickSummaryIds] = useState<Set<string>>(new Set());
  const [detailPodId, setDetailPodId] = useState<string | null>(null);
  const data = dashboardQuery.data;
  const insights = useMemo(
    () => data?.insights?.length ? data.insights : (data?.pods || []).map(fallbackInsight),
    [data],
  );

  useEffect(() => {
    if (!selectionReady && insights.length) {
      setSelectedPodIds(new Set(insights.map((item) => item.collegeId)));
      setSelectionReady(true);
    }
  }, [insights, selectionReady]);

  const selectedInsights = useMemo(
    () => insights
      .filter((item) => selectedPodIds.has(item.collegeId))
      .sort((a, b) => {
        const gainDifference = getTotalGains(period === "daily" ? b.daily : b.weekly)
          - getTotalGains(period === "daily" ? a.daily : a.weekly);
        return gainDifference || a.podName.localeCompare(b.podName);
      }),
    [insights, period, selectedPodIds],
  );
  const detailedInsight = detailPodId ? insights.find((item) => item.collegeId === detailPodId) : null;

  function togglePod(podId: string) {
    setSelectedPodIds((current) => {
      const next = new Set(current);
      if (next.has(podId)) next.delete(podId);
      else next.add(podId);
      return next;
    });
  }

  function toggleQuickSummary(podId: string) {
    setQuickSummaryIds((current) => {
      const next = new Set(current);
      if (next.has(podId)) next.delete(podId);
      else next.add(podId);
      return next;
    });
  }

  function openDetailedSummary(podId: string) {
    setDetailPodId(podId);
    window.requestAnimationFrame(() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        icon={CalendarDays}
        title="Daily & weekly pod reports"
        description="A calm, evidence-based view of what each pod moved forward, where the team may be stuck, and the kindest next action to help them progress."
        className="mb-0"
        actionsClassName="w-auto justify-end"
        actions={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh reports"
            title="Refresh reports"
            onClick={() => void dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", dashboardQuery.isFetching && "animate-spin")} />
          </Button>
        }
      />

      {dashboardQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Gathering the latest pod signals…</Card>
      ) : !insights.length ? (
        <Card className="p-8 text-center">
          <p className="font-display text-lg font-bold text-ink">No pods to report on yet</p>
          <p className="mt-1 text-sm text-ink-muted">Once a pod is created, its daily rhythm and level progress will appear here.</p>
        </Card>
      ) : (
        <>
          <section className="report-toolbar" aria-label="Report controls">
            <button type="button" onClick={() => setSelectionOpen(true)} className="pod-selection-trigger">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ruby/10 text-ruby-bright"><UsersRound className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Pods in view</span>
                <span className="block truncate text-sm font-semibold text-ink">{selectedPodIds.size === insights.length ? `All ${insights.length} pods` : `${selectedPodIds.size} of ${insights.length} pods`}</span>
              </span>
              <ListFilter className="h-4 w-4 shrink-0 text-ink-muted" />
            </button>
            <div className="report-period-switch" aria-label="Report period">
              <button type="button" onClick={() => setPeriod("daily")} className={cn(period === "daily" && "is-active")}>Today</button>
              <button type="button" onClick={() => setPeriod("weekly")} className={cn(period === "weekly" && "is-active")}>7 days</button>
            </div>
          </section>

          {detailedInsight ? (
            <div>
              <div className="pod-watch-bar">
                <span className="flex min-w-0 items-center gap-2">
                  <Eye className="h-4 w-4 shrink-0 text-ruby-bright" />
                  <span className="truncate text-sm text-ink-muted">Now watching <strong className="font-semibold text-ink">{detailedInsight.podName}</strong></span>
                </span>
                <button type="button" onClick={() => setDetailPodId(null)} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ruby-bright hover:text-amber-bright">
                  <ChevronLeft className="h-3.5 w-3.5" /> Pod cards
                </button>
              </div>
              <PodReport insight={detailedInsight} period={period} />
            </div>
          ) : selectedInsights.length ? (
            <section aria-labelledby="pod-cards-heading">
              <div className="mb-3">
                <h2 id="pod-cards-heading" className="font-display text-lg font-bold text-ink">Pods at a glance</h2>
                <p className="mt-1 text-sm text-ink-muted">Open a quick summary when you need context, or step into the detailed evidence for one pod.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {selectedInsights.map((insight) => (
                  <PodReportCard
                    key={insight.collegeId}
                    insight={insight}
                    period={period}
                    quickSummaryOpen={quickSummaryIds.has(insight.collegeId)}
                    onToggleQuickSummary={() => toggleQuickSummary(insight.collegeId)}
                    onViewDetails={() => openDetailedSummary(insight.collegeId)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <Card className="p-6 text-center">
              <p className="font-display text-lg font-bold text-ink">Choose at least one pod</p>
              <p className="mt-1 text-sm text-ink-muted">Your selection only changes this view. No pod data is edited.</p>
              <Button className="mt-4" variant="secondary" onClick={() => setSelectionOpen(true)}>Select pods</Button>
            </Card>
          )}

          <PodSelectionPanel
            open={selectionOpen}
            insights={insights}
            selectedIds={selectedPodIds}
            onToggle={togglePod}
            onSelectAll={() => setSelectedPodIds(new Set(insights.map((item) => item.collegeId)))}
            onClear={() => setSelectedPodIds(new Set())}
            onClose={() => setSelectionOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function PodReportCard({
  insight,
  period,
  quickSummaryOpen,
  onToggleQuickSummary,
  onViewDetails,
}: {
  insight: PodInsight;
  period: ReportPeriod;
  quickSummaryOpen: boolean;
  onToggleQuickSummary: () => void;
  onViewDetails: () => void;
}) {
  const metrics = period === "daily" ? insight.daily : insight.weekly;
  const totalGains = getTotalGains(metrics);
  const happening = getPodCardSummary(insight, metrics, period);
  return (
    <Card className="pod-report-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink sm:text-lg">{insight.podName}</h3>
            <Badge tone={healthTone[insight.health]}>{insight.health}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-faint">{formatCrewName(insight.crew)} · L{insight.level.current} {insight.level.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Gains</p>
          <p className="font-display text-xl font-black text-ink">{totalGains}</p>
        </div>
      </div>
      <div className="mt-3 min-h-12 border-t border-line pt-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{happening}</p>
      </div>
      <div className="mt-3">
        <button
          type="button"
          role="switch"
          aria-checked={quickSummaryOpen}
          aria-expanded={quickSummaryOpen}
          onClick={onToggleQuickSummary}
          className="focus-ring flex min-h-8 w-full items-center justify-between gap-3 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors", quickSummaryOpen ? "justify-end border-ruby/70 bg-ruby/45" : "justify-start border-line-strong bg-surface-2")}>
              <span className={cn("h-3.5 w-3.5 rounded-full shadow-sm transition-colors", quickSummaryOpen ? "bg-white" : "bg-ink-muted")} />
            </span>
            <span>Quick summary</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform", quickSummaryOpen && "rotate-180")} />
        </button>
      </div>
      {quickSummaryOpen ? (
        <div className="mt-3 grid grid-cols-4 divide-x divide-line border-y border-line py-2.5">
          <QuickMetric label="Research done" value={metrics.researchScored} />
          <QuickMetric label="Client outreach" value={metrics.outreachActivities} />
          <QuickMetric label="Challenges" value={metrics.challengesOpened} />
          <QuickMetric label="New profiles" value={metrics.researchCreated} />
        </div>
      ) : null}
      <button type="button" onClick={onViewDetails} className="mt-4 inline-flex w-full items-center justify-between border-t border-line pt-3 text-sm font-semibold text-ruby-bright hover:text-amber-bright">
        View detailed summary <ArrowRight className="h-4 w-4" />
      </button>
    </Card>
  );
}

function QuickMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-1.5 text-center first:pl-0 last:pr-0 sm:px-2">
      <p className="font-display text-lg font-black leading-none text-ink">{value}</p>
      <p className="mt-1 whitespace-nowrap text-[clamp(0.48rem,2vw,0.625rem)] font-medium leading-none tracking-tight text-ink-faint">{label}</p>
    </div>
  );
}

function PodSelectionPanel({
  open,
  insights,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  onClose,
}: {
  open: boolean;
  insights: PodInsight[];
  selectedIds: Set<string>;
  onToggle: (podId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const crews = useMemo(() => {
    const grouped = new Map<string, PodInsight[]>();
    insights.forEach((insight) => {
      const crew = formatCrewName(insight.crew);
      grouped.set(crew, [...(grouped.get(crew) || []), insight]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [insights]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Choose pods"
      subtitle="Group and compare the pods you want to understand right now."
      width="max-w-md"
      panelClassName="max-sm:h-[78dvh] max-sm:max-w-none max-sm:self-end max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t max-sm:animate-[slideup_0.25s_ease]"
      bodyClassName="px-4 py-3 sm:px-5"
      footerClassName="px-4 py-3 sm:px-5"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">{selectedIds.size} of {insights.length} selected</p>
          <Button onClick={onClose}>Show pod cards</Button>
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
        <button type="button" onClick={onSelectAll} className="text-sm font-semibold text-ruby-bright hover:underline">Select all</button>
        <button type="button" onClick={onClear} className="text-sm text-ink-muted hover:text-ink">Clear</button>
      </div>
      <div className="space-y-5">
        {crews.map(([crew, pods]) => (
          <fieldset key={crew}>
            <legend className="mb-2 flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
              <span>{crew}</span><span>{pods.filter((pod) => selectedIds.has(pod.collegeId)).length}/{pods.length}</span>
            </legend>
            <div className="divide-y divide-line border-y border-line">
              {pods.map((pod) => (
                <label key={pod.collegeId} className="flex cursor-pointer items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(pod.collegeId)}
                    onChange={() => onToggle(pod.collegeId)}
                    className="mt-0.5 h-4 w-4 rounded border-line-strong accent-ruby"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{pod.podName}</span>
                    <span className="mt-0.5 block text-xs text-ink-faint">{pod.collegeName}</span>
                  </span>
                  <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </Drawer>
  );
}

function getPodCardSummary(insight: PodInsight, metrics: PodPeriodMetrics, period: ReportPeriod) {
  if (insight.snapshot.criticalChallenges > 0) {
    return `${insight.snapshot.criticalChallenges} urgent blocker${insight.snapshot.criticalChallenges === 1 ? " is" : "s are"} slowing the team down. A clear owner and a small decision would help most.`;
  }
  if (metrics.placements > 0 || metrics.offersAccepted > 0) {
    return `A talent outcome landed ${period === "daily" ? "today" : "this week"}. The pod has momentum worth recognising and repeating.`;
  }
  if (metrics.outreachActivities > 0) {
    return `${metrics.outreachActivities} conversation${metrics.outreachActivities === 1 ? " is" : "s are"} moving, with ${metrics.meetings} meeting${metrics.meetings === 1 ? "" : "s"} recorded. Follow-through is the next useful focus.`;
  }
  if (metrics.researchCreated > 0 || metrics.researchScored > 0) {
    return `The pod is building its research base with ${metrics.researchCreated} new and ${metrics.researchScored} scored profile${metrics.researchScored === 1 ? "" : "s"}. Outreach can begin from the strongest fits.`;
  }
  return `No movement is recorded ${period === "daily" ? "today" : "in the last seven days"}. A warm check-in can clarify whether the team is resting, blocked, or catching up on updates.`;
}

function formatCrewName(value?: string) {
  const crew = value?.trim();
  if (!crew) return "Unassigned crew";
  return crew
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getTotalGains(metrics: PodPeriodMetrics) {
  return Object.values(metrics).reduce((sum, value) => sum + value, 0);
}

function PodReport({ insight, period }: { insight: PodInsight; period: ReportPeriod }) {
  const metrics = period === "daily" ? insight.daily : insight.weekly;
  const totalGains = getTotalGains(metrics);
  const completedChecks = insight.level.checks.filter((item) => item.met).length;
  const coach = getCoachMessage(insight, metrics, period);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
      <div className="min-w-0 space-y-4">
        <section className="report-hero" aria-labelledby="pod-report-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="pod-report-title" className="font-display text-xl font-black text-ink sm:text-2xl">{insight.podName}</h2>
                <Badge tone={healthTone[insight.health]}>{insight.health}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{period === "daily" ? "Today’s pulse" : "The last seven days"} · refreshed from live pod records</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-ink-faint">Meaningful gains</p>
              <p className="font-display text-2xl font-black text-ink">{totalGains}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ruby/12 text-ruby-bright">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-ink">{coach.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{coach.body}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="report-section">
          <SectionHeading title="What moved" description="Activity is grouped by the outcome it supports, so effort never gets mistaken for progress." />
          <div className="divide-y divide-line">
            <MetricRow label="Research ready for action" value={metrics.researchScored} supporting={`${metrics.researchCreated} new profiles added`} previous={period === "weekly" ? insight.previousWeek.researchScored : undefined} />
            <MetricRow label="Human conversations" value={metrics.outreachActivities} supporting={`${metrics.meetings} meeting${metrics.meetings === 1 ? "" : "s"} held`} previous={period === "weekly" ? insight.previousWeek.outreachActivities : undefined} />
            <MetricRow label="Opportunities shared" value={metrics.opportunitiesShared} supporting={`${metrics.opportunitiesCreated} created`} previous={period === "weekly" ? insight.previousWeek.opportunitiesShared : undefined} />
            <MetricRow label="Talent outcomes" value={metrics.placements + metrics.offersAccepted} supporting={`${metrics.offersSent} offer${metrics.offersSent === 1 ? "" : "s"} sent · ${metrics.placements} placed`} previous={period === "weekly" ? insight.previousWeek.placements + insight.previousWeek.offersAccepted : undefined} />
            <MetricRow label="Team commitments completed" value={metrics.goalsCompleted} supporting={`${metrics.challengesResolved} blocker${metrics.challengesResolved === 1 ? "" : "s"} resolved`} previous={period === "weekly" ? insight.previousWeek.goalsCompleted : undefined} />
          </div>
        </section>

        <section className="report-section">
          <SectionHeading title="Where a little help could matter" description="These are invitations to support the team—not performance warnings." />
          <AttentionList insight={insight} metrics={metrics} />
        </section>
      </div>

      <aside className="min-w-0 space-y-4">
        <section className="report-section xl:sticky xl:top-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Level journey</p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">L{insight.level.current} {insight.level.name} → L{insight.level.next} {insight.level.nextName}</h3>
            </div>
            <span className="font-display text-xl font-black text-gradient">{insight.level.progress}%</span>
          </div>
          <ProgressBar value={insight.level.progress} tone={insight.level.progress >= 80 ? "good" : insight.level.progress >= 45 ? "amber" : "ruby"} className="mt-4" />
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {completedChecks} of {insight.level.checks.length} milestones are ready. A level reflects sustained capability; health shows how the pod feels right now.
          </p>
          <LevelPath current={insight.level.current} />
          <div className="mt-4 divide-y divide-line border-y border-line">
            {insight.level.checks.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", item.met ? "bg-good/15 text-good" : "bg-surface-2 text-ink-faint")}>
                  {item.met ? <Check className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-ink-faint">{item.current}{item.unit} of {item.target}{item.unit}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/pod-activation" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ruby-bright hover:underline">
            Review supporting evidence <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </aside>
    </div>
  );
}

function LevelPath({ current }: { current: number }) {
  const levels = ["Forming", "Activated", "Operating", "Performing", "Scaling"];
  return (
    <div className="mt-4" aria-label={`Five-level pod journey, currently level ${current}`}>
      <div className="grid grid-cols-5 items-start">
        {levels.map((label, index) => {
          const level = index + 1;
          const reached = level <= current;
          return (
            <div key={label} className="relative flex flex-1 flex-col items-center text-center">
              {index > 0 ? <span className={cn("absolute right-1/2 top-2.5 h-px w-full", level <= current ? "bg-good/60" : "bg-line")} /> : null}
              <span className={cn("relative z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-black", reached ? "border-good/60 bg-good/15 text-good" : "border-line-strong bg-base-2 text-ink-faint")}>
                {reached ? <Check className="h-3 w-3" /> : level}
              </span>
              <span className={cn("mt-1.5 text-[10px]", reached ? "font-semibold text-ink" : "text-ink-faint")}>L{level} {label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2 border-b border-line pb-3">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}

function MetricRow({ label, value, supporting, previous }: { label: string; value: number; supporting: string; previous?: number }) {
  const delta = previous === undefined ? null : value - previous;
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{supporting}</p>
      </div>
      {delta !== null && delta !== 0 ? (
        <span className={cn("hidden items-center gap-1 text-xs sm:inline-flex", delta > 0 ? "text-good" : "text-amber-bright")}>
          {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {delta > 0 ? "+" : ""}{delta}
        </span>
      ) : null}
      <span className="w-10 text-right font-display text-2xl font-black tabular-nums text-ink">{value}</span>
    </div>
  );
}

function AttentionList({ insight, metrics }: { insight: PodInsight; metrics: PodPeriodMetrics }) {
  const items = [
    insight.snapshot.criticalChallenges > 0 && {
      tone: "bad" as const,
      title: `${insight.snapshot.criticalChallenges} urgent blocker${insight.snapshot.criticalChallenges === 1 ? " needs" : "s need"} support`,
      body: "Start with clarity and ownership. The team may need a decision more than another task.",
      to: "/challenges",
    },
    insight.snapshot.overdueGoals > 0 && {
      tone: "amber" as const,
      title: `${insight.snapshot.overdueGoals} commitment${insight.snapshot.overdueGoals === 1 ? " is" : "s are"} overdue`,
      body: "Check whether the scope is still realistic before asking the owner to recommit.",
      to: "/leader-goals",
    },
    metrics.outreachActivities === 0 && {
      tone: "muted" as const,
      title: "No outreach movement recorded",
      body: "A small, specific next message can be easier to begin than a broad outreach target.",
      to: "/leader-goals",
    },
  ].filter(Boolean) as { tone: "bad" | "amber" | "muted"; title: string; body: string; to: string }[];

  if (!items.length) {
    return (
      <div className="flex items-start gap-3 py-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" />
        <div>
          <p className="font-semibold text-ink">Nothing urgent is asking for attention</p>
          <p className="mt-1 text-sm text-ink-muted">Give the team room to keep its rhythm, and celebrate the movement already made.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {items.map((item) => (
        <Link key={item.title} to={item.to} className="group flex items-start gap-3 py-3.5">
          {item.tone === "bad" ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-bad" /> : <HeartHandshake className={cn("mt-0.5 h-5 w-5 shrink-0", item.tone === "amber" ? "text-amber-bright" : "text-ink-faint")} />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink group-hover:text-ruby-bright">{item.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint group-hover:text-ruby-bright" />
        </Link>
      ))}
    </div>
  );
}

function getCoachMessage(insight: PodInsight, metrics: PodPeriodMetrics, period: ReportPeriod) {
  if (insight.snapshot.criticalChallenges > 0) {
    return {
      title: "This pod may need cover, not pressure.",
      body: `There ${insight.snapshot.criticalChallenges === 1 ? "is" : "are"} ${insight.snapshot.criticalChallenges} high-priority blocker${insight.snapshot.criticalChallenges === 1 ? "" : "s"}. Help the team remove ambiguity before asking for more output.`,
    };
  }
  if (metrics.outreachActivities > 0 && metrics.meetings === 0) {
    return {
      title: "Good energy—now help it turn into a conversation.",
      body: `${metrics.outreachActivities} touchpoint${metrics.outreachActivities === 1 ? " was" : "s were"} recorded ${period === "daily" ? "today" : "this week"}. A thoughtful follow-up is the most useful next move.`,
    };
  }
  if (metrics.placements > 0 || metrics.offersAccepted > 0) {
    return {
      title: "A real outcome landed. Make the work visible.",
      body: "Celebrate the people behind it, capture what worked, and help the pod repeat the pattern without adding unnecessary process.",
    };
  }
  if (Object.values(metrics).every((value) => value === 0)) {
    return {
      title: "A quiet period is a prompt for curiosity, not judgment.",
      body: "Check whether the team is blocked, resting, or simply has not recorded its work yet. One warm check-in is a better start than a red status.",
    };
  }
  return {
    title: "The pod is moving—protect the next clear step.",
    body: "There is steady activity across the workflow. Keep the team focused on the smallest action that moves a relationship, opportunity, or person forward.",
  };
}
