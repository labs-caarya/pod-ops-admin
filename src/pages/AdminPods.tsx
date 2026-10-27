import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Check, ChevronDown, Info, MessageSquareText, Network, RefreshCw, Search, ShieldAlert, Star, Users2, X } from "lucide-react";
import { podCommentUnreadCountsQueryOptions, podPortfolioQueryOptions } from "@/lib/adminQueries";
import type { PodPortfolioEntry } from "@/lib/api";
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
  const unreadCountsQuery = useQuery(podCommentUnreadCountsQueryOptions());
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const [strength, setStrength] = useState("all");
  const [showScoreGuide, setShowScoreGuide] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<PodPortfolioEntry | null>(null);
  const [drawerView, setDrawerView] = useState<PodDrawerView>("details");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const deferredQuery = useDeferredValue(query);
  const pods = portfolioQuery.data || [];
  const unreadCounts = useMemo(
    () => new Map((unreadCountsQuery.data ?? []).map((count) => [count.collegeId, count.unreadCount])),
    [unreadCountsQuery.data],
  );
  const hasActiveFilters = Boolean(query.trim() || health !== "all" || strength !== "all");
  const strengthLabel = strengthFilterLabel(strength);

  function clearFilters() {
    setQuery("");
    setHealth("all");
    setStrength("all");
  }

  function openPodDrawer(pod: PodPortfolioEntry, view: PodDrawerView) {
    setDrawerView(view);
    setSelectedPod(pod);
  }

  function closePodDrawer() {
    setSelectedPod(null);
    setDrawerView("details");
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

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Network}
        title="Pod Portfolio"
        description="Live pod membership, activation, leadership, clubs, and challenge health."
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

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {portfolioQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Loading pod portfolio…</Card>
      ) : portfolioQuery.isError ? (
        <Card className="p-8 text-center text-sm text-bad">
          {portfolioQuery.error instanceof Error ? portfolioQuery.error.message : "Could not load pod portfolio."}
        </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
          {rows.map((pod) => (
            <PodPortfolioCard
              key={pod.id}
              pod={pod}
              unreadComments={unreadCounts.get(pod.id) ?? 0}
              onSelect={() => openPodDrawer(pod, "details")}
              onOpenComments={() => openPodDrawer(pod, "comments")}
            />
          ))}
          </div>
        )}
      </div>

      <PodDrawer pod={selectedPod} view={drawerView} onClose={closePodDrawer} />
    </div>
  );
}

function PodPortfolioCard({
  pod,
  unreadComments,
  onSelect,
  onOpenComments,
}: {
  pod: PodPortfolioEntry;
  unreadComments: number;
  onSelect: () => void;
  onOpenComments: () => void;
}) {
  return (
    <Card hover className="relative flex h-full flex-col p-5 shadow-none sm:p-6">
      <div className="flex flex-1 flex-col">
        <div className="pr-11">
          <button type="button" onClick={onSelect} className="min-w-0 text-left focus-ring rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{pod.name}</h2>
              <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Lead {pod.podLeader || "Unassigned"}</p>
          </button>
          <div className="mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onSelect}>
              View pod
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
          <Button
            type="button"
            variant="primary"
            size="icon"
            aria-label={`Open comments for ${pod.name}${unreadComments ? ` (${unreadComments} unread)` : ""}`}
            title="Pod comments"
            onClick={onOpenComments}
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
          {unreadComments > 0 ? (
            <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-surface bg-ruby-bright px-1 text-[10px] font-bold leading-5 text-white" aria-label={`${unreadComments} unread comments`}>
              {unreadComments > 99 ? "99+" : unreadComments}
            </span>
          ) : null}
        </div>

        <button type="button" onClick={onSelect} className="mt-5 flex w-full flex-1 flex-col text-left focus-ring rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
          <PodStrengthStars memberCount={pod.memberCount} />
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Activation</p>
            <p className="font-display text-2xl font-black text-gradient">{pod.activationPercent}%</p>
          </div>
          </div>

          <ProgressBar value={pod.activationPercent} tone={pod.activationPercent >= 80 ? "good" : pod.activationPercent >= 40 ? "amber" : "ruby"} className="mt-4" />

          <div className="mt-auto hidden grid-cols-4 divide-x divide-line border-t border-line pt-4 sm:grid">
            <InlineStat label="Active users" value={pod.memberCount} />
            <InlineStat label="Clubs" value={pod.clubs.length} />
            <InlineStat label="Open challenges" value={pod.openChallenges} />
            <InlineStat label="Resolved" value={pod.resolvedChallenges} />
          </div>
        </button>
      </div>

      <details className="group mt-4 border-t border-line pt-3 sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Pod metrics
          <ChevronDown className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 grid auto-rows-fr grid-cols-2 gap-2">
          <MobileMetric label="Active users" value={pod.memberCount} />
          <MobileMetric label="Clubs" value={pod.clubs.length} />
          <MobileMetric label="Open challenges" value={pod.openChallenges} />
          <MobileMetric label="Resolved" value={pod.resolvedChallenges} />
        </div>
      </details>
    </Card>
  );
}

