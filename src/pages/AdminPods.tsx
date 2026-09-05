import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Info, Network, Search, ShieldAlert, Star, Users2 } from "lucide-react";
import { podPortfolioQueryOptions } from "@/lib/adminQueries";
import type { PodPortfolioEntry } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Select } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Misc";

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

export default function AdminPods() {
  const portfolioQuery = useQuery(podPortfolioQueryOptions());
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const [showScoreGuide, setShowScoreGuide] = useState(false);
  const [selectedPod, setSelectedPod] = useState<PodPortfolioEntry | null>(null);
  const deferredQuery = useDeferredValue(query);
  const pods = portfolioQuery.data || [];

  const rows = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return pods.filter((pod) => {
      if (health !== "all" && pod.health !== health) return false;
      if (!needle) return true;
      return [pod.name, pod.collegeName, pod.podLeader].join(" ").toLowerCase().includes(needle);
    });
  }, [deferredQuery, health, pods]);

  return (
    <div>
      <PageHeader
        icon={Network}
        title="Pod Portfolio"
        description="Live pod membership, activation, leadership, clubs, and challenge health."
        actions={<Button variant="secondary" onClick={() => void portfolioQuery.refetch()}>Refresh</Button>}
      />

      <Card className="mb-4 p-4 sm:p-5">
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

      {showScoreGuide ? <ScoreGuide /> : null}

      {portfolioQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Loading pod portfolio…</Card>
      ) : portfolioQuery.isError ? (
        <Card className="p-8 text-center text-sm text-bad">
          {portfolioQuery.error instanceof Error ? portfolioQuery.error.message : "Could not load pod portfolio."}
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {rows.map((pod) => (
            <PodPortfolioCard key={pod.id} pod={pod} onSelect={() => setSelectedPod(pod)} />
          ))}
        </div>
      )}

      <PodDrawer pod={selectedPod} onClose={() => setSelectedPod(null)} />
    </div>
  );
}

function PodPortfolioCard({ pod, onSelect }: { pod: PodPortfolioEntry; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="block h-full w-full text-left">
      <Card hover className="flex h-full flex-col p-5 shadow-none sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{pod.name}</h2>
              <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{pod.collegeName} · Lead {pod.podLeader || "Unassigned"}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ruby-bright">
            View pod
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
          <PodStrengthStars memberCount={pod.memberCount} />
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Activation</p>
            <p className="font-display text-2xl font-black text-gradient">{pod.activationPercent}%</p>
          </div>
        </div>

        <ProgressBar value={pod.activationPercent} tone={pod.activationPercent >= 80 ? "good" : pod.activationPercent >= 40 ? "amber" : "ruby"} className="mt-4" />

        <div className="mt-auto grid grid-cols-2 divide-x divide-y divide-line border-t border-line pt-4 sm:grid-cols-4 sm:divide-y-0">
          <InlineStat label="Active users" value={pod.memberCount} />
          <InlineStat label="Clubs" value={pod.clubs.length} />
          <InlineStat label="Open challenges" value={pod.openChallenges} />
          <InlineStat label="Resolved" value={pod.resolvedChallenges} />
        </div>
      </Card>
    </button>
  );
}

function ScoreGuide() {
  const guideItems = [
    ["Strength", "Active users linked to the pod. 1 user equals 1 star, capped at 5 stars."],
    ["Activation", "Progress through the pod activation journey and its required tasks."],
    ["Health", "Overall pod status: Thriving, Watching, or At Risk."],
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
        <div className="flex items-center gap-1" aria-label="Maximum pod strength is 5 stars">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="h-4 w-4 text-amber-bright" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {guideItems.map(([label, description]) => (
          <div key={label} className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function PodDrawer({ pod, onClose }: { pod: PodPortfolioEntry | null; onClose: () => void }) {
  if (!pod) return null;
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
