import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { FieldRow, Input } from "@/components/ui/Field";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { StatCard } from "@/components/ui/StatCard";
import { buildActivationSnapshot, POD_ACTIVATION_CATEGORIES } from "@/lib/podActivation";
import { collegesQueryOptions, podActivationQueryOptions } from "@/lib/adminQueries";

function podActivationTone(percent: number) {
  if (percent >= 100) return "good";
  if (percent >= 60) return "amber";
  return "ruby";
}

export default function AdminPodActivation() {
  const [query, setQuery] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const collegesQuery = useQuery(collegesQueryOptions());
  const activationQuery = useQuery(podActivationQueryOptions());
  const progress = activationQuery.data?.progress || [];
  const artifacts = activationQuery.data?.artifacts || [];
  const pods = useMemo(
    () => (collegesQuery.data || []).filter((college) => college.isPod),
    [collegesQuery.data],
  );

  const rows = useMemo(() => {
    void progress;
    const needle = query.trim().toLowerCase();
    return pods
      .map((pod) => {
        const snapshot = buildActivationSnapshot(pod.id, progress, artifacts);
        return {
          pod,
          snapshot,
        };
      })
      .filter(({ pod }) => {
        if (!needle) return true;
        return [pod.name, pod.crew, pod.id].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => b.snapshot.percent - a.snapshot.percent);
  }, [artifacts, pods, progress, query]);

  const hasActiveFilters = Boolean(query.trim());

  function clearFilters() {
    setQuery("");
  }

  const stats = useMemo(() => {
    if (!rows.length) {
      return { avg: 0, complete: 0, inProgress: 0, notStarted: 0 };
    }
    const avg = Math.round(rows.reduce((sum, row) => sum + row.snapshot.percent, 0) / rows.length);
    const complete = rows.filter((row) => row.snapshot.percent >= 100).length;
    const notStarted = rows.filter((row) => row.snapshot.percent === 0).length;
    const inProgress = rows.length - complete - notStarted;
    return { avg, complete, inProgress, notStarted };
  }, [rows]);

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Rocket}
        title="Pod Activation"
        description="Level 0 progress across all pods — 10 categories, 50 steps per pod."
        className="mb-0 shrink-0"
        actionsClassName="w-auto justify-end"
        actions={
          <MobileFilterDrawer
            open={filterDrawerOpen}
            onOpen={() => setFilterDrawerOpen(true)}
            onClose={() => setFilterDrawerOpen(false)}
            active={hasActiveFilters}
            title="Pod activation filters"
            triggerLabel="Open pod activation filters"
            onClear={clearFilters}
          >
            <FieldRow label="Search">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pods by name, crew, or id…" />
            </FieldRow>
          </MobileFilterDrawer>
        }
      />

      <div className="-mx-4 flex shrink-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        <div className="w-44 shrink-0 snap-start sm:w-auto"><StatCard className="h-24 p-3" label="Network avg." value={`${stats.avg}%`} icon={Rocket} tone="ruby" /></div>
        <div className="w-44 shrink-0 snap-start sm:w-auto"><StatCard className="h-24 p-3" label="Activated" value={stats.complete} icon={Rocket} tone="good" /></div>
        <div className="w-44 shrink-0 snap-start sm:w-auto"><StatCard className="h-24 p-3" label="In progress" value={stats.inProgress} icon={Rocket} tone="amber" /></div>
        <div className="w-44 shrink-0 snap-start sm:w-auto"><StatCard className="h-24 p-3" label="Not started" value={stats.notStarted} icon={Rocket} tone="muted" /></div>
      </div>

      <Card className="hidden shrink-0 p-4 sm:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pods by name, crew, or id…"
            className="pl-9"
          />
        </div>
      </Card>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {collegesQuery.isPending || activationQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Loading pods…</Card>
      ) : collegesQuery.isError || activationQuery.isError ? (
        <Card className="p-8 text-center text-sm text-bad">
          {(collegesQuery.error || activationQuery.error) instanceof Error
            ? (collegesQuery.error || activationQuery.error)?.message
            : "Could not load activation data."}
        </Card>
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map(({ pod, snapshot }) => (
            <Link key={pod.id} to={`/pod-activation/${pod.id}`} className="block">
              <Card hover className="flex h-[118px] flex-col p-3 sm:h-auto sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate font-display text-base font-bold text-ink sm:text-lg">{pod.name}</h2>
                      <Badge tone="muted" className="hidden shrink-0 sm:inline-flex">{pod.crew}</Badge>
                      {snapshot.percent >= 100 ? (
                        <Badge tone="good" className="shrink-0">Complete</Badge>
                      ) : snapshot.percent > 0 ? (
                        <Badge tone="amber" className="shrink-0">In progress</Badge>
                      ) : (
                        <Badge tone="muted" className="shrink-0">Not started</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                      {snapshot.complete}/{snapshot.total} steps <span className="hidden sm:inline">· {POD_ACTIVATION_CATEGORIES.length} categories</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl font-black text-gradient">{snapshot.percent}%</span>
                    <ChevronRight className="h-4 w-4 text-ink-faint" />
                  </div>
                </div>
                <ProgressBar value={snapshot.percent} tone={podActivationTone(snapshot.percent)} className="mt-auto pt-2 sm:mt-3 sm:pt-0" />
              </Card>
            </Link>
          ))}
        </div>
        ) : (
          <EmptyState
          title="No pods found"
          description={query ? "Try a different search." : "No industrial pods are registered yet."}
          />
        )}
      </div>
    </div>
  );
}