function ScoreGuide({ onClose }: { onClose: () => void }) {
  const guideItems = [
    ["Strength", "Active users linked to the pod. 1 user equals 1 star, capped at 5 stars."],
    ["Activation", "Progress through the pod activation journey and its required tasks."],
    ["Open Challenges", "Live blockers or requests that still need movement."],
    ["Resolved", "Challenges already closed by the pod team."],
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

function PodStrengthStars({ memberCount }: { memberCount: number }) {
  const strength = podStrengthFromMembers(memberCount);

  return (
    <div
      className="text-left"
      aria-label={`Pod strength ${strength} out of 5 stars`}
      title={`${memberCount} linked account${memberCount === 1 ? "" : "s"} · ${strength}/5 strength`}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Strength</p>
      <div className="mt-1 flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < strength;
          return (
            <Star
              key={index}
              className={`h-5 w-5 ${filled ? "text-amber-bright" : "text-black"}`}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 first:pl-0 odd:border-l-0 sm:first:pl-0">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-[76px] flex-col justify-between rounded-lg border border-line bg-surface-2 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-xl font-black leading-none text-ink">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function PodDrawer({
  pod,
  view,
  onClose,
}: {
  pod: PodPortfolioEntry | null;
  view: PodDrawerView;
  onClose: () => void;
}) {
  if (!pod) return null;
  if (view === "comments") {
    return (
      <Drawer open={Boolean(pod)} onClose={onClose} title={`${pod.name} comments`} subtitle={pod.collegeName} width="max-w-3xl">
        <PodCommentsPanel collegeId={pod.id} />
      </Drawer>
    );
  }
  const leadership = [
    ["Exec Lead", pod.podLeader],
    ["Talent Development Lead", pod.podTalentManager],
    ["Marketing Lead", pod.podOutreachManager],
    ["Ops Lead", pod.podResearcher],
    ["Partner Relations Lead", pod.podPartnerManager],
    ["Strategic Partnership Associate", pod.podStrategicPartnershipAssociate],
  ];
  return (
    <Drawer open={Boolean(pod)} onClose={onClose} title={pod.name} subtitle={pod.collegeName} width="max-w-3xl">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2"><Users2 className="h-4 w-4 text-ruby-bright" /><h3 className="font-display font-bold text-ink">Leadership</h3></div>
          <div className="space-y-2">
            {leadership.map(([role, name]) => (
              <div key={role} className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-xs text-ink-faint">{role}</p>
                <p className="text-sm font-semibold text-ink">{name || "Unassigned"}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-bright" /><h3 className="font-display font-bold text-ink">Clubs</h3></div>
          <div className="space-y-2">
            {pod.clubs.length ? pod.clubs.map((club) => (
              <div key={club} className="rounded-xl border border-line bg-surface-2 p-3 text-sm font-semibold text-ink">{club}</div>
            )) : <p className="text-sm text-ink-muted">No clubs linked.</p>}
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-4">
        <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-ruby-bright" /><h3 className="font-display font-bold text-ink">Challenge health</h3></div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Open" value={pod.openChallenges} />
          <Stat label="Critical" value={pod.criticalChallenges} />
          <Stat label="Resolved" value={pod.resolvedChallenges} />
        </div>
      </Card>
    </Drawer>
  );
}
