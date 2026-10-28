import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Sparkles } from "lucide-react";
import { dashboardQueryOptions } from "@/lib/adminQueries";
import type { PodInsight, PodPeriodMetrics, PodPortfolioEntry } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  canEditCrewLeadReport,
  crewLeadReportLimit,
  listCrewLeadReports,
  saveCrewLeadReport,
  type CrewLeadReport,
} from "@/lib/progressReports";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

const SIGNAL_LABELS: { key: keyof PodPeriodMetrics; label: string }[] = [
  { key: "researchCreated", label: "researches added" },
  { key: "researchScored", label: "researches scored" },
  { key: "outreachActivities", label: "partner outreaches done" },
  { key: "meetings", label: "meetings held" },
  { key: "opportunitiesCreated", label: "opportunities added" },
  { key: "opportunitiesShared", label: "opportunities shared" },
  { key: "offersSent", label: "offers sent" },
  { key: "offersAccepted", label: "offers accepted" },
  { key: "placements", label: "placements" },
  { key: "challengesOpened", label: "challenges opened" },
  { key: "challengesResolved", label: "challenges resolved" },
  { key: "goalsCompleted", label: "goals completed" },
];

function fallbackInsight(pod: PodPortfolioEntry): PodInsight {
  return {
    collegeId: pod.id,
    podName: pod.name,
    collegeName: pod.collegeName,
    crew: pod.crew || "",
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
      current: 1,
      next: 2,
      progress: pod.activationPercent,
      name: "Forming",
      nextName: "Activated",
      checks: [],
    },
  };
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export default function ProgressReport() {
  const { user } = useAuth();
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [reports, setReports] = useState<CrewLeadReport[]>(() => listCrewLeadReports());
  const data = dashboardQuery.data;
  const insights = useMemo(
    () => (data?.insights?.length ? data.insights : (data?.pods || []).map(fallbackInsight))
      .slice()
      .sort((left, right) => left.podName.localeCompare(right.podName)),
    [data],
  );
  const reportByPod = useMemo(
    () => new Map(reports.map((report) => [report.collegeId, report])),
    [reports],
  );

  function persist(collegeId: string, body: string) {
    const saved = saveCrewLeadReport({
      collegeId,
      body,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || user?.username || "Pod admin",
    });
    setReports((current) => [...current.filter((item) => item.collegeId !== collegeId), saved]);
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        icon={ClipboardList}
        title="Progress Report"
        description="Every pod, with Moksha’s system movement and a two-line note from the CREW lead."
        className="mb-0"
        actions={
          <div className="flex rounded-xl border border-line bg-surface-2 p-1" role="group" aria-label="Moksha report window">
            <button type="button" className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", period === "daily" ? "bg-ruby/20 text-ink" : "text-ink-muted")} onClick={() => setPeriod("daily")}>Today</button>
            <button type="button" className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", period === "weekly" ? "bg-ruby/20 text-ink" : "text-ink-muted")} onClick={() => setPeriod("weekly")}>7 days</button>
          </div>
        }
      />

      {dashboardQuery.isPending ? (
        <Card className="p-8 text-center text-sm text-ink-muted">Gathering pod progress…</Card>
      ) : dashboardQuery.isError ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-muted">Progress could not be loaded.</p>
          <Button className="mt-3" variant="secondary" onClick={() => void dashboardQuery.refetch()}>Retry</Button>
        </Card>
      ) : insights.length === 0 ? (
        <Card className="p-8 text-center text-sm text-ink-muted">No pods to report on yet.</Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pod</th>
                  <th className="px-4 py-3 font-semibold">Moksha report</th>
                  <th className="px-4 py-3 font-semibold">CREW lead report</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((insight) => (
                  <tr key={insight.collegeId} className="border-t border-line align-top">
                    <td className="w-[18%] px-4 py-4">
                      <p className="font-semibold text-ink">{insight.podName}</p>
                      <p className="mt-1 text-xs text-ink-faint">{insight.crew || insight.collegeName}</p>
                    </td>
                    <td className="w-[41%] px-4 py-4">
                      <MokshaSignals metrics={period === "daily" ? insight.daily : insight.weekly} />
                    </td>
                    <td className="w-[41%] px-4 py-4">
                      <CrewLeadEditor
                        report={reportByPod.get(insight.collegeId)}
                        canEdit={canEditCrewLeadReport(user, insight)}
                        onSave={(body) => persist(insight.collegeId, body)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {insights.map((insight) => (
              <Card key={insight.collegeId} className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">{insight.podName}</h2>
                    <p className="mt-0.5 text-xs text-ink-faint">{insight.crew || insight.collegeName}</p>
                  </div>
                  <Badge tone="muted">{period === "daily" ? "Today" : "7 days"}</Badge>
                </div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <Sparkles className="h-3.5 w-3.5 text-ruby-bright" /> Moksha report
                </p>
                <MokshaSignals metrics={period === "daily" ? insight.daily : insight.weekly} />
                <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-ink-faint">CREW lead report</p>
                <CrewLeadEditor
                  report={reportByPod.get(insight.collegeId)}
                  canEdit={canEditCrewLeadReport(user, insight)}
                  onSave={(body) => persist(insight.collegeId, body)}
                />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MokshaSignals({ metrics }: { metrics: PodPeriodMetrics }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
        {SIGNAL_LABELS.map((signal) => {
          const value = metrics[signal.key] ?? 0;
          return (
            <li
              key={signal.key}
              className={cn(
                "rounded-full border px-2 py-1 text-xs",
                value > 0 ? "border-ruby/30 bg-ruby/10 text-ink" : "border-line text-ink-faint",
              )}
            >
              +{value} {signal.label}
            </li>
          );
        })}
    </ul>
  );
}

function CrewLeadEditor({
  report,
  canEdit,
  onSave,
}: {
  report?: CrewLeadReport;
  canEdit: boolean;
  onSave: (body: string) => void;
}) {
  const [draft, setDraft] = useState(report?.body ?? "");
  const [saved, setSaved] = useState(report?.body ?? "");
  const dirty = draft.trim() !== saved.trim();

  if (!canEdit) {
    return (
      <div>
        <p className="text-sm leading-relaxed text-ink">{report?.body || "No CREW lead note yet."}</p>
        {report?.updatedBy ? (
          <p className="mt-1 text-xs text-ink-faint">{report.updatedBy}{report.updatedAt ? ` · ${formatWhen(report.updatedAt)}` : ""}</p>
        ) : (
          <p className="mt-1 text-xs text-ink-faint">Only a CREW lead or an authorized pod admin can update this.</p>
        )}
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const body = draft.trim().slice(0, crewLeadReportLimit());
        onSave(body);
        setSaved(body);
        setDraft(body);
      }}
    >
      <textarea
        value={draft}
        maxLength={crewLeadReportLimit()}
        rows={2}
        placeholder="Two lines on how the pod is actually doing."
        onChange={(event) => setDraft(event.target.value.slice(0, crewLeadReportLimit()))}
        className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-ruby/50"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-faint">
          {report?.updatedBy ? `${report.updatedBy}${report.updatedAt ? ` · ${formatWhen(report.updatedAt)}` : ""}` : "CREW lead or authorized pod admin"}
        </p>
        <Button type="submit" size="sm" disabled={!dirty}>{dirty ? "Save" : "Saved"}</Button>
      </div>
    </form>
  );
}
