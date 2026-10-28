import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Info, MessageSquareText, Network, RefreshCw, Search, Star, X } from "lucide-react";
import { challengesQueryOptions, dashboardQueryOptions, podCommentUnreadCountsQueryOptions, podPortfolioQueryOptions } from "@/lib/adminQueries";
import { loadAdminPodDetailPage } from "@/lib/adminRouteModules";
import type { PodInsight, PodPortfolioEntry } from "@/lib/api";
import { CHALLENGE_SEVERITY_TONE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Misc";
import { PodCommentsPanel } from "@/components/pods/PodCommentsPanel";

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

type PodDrawerView = "details" | "comments";
type RefreshState = "idle" | "loading" | "success" | "error";

export default function AdminPods() {
  const portfolioQuery = useQuery(podPortfolioQueryOptions());
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const challengesQuery = useQuery(challengesQueryOptions());
  const unreadCountsQuery = useQuery(podCommentUnreadCountsQueryOptions());
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const [strength, setStrength] = useState("all");
  const [showScoreGuide, setShowScoreGuide] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<PodPortfolioEntry | null>(null);
  const [challengePod, setChallengePod] = useState<PodPortfolioEntry | null>(null);
  const [drawerView, setDrawerView] = useState<PodDrawerView>("comments");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [starToast, setStarToast] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeStars = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const deferredQuery = useDeferredValue(query);
  const pods = portfolioQuery.data || [];
  const unreadCounts = useMemo(
    () => new Map((unreadCountsQuery.data ?? []).map((count) => [count.collegeId, count.unreadCount])),
    [unreadCountsQuery.data],
  );
  const insights = useMemo(
    () => new Map((dashboardQuery.data?.insights ?? []).map((insight) => [insight.collegeId, insight])),
    [dashboardQuery.data],
  );
  const hasActiveFilters = Boolean(query.trim() || health !== "all" || strength !== "all");
  const strengthLabel = strengthFilterLabel(strength);

  function clearFilters() {
    setQuery("");
    setHealth("all");
    setStrength("all");
  }

  function openComments(pod: PodPortfolioEntry) {
    setDrawerView("comments");
    setSelectedPod(pod);
  }

  function closePodDrawer() {
    setSelectedPod(null);
    setDrawerView("comments");
  }

  async function refreshPortfolio() {
    if (refreshState === "loading") return;
    setRefreshState("loading");
    const result = await portfolioQuery.refetch();
    void unreadCountsQuery.refetch();
    const nextState: RefreshState = result.isError ? "error" : "success";
    setRefreshState(nextState);
    window.setTimeout(() => setRefreshState("idle"), nextState === "success" ? 1_800 : 3_000);
  }

  const rows = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return pods.filter((pod) => {
      if (health !== "all" && pod.health !== health) return false;
      const podStrength = podStrengthFromMembers(pod.memberCount);
      if (strength === "none" && podStrength !== 0) return false;
      if (strength === "low" && (podStrength < 1 || podStrength > 2)) return false;
      if (strength === "growing" && (podStrength < 3 || podStrength > 4)) return false;
      if (strength === "full" && podStrength !== 5) return false;
      if (!needle) return true;
      return [pod.name, pod.collegeName, pod.podLeader].join(" ").toLowerCase().includes(needle);
    });
  }, [deferredQuery, health, pods, strength]);

  const groups = useMemo(() => {
    const buckets = new Map<number, PodPortfolioEntry[]>();
    rows.forEach((pod) => {
      const stars = podStrengthFromMembers(pod.memberCount);
      buckets.set(stars, [...(buckets.get(stars) ?? []), pod]);
    });
    return [5, 4, 3, 2, 1, 0]
      .filter((stars) => (buckets.get(stars)?.length ?? 0) > 0)
      .map((stars) => ({ stars, pods: buckets.get(stars) ?? [] }));
  }, [rows]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !groups.length) return;
    const scroller: HTMLDivElement = root;
    activeStars.current = null;

    function currentStars() {
      const marker = scroller.getBoundingClientRect().top + 28;
      const sections = [...scroller.querySelectorAll<HTMLElement>("[data-star-group]")];
      let current = sections[0] ? Number(sections[0].dataset.starGroup) : null;
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= marker) {
          current = Number(section.dataset.starGroup);
        }
      });
      return current;
    }

    function showToast(stars: number) {
      if (activeStars.current === stars) return;
      const isFirst = activeStars.current === null;
      activeStars.current = stars;
      if (isFirst) return;
      setStarToast(`${stars} star`);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setStarToast(null), 1600);
    }

    const initial = currentStars();
    if (initial !== null && !Number.isNaN(initial)) activeStars.current = initial;

    function onScroll() {
      const stars = currentStars();
      if (stars === null || Number.isNaN(stars)) return;
      showToast(stars);
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [groups]);

  const openChallenges = useMemo(() => {
    if (!challengePod) return [];
    return (challengesQuery.data ?? []).filter(
      (challenge) => challenge.collegeId === challengePod.id && challenge.status !== "Resolved",
    );
  }, [challengePod, challengesQuery.data]);

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Network}
        title="Pod Portfolio"
        description="Open a pod for talent, partners, and operations, or scan a quick summary from the card."
        className="mb-0 shrink-0"
        actionsClassName="w-auto justify-end"
        actions={
          <>
            <Button
              variant="secondary"
              size="icon"
              className="sm:hidden"
              aria-label="Refresh pod portfolio"
              title="Refresh pod portfolio"
              onClick={() => void refreshPortfolio()}
              disabled={refreshState === "loading"}
            >
              {refreshState === "loading" ? <RefreshCw className="h-4 w-4 animate-spin" /> : refreshState === "success" ? <Check className="h-4 w-4 text-good animate-[ping_0.55s_ease-out_1]" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <MobileFilterDrawer
              open={filterDrawerOpen}
              onOpen={() => setFilterDrawerOpen(true)}
              onClose={() => setFilterDrawerOpen(false)}
              active={hasActiveFilters}
              title="Pod portfolio filters"
              triggerLabel="Open pod portfolio filters"
              onClear={clearFilters}
            >
              <FieldRow label="Search">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by pod, college, or lead…" />
              </FieldRow>
              <FieldRow label="Health">
                <Select value={health} onChange={(event) => setHealth(event.target.value)}>
                  <option value="all">All health states</option>
                  <option value="Thriving">Thriving</option>
                  <option value="Watching">Watching</option>
                  <option value="At Risk">At Risk</option>
                </Select>
              </FieldRow>
              <FieldRow label="Strength">
                <Select value={strength} onChange={(event) => setStrength(event.target.value)}>
                  <option value="all">All strengths</option>
                  <option value="none">No linked users</option>
                  <option value="low">1–2 stars</option>
                  <option value="growing">3–4 stars</option>
                  <option value="full">5 stars</option>
                </Select>
              </FieldRow>
              <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink-muted" aria-live="polite">
                {rows.length} of {pods.length} pod{pods.length === 1 ? "" : "s"} match these filters. Results update immediately.
              </p>
            </MobileFilterDrawer>
            <Button className="hidden sm:inline-flex" variant="secondary" onClick={() => void refreshPortfolio()} disabled={refreshState === "loading"}>
              {refreshState === "loading" ? <RefreshCw className="h-4 w-4 animate-spin" /> : refreshState === "success" ? <Check className="h-4 w-4 text-good animate-[ping_0.55s_ease-out_1]" /> : <RefreshCw className="h-4 w-4" />}
              {refreshState === "loading" ? "Refreshing…" : refreshState === "success" ? "Updated" : refreshState === "error" ? "Try again" : "Refresh"}
            </Button>
          </>
        }
      />

      <p className="sr-only" aria-live="polite">
        {refreshState === "loading" ? "Refreshing pod portfolio" : refreshState === "success" ? "Pod portfolio updated" : refreshState === "error" ? "Could not refresh pod portfolio" : ""}
      </p>

      <Card className="hidden shrink-0 p-4 sm:block sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by pod, college, or lead…" className="pl-9" />
          </div>
          <Select value={health} onChange={(event) => setHealth(event.target.value)} className="w-full lg:w-52">
            <option value="all">All health states</option>
            <option value="Thriving">Thriving</option>
            <option value="Watching">Watching</option>
            <option value="At Risk">At Risk</option>
          </Select>
          <Select value={strength} onChange={(event) => setStrength(event.target.value)} className="w-full lg:w-44">
            <option value="all">All strengths</option>
            <option value="none">No linked users</option>
            <option value="low">1–2 stars</option>
            <option value="growing">3–4 stars</option>
            <option value="full">5 stars</option>
          </Select>
          <Button
            type="button"
            variant="secondary"
            aria-expanded={showScoreGuide}
            onClick={() => setShowScoreGuide((current) => !current)}
            className="w-full shrink-0 lg:w-auto"
          >
            <Info className="h-4 w-4" />
            Score Guide
          </Button>
        </div>
      </Card>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:hidden">
        <p className="text-xs text-ink-muted" aria-live="polite">
          {rows.length} of {pods.length} pod{pods.length === 1 ? "" : "s"} shown
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {strength !== "all" ? <Badge tone="ruby">Strength: {strengthLabel}</Badge> : null}
          {health !== "all" ? <Badge tone={healthTone[health as keyof typeof healthTone]}>Health: {health}</Badge> : null}
          {query.trim() ? <Badge tone="muted">Search active</Badge> : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-expanded={showScoreGuide}
            onClick={() => setShowScoreGuide((current) => !current)}
          >
            <Info className="h-3.5 w-3.5" />
            {showScoreGuide ? "Hide guide" : "Score guide"}
          </Button>
        </div>
      </div>

      {showScoreGuide ? <ScoreGuide onClose={() => setShowScoreGuide(false)} /> : null}

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {portfolioQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Loading pod portfolio…</Card>
      ) : portfolioQuery.isError ? (
        <Card className="p-8 text-center text-sm text-bad">
          {portfolioQuery.error instanceof Error ? portfolioQuery.error.message : "Could not load pod portfolio."}
        </Card>
        ) : groups.length ? (
          <div className="space-y-5 sm:space-y-8">
          {groups.map((group) => (
            <section key={group.stars} data-star-group={group.stars} aria-label={`${group.stars} star pods`}>
              <div className="mb-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <StarRating stars={group.stars} />
                <h2 className="font-display text-base font-bold text-ink">
                  {group.stars === 0 ? "No stars" : `${group.stars} star${group.stars === 1 ? "" : "s"}`}
                </h2>
                <span className="text-xs text-ink-faint">{group.pods.length} pod{group.pods.length === 1 ? "" : "s"}</span>
              </div>
              <div className="mx-auto grid w-full max-w-lg justify-center gap-3 px-1 [grid-template-columns:minmax(0,1fr)] sm:mx-0 sm:max-w-none sm:justify-start sm:gap-6 sm:px-0 sm:[grid-template-columns:repeat(auto-fill,minmax(18rem,22rem))]">
                {group.pods.map((pod) => (
                  <PodPortfolioCard
                    key={pod.id}
                    pod={pod}
                    unreadComments={unreadCounts.get(pod.id) ?? 0}
                    insight={insights.get(pod.id)}
                    onOpenComments={() => openComments(pod)}
                    onOpenChallenges={() => setChallengePod(pod)}
                  />
                ))}
              </div>
            </section>
          ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-ink-muted">No pods match these filters.</Card>
        )}
      </div>

      {starToast ? (
        <p role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-line bg-base-2/95 px-4 py-2 font-display text-sm font-bold text-ink shadow-2xl lg:left-auto lg:right-6 lg:translate-x-0">
          {starToast}
        </p>
      ) : null}

      <PodDrawer pod={drawerView === "comments" ? selectedPod : null} onClose={closePodDrawer} />
      <ResponsiveSheet
        open={Boolean(challengePod)}
        onClose={() => setChallengePod(null)}
        title={challengePod ? `${challengePod.name} challenges` : "Open challenges"}
        subtitle={challengePod ? `${openChallenges.length} open` : undefined}
      >
        {challengesQuery.isPending ? (
          <p className="text-sm text-ink-muted">Loading challenges…</p>
        ) : openChallenges.length ? (
          <div className="space-y-2">
            {openChallenges.map((challenge) => (
              <Link
                key={challenge.id}
                to={`/challenges/${challenge.id}`}
                onClick={() => setChallengePod(null)}
                className="block rounded-xl border border-line bg-surface-2 p-3 hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{challenge.title}</p>
                  <Badge tone={CHALLENGE_SEVERITY_TONE[challenge.severity] ?? "muted"}>{challenge.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{challenge.status} · {challenge.owner || "Unassigned"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No open challenges for this pod.</p>
        )}
      </ResponsiveSheet>
    </div>
  );
}

function PodPortfolioCard({
  pod,
  unreadComments,
  insight,
  onOpenComments,
  onOpenChallenges,
}: {
  pod: PodPortfolioEntry;
  unreadComments: number;
  insight?: PodInsight;
  onOpenComments: () => void;
  onOpenChallenges: () => void;
}) {
  const [quickSummaryOpen, setQuickSummaryOpen] = useState(false);

  return (
    <Card hover className="relative flex h-full w-full flex-col p-4 shadow-none">
      <div className="flex flex-1 flex-col">
        <div className="pr-11">
          <Link
            to={`/pods/${pod.id}`}
            onMouseEnter={() => void loadAdminPodDetailPage()}
            onFocus={() => void loadAdminPodDetailPage()}
            className="min-w-0 rounded-lg text-left focus-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold leading-tight text-ink">{pod.name}</h2>
              <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
            </div>
          </Link>
          <p className="mt-1 text-xs text-ink-muted">Lead {pod.podLeader || "Unassigned"}</p>
        </div>
        <div className="absolute right-4 top-4">
          <Button
            type="button"
            variant="primary"
            size="icon"
            className="h-8 w-8"
            aria-label={`Open comments for ${pod.name}${unreadComments ? ` (${unreadComments} unread)` : ""}`}
            title="Pod comments"
            onClick={onOpenComments}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
          </Button>
          {unreadComments > 0 ? (
            <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-surface bg-ruby-bright px-1 text-[10px] font-bold leading-5 text-white" aria-label={`${unreadComments} unread comments`}>
              {unreadComments > 99 ? "99+" : unreadComments}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-2">
          <button type="button" onClick={onOpenChallenges} className="focus-ring rounded-lg text-left">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Open challenges</p>
            <p className="mt-0.5 font-display text-xl font-black leading-none text-ink">{pod.openChallenges}</p>
          </button>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Activation</p>
            <p className="mt-0.5 font-display text-xl font-black leading-none text-gradient">{pod.activationPercent}%</p>
          </div>
        </div>
        <ProgressBar value={pod.activationPercent} tone={pod.activationPercent >= 80 ? "good" : pod.activationPercent >= 40 ? "amber" : "ruby"} className="mt-2" />

        <button
          type="button"
          role="switch"
          aria-checked={quickSummaryOpen}
          aria-expanded={quickSummaryOpen}
          onClick={() => setQuickSummaryOpen((open) => !open)}
          className="focus-ring mt-2 flex min-h-8 w-full items-center justify-between gap-3 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors", quickSummaryOpen ? "justify-end border-ruby/70 bg-ruby/45" : "justify-start border-line-strong bg-surface-2")}>
              <span className={cn("h-3.5 w-3.5 rounded-full shadow-sm transition-colors", quickSummaryOpen ? "bg-white" : "bg-ink-muted")} />
            </span>
            <span>Quick summary</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform", quickSummaryOpen && "rotate-180")} />
        </button>
        {quickSummaryOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-2">
            <InlineStat label="Total roster strength" value={pod.memberCount} />
            <InlineStat label="Research hive" value={researchHiveCount(insight)} />
            <InlineStat label="Current rolodex" value={insight?.snapshot.contactsInConversation ?? 0} />
            <InlineStat label="Clubs mapped" value={pod.clubs.length} />
          </div>
        ) : null}
        <div className="mt-auto flex justify-end pt-2">
          <Link
            to={`/pods/${pod.id}`}
            onMouseEnter={() => void loadAdminPodDetailPage()}
            onFocus={() => void loadAdminPodDetailPage()}
            className="focus-ring inline-flex items-center gap-1 text-xs font-semibold text-ruby-bright hover:text-amber-bright"
          >
            Open pod
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ScoreGuide({ onClose }: { onClose: () => void }) {
  const guideItems = [
    ["Strength", "Active users linked to the pod. 1 user equals 1 star, capped at 5 stars."],
    ["Activation", "Progress through the pod activation journey and its required tasks."],
    ["Research hive", "Scored research profiles in this pod's hive."],
    ["Current rolodex", "Contacts currently in conversation."],
  ];

  return (
    <Card className="mb-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-ruby-bright" />
            <h2 className="font-display text-base font-bold text-ink">Pod Score Guide</h2>
          </div>
          <p className="mt-1 text-sm text-ink-muted">A quick read of the rules behind each portfolio signal.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-label="Maximum pod strength is 5 stars">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="h-4 w-4 text-amber-bright" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Hide score guide" title="Hide score guide" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {guideItems.map(([label, description]) => (
          <div key={label} className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">Health status</p>
            <p className="mt-1 text-sm text-ink-muted">Health is driven by unresolved challenges, not activation or member count.</p>
          </div>
          <span className="text-xs text-ink-faint">Open challenges only</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <HealthGuideStatus tone="good" label="Thriving" description="No open challenges." />
          <HealthGuideStatus tone="amber" label="Watching" description="1–4 open challenges need attention." />
          <HealthGuideStatus tone="bad" label="At Risk" description="5+ open challenges, or one unresolved High/Critical challenge." />
        </div>
      </div>
    </Card>
  );
}

function HealthGuideStatus({ tone, label, description }: { tone: "good" | "amber" | "bad"; label: string; description: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-2 text-sm leading-5 text-ink-muted">{description}</p>
    </div>
  );
}

function strengthFilterLabel(value: string) {
  if (value === "none") return "No users";
  if (value === "low") return "1–2 stars";
  if (value === "growing") return "3–4 stars";
  if (value === "full") return "5 stars";
  return "All";
}

function podStrengthFromMembers(memberCount: number) {
  return Math.min(Math.max(memberCount, 0), 5);
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < stars;
        return (
          <Star
            key={index}
            className={`h-4 w-4 ${filled ? "text-amber-bright" : "text-black"}`}
            fill="currentColor"
            strokeWidth={0}
          />
        );
      })}
    </div>
  );
}

function researchHiveCount(insight?: PodInsight) {
  const check = insight?.level.checks.find((item) => {
    const text = `${item.id} ${item.label}`.toLowerCase();
    return (text.includes("hive") || text.includes("research")) && item.unit !== "%";
  });
  if (check) return check.current;
  return insight?.weekly.researchScored ?? 0;
}

function InlineStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase leading-tight tracking-[0.08em] text-ink-faint">{label}</p>
      <p className="mt-0.5 font-display text-base font-black leading-none text-ink">{value}</p>
    </div>
  );
}

function PodDrawer({
  pod,
  onClose,
}: {
  pod: PodPortfolioEntry | null;
  onClose: () => void;
}) {
  if (!pod) return null;
  return (
    <Drawer open={Boolean(pod)} onClose={onClose} title={`${pod.name} comments`} subtitle={pod.collegeName} width="max-w-3xl">
      <PodCommentsPanel collegeId={pod.id} />
    </Drawer>
  );
}
