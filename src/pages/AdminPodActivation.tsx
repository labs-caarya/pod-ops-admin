import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { StatCard } from "@/components/ui/StatCard";
import { buildActivationSnapshot, POD_ACTIVATION_CATEGORIES } from "@/lib/podActivation";
import { collegesQueryOptions } from "@/lib/adminQueries";
import { useCollection } from "@/lib/store";
import { podActivationProgressStore } from "@/lib/podActivation";

function podActivationTone(percent: number) {
  if (percent >= 100) return "good";
  if (percent >= 60) return "amber";
  return "ruby";
}

export default function AdminPodActivation() {
  const [query, setQuery] = useState("");
  const collegesQuery = useQuery(collegesQueryOptions());
  const progress = useCollection(podActivationProgressStore);
  const pods = collegesQuery.data?.filter((c) => c.isPod) ?? [];

  const rows = useMemo(() => {
    void progress;
    const needle = query.trim().toLowerCase();
    return pods
      .map((pod) => {
        const snapshot = buildActivationSnapshot(pod.id);
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
  }, [pods, progress, query]);

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
    <div>
      <PageHeader
        icon={Rocket}
        title="Pod Activation"
        description="Level 0 progress across all pods — 10 categories, 50 steps per pod."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Network average" value={`${stats.avg}%`} icon={Rocket} tone="ruby" />
        <StatCard label="Fully activated" value={stats.complete} icon={Rocket} tone="good" />
        <StatCard label="In progress" value={stats.inProgress} icon={Rocket} tone="amber" />
        <StatCard label="Not started" value={stats.notStarted} icon={Rocket} tone="muted" />
      </div>

      <Card className="mb-4 p-4">
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

      {collegesQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Loading pods…</Card>
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map(({ pod, snapshot }) => (
            <Link key={pod.id} to={`/pod-activation/${pod.id}`} className="block">
              <Card hover className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-ink">{pod.name}</h2>
                      <Badge tone="muted">{pod.crew}</Badge>
                      {snapshot.percent >= 100 ? (
                        <Badge tone="good">Complete</Badge>
                      ) : snapshot.percent > 0 ? (
                        <Badge tone="amber">In progress</Badge>
                      ) : (
                        <Badge tone="muted">Not started</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {snapshot.complete} of {snapshot.total} steps · {POD_ACTIVATION_CATEGORIES.length} categories
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl font-black text-gradient">{snapshot.percent}%</span>
                    <ChevronRight className="h-4 w-4 text-ink-faint" />
                  </div>
                </div>
                <ProgressBar value={snapshot.percent} tone={podActivationTone(snapshot.percent)} className="mt-3" />
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
  );
}
