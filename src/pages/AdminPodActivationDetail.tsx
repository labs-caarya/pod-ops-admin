import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Package, Rocket } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import {
  buildActivationSnapshot,
  POD_ACTIVATION_CATEGORIES,
} from "@/lib/podActivation";
import { collegesQueryOptions, podActivationQueryOptions } from "@/lib/adminQueries";
import { cn } from "@/lib/utils";

export default function AdminPodActivationDetail() {
  const { podId = "" } = useParams();
  const collegesQuery = useQuery(collegesQueryOptions());
  const activationQuery = useQuery(podActivationQueryOptions());
  const progress = activationQuery.data?.progress || [];
  const artifacts = activationQuery.data?.artifacts || [];
  const pod = collegesQuery.data?.find((item) => item.id === podId && item.isPod);

  const snapshot = useMemo(() => {
    void progress;
    return buildActivationSnapshot(podId, progress, artifacts);
  }, [artifacts, podId, progress]);

  if (collegesQuery.isPending || activationQuery.isPending) {
    return <Card className="p-8 text-center text-sm text-ink-muted">Loading pod…</Card>;
  }

  if (!pod) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display font-bold text-ink">Pod not found</p>
        <Link to="/pod-activation" className="mt-2 inline-block text-sm text-ruby-bright hover:underline">
          ← Back to activation overview
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Rocket}
        title={`${pod.name} · Activation`}
        description={`${pod.crew} — Level 0 progress and category breakdown.`}
        actions={
          <Link
            to="/pod-activation"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> All pods
          </Link>
        }
      />

      <Card className="mb-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-ink">Overall progress</p>
            <p className="text-sm text-ink-muted">
              {snapshot.complete} of {snapshot.total} steps complete
            </p>
          </div>
          <span className="font-display text-2xl font-black text-gradient">{snapshot.percent}%</span>
        </div>
        <ProgressBar value={snapshot.percent} tone={snapshot.percent >= 100 ? "good" : "ruby"} />
      </Card>

      <div className="space-y-4">
        {POD_ACTIVATION_CATEGORIES.map((category) => {
          const catSnap = snapshot.byCategory.find((c) => c.categoryId === category.id);
          const catItems = snapshot.items.filter((item) => item.categoryId === category.id);
          return (
            <Card key={category.id} className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">{category.title}</p>
                  <p className="text-xs text-ink-muted">
                    {catSnap?.complete ?? 0}/{catSnap?.total ?? 5} complete
                  </p>
                </div>
                <ProgressBar
                  value={catSnap?.total ? ((catSnap.complete / catSnap.total) * 100) : 0}
                  tone={(catSnap?.complete ?? 0) === (catSnap?.total ?? 5) ? "good" : "amber"}
                  className="w-28"
                />
              </div>
              <div className="divide-y divide-line">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        item.type === "learn" ? "bg-info/10 text-info" : "bg-amber/10 text-amber-bright",
                      )}
                    >
                      {item.status === "locked" ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : item.status === "complete" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-good" />
                      ) : item.type === "learn" ? (
                        <BookOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Package className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        {item.status === "complete" ? (
                          <Badge tone="good">Complete</Badge>
                        ) : item.status === "locked" ? (
                          <Badge tone="muted">Locked</Badge>
                        ) : (
                          <Badge tone={item.type === "learn" ? "info" : "amber"}>
                            {item.type === "learn" ? "Learn" : "Do"}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
                      {item.artifact?.title && (
                        <p className="mt-1 text-xs text-ink-faint">Artifact: {item.artifact.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
