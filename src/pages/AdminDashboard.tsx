import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Eye,
  GraduationCap,
  Handshake,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import {
  collegesQueryOptions,
  dashboardQueryOptions,
  futureCraftApplicantsQueryOptions,
  contentCalendarQueryOptions,
  industryApplicantsQueryOptions,
  marketingCampaignsQueryOptions,
  networkPartnersQueryOptions,
  podActivationQueryOptions,
  podPortfolioQueryOptions,
} from "@/lib/adminQueries";
import { buildActivationSnapshot } from "@/lib/podActivation";
import {
  APPLICANT_TRACKS,
  applicantTrackMeta,
  buildTrackerApplicants,
  type ApplicantTrackId,
  type TrackerApplicant,
} from "@/lib/applicantTracks";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { CompactStatGrid } from "@/components/ui/CompactStatGrid";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { ContentCalendarItem, MarketingCalendarCampaign, NetworkPartner, PodPortfolioEntry } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const PREVIEW_COUNT = 5;

type DashboardTab = "pod-ops" | "partnerships" | "marketing";
type SheetId = "activation" | "applicants" | "at-risk" | "watching" | "thriving" | "club-partners" | "industry-partners" | "marketing-this" | "marketing-next" | "content-this" | "content-next" | null;

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "pod-ops", label: "Pod ops" },
  { id: "partnerships", label: "Partnerships" },
  { id: "marketing", label: "Marketing" },
];
type PodHealth = PodPortfolioEntry["health"];
type TrackFilter = "all" | ApplicantTrackId;

const trackTone = {
  "experience-studio": "info",
  castle: "amber",
  fws: "good",
} as const;

export default function AdminDashboard() {
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const activationQuery = useQuery(podActivationQueryOptions());
  const studioQuery = useQuery(futureCraftApplicantsQueryOptions());
  const industryQuery = useQuery(industryApplicantsQueryOptions());
  const portfolioQuery = useQuery(podPortfolioQueryOptions());
  const partnersQuery = useQuery(networkPartnersQueryOptions());
  const campaignsQuery = useQuery(marketingCampaignsQueryOptions());
  const contentCalendarQuery = useQuery(contentCalendarQueryOptions());
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("pod-ops");
  const [sheet, setSheet] = useState<SheetId>(null);
  const [track, setTrack] = useState<TrackFilter>("all");

  const activationRows = useMemo(() => {
    const pods = (collegesQuery.data || []).filter((college) => college.isPod);
    const progress = activationQuery.data?.progress || [];
    const artifacts = activationQuery.data?.artifacts || [];
    return pods
      .map((pod) => {
        const snapshot = buildActivationSnapshot(pod.id, progress, artifacts);
        const stamps = [
          ...progress.filter((item) => item.collegeId === pod.id).map((item) => item.completedAt),
          ...artifacts.filter((item) => item.collegeId === pod.id).map((item) => item.updatedAt || item.createdAt),
        ]
          .map((value) => (value ? new Date(value).getTime() : 0))
          .filter((value) => !Number.isNaN(value) && value > 0);
        return {
          id: pod.id,
          name: pod.name,
          crew: pod.crew,
          percent: snapshot.percent,
          complete: snapshot.complete,
          total: snapshot.total,
          latestAt: stamps.length ? Math.max(...stamps) : 0,
        };
      })
      .sort((left, right) => right.latestAt - left.latestAt || right.percent - left.percent || left.name.localeCompare(right.name));
  }, [activationQuery.data, collegesQuery.data]);

  const applicants = useMemo(
    () => buildTrackerApplicants(studioQuery.data || [], industryQuery.data || []),
    [industryQuery.data, studioQuery.data],
  );
  const filteredApplicants = useMemo(
    () => (track === "all" ? applicants : applicants.filter((applicant) => applicant.track === track)),
    [applicants, track],
  );

  const healthGroups = useMemo(() => {
    const pods = portfolioQuery.data || [];
    return {
      atRisk: podsByHealth(pods, "At Risk"),
      watching: podsByHealth(pods, "Watching"),
      thriving: podsByHealth(pods, "Thriving"),
    };
  }, [portfolioQuery.data]);
  const clubPartners = useMemo(
    () => (partnersQuery.data || []).filter((partner) => partner.spaType === "Clubs"),
    [partnersQuery.data],
  );
  const industryPartners = useMemo(
    () => (partnersQuery.data || []).filter((partner) => partner.category === "industry"),
    [partnersQuery.data],
  );
  const weeks = useMemo(() => weekWindows(), []);
  const marketingWeeks = useMemo(
    () => ({
      thisWeek: campaignsInWeek(campaignsQuery.data || [], weeks.thisWeek),
      nextWeek: campaignsInWeek(campaignsQuery.data || [], weeks.nextWeek),
    }),
    [campaignsQuery.data, weeks],
  );
  const contentWeeks = useMemo(
    () => ({
      thisWeek: contentInWeek(contentCalendarQuery.data || [], weeks.thisWeek),
      nextWeek: contentInWeek(contentCalendarQuery.data || [], weeks.nextWeek),
    }),
    [contentCalendarQuery.data, weeks],
  );

  const data = dashboardQuery.data;
  const activationLoading = collegesQuery.isPending || activationQuery.isPending;
  const applicantsLoading = studioQuery.isPending || industryQuery.isPending;

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={LayoutDashboard}
        title="Network dashboard"
        description="Pod ops, partnerships, and marketing."
        className="mb-0 shrink-0"
      />

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-1" role="tablist" aria-label="Dashboard sections">
        {DASHBOARD_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={dashboardTab === item.id}
            onClick={() => setDashboardTab(item.id)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              dashboardTab === item.id ? "bg-ruby/15 text-ruby-bright" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {dashboardTab === "pod-ops" ? (
        <>
        {dashboardQuery.isPending ? (
          <Card className="p-8 text-center text-sm text-ink-muted">Loading network stats…</Card>
        ) : !data ? (
          <Card className="p-8 text-center text-sm text-bad">
            {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Could not load dashboard stats."}
          </Card>
        ) : (
          <CompactStatGrid label="Network stats" className="grid-cols-2 xl:grid-cols-4">
            <StatCard className="h-24 p-3" label="Active pods" value={data.metrics.activePods} icon={Building2} tone="ruby" />
            <StatCard className="h-24 p-3" label="Active pod leaders" value={data.metrics.activePodLeaders ?? 0} icon={UserRound} tone="info" />
            <StatCard className="h-24 p-3" label="Open challenges" value={data.metrics.openChallenges} icon={TriangleAlert} tone="amber" />
            <StatCard className="h-24 p-3" label="Applicants" value={studioQuery.isSuccess || industryQuery.isSuccess ? applicants.length : data.metrics.applicants} icon={BriefcaseBusiness} tone="good" />
          </CompactStatGrid>
        )}

        <Card className="p-4 sm:p-5">
          <SectionHeader
            icon={TriangleAlert}
            title="Pod health"
            description="At risk and watching pods need a look. Thriving pods are highlighted."
          />
          {portfolioQuery.isPending ? (
            <p className="mt-4 text-sm text-ink-muted">Loading pod health…</p>
          ) : portfolioQuery.isError ? (
            <p className="mt-4 text-sm text-bad">Could not load pod health.</p>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <HealthColumn
                title="At risk"
                tone="bad"
                pods={healthGroups.atRisk}
                onViewAll={() => setSheet("at-risk")}
              />
              <HealthColumn
                title="Watching"
                tone="amber"
                pods={healthGroups.watching}
                onViewAll={() => setSheet("watching")}
              />
              <HealthColumn
                title="Thriving"
                tone="good"
                highlighted
                pods={healthGroups.thriving}
                onViewAll={() => setSheet("thriving")}
              />
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            icon={Rocket}
            title="Latest activation"
            description="The five pods with the most recent activation movement."
            action={activationRows.length > 0 ? <ViewAllButton count={activationRows.length} onClick={() => setSheet("activation")} /> : null}
          />
          {activationLoading ? (
            <p className="mt-4 text-sm text-ink-muted">Loading activation…</p>
          ) : collegesQuery.isError || activationQuery.isError ? (
            <p className="mt-4 text-sm text-bad">Could not load activation summaries.</p>
          ) : activationRows.length ? (
            <div className="mt-4 space-y-3">
              {activationRows.slice(0, PREVIEW_COUNT).map((row) => (
                <ActivationRow key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">No pods are registered yet.</p>
          )}
        </Card>
        </>
        ) : null}

        {dashboardTab === "partnerships" ? (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              <PartnerListCard
                icon={Landmark}
                title="Latest club partners"
                description="Clubs added across pods, newest first."
                partners={clubPartners}
                loading={partnersQuery.isPending}
                error={partnersQuery.isError}
                empty="No club partners yet."
                onViewAll={() => setSheet("club-partners")}
              />
              <PartnerListCard
                icon={Handshake}
                title="Latest industry partners"
                description="Industry partners added across the network, newest first."
                partners={industryPartners}
                loading={partnersQuery.isPending}
                error={partnersQuery.isError}
                empty="No industry partners yet."
                onViewAll={() => setSheet("industry-partners")}
              />
            </div>
            <Card className="p-4 sm:p-5">
              <SectionHeader
                icon={GraduationCap}
                title="Applicants tracker"
                description="Latest applications across Experience Studio, Castle, and FWS."
                action={filteredApplicants.length > 0 ? <ViewAllButton count={filteredApplicants.length} onClick={() => setSheet("applicants")} /> : null}
              />
              <TrackFilter value={track} onChange={setTrack} />
              {applicantsLoading ? (
                <p className="mt-4 text-sm text-ink-muted">Loading applicants…</p>
              ) : studioQuery.isError && industryQuery.isError ? (
                <p className="mt-4 text-sm text-bad">Could not load applicants.</p>
              ) : filteredApplicants.length ? (
                <div className="mt-4 space-y-2">
                  {filteredApplicants.slice(0, PREVIEW_COUNT).map((applicant) => (
                    <ApplicantRow key={applicant.id} applicant={applicant} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-muted">{emptyApplicantsCopy(track)}</p>
              )}
            </Card>
          </>
        ) : null}

        {dashboardTab === "marketing" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <WeekCalendarCard
                icon={Megaphone}
                title="Marketing calendar"
                description="Campaigns running this week and next."
                thisWeek={marketingWeeks.thisWeek}
                nextWeek={marketingWeeks.nextWeek}
                thisLabel={weekLabel(weeks.thisWeek)}
                nextLabel={weekLabel(weeks.nextWeek)}
                loading={campaignsQuery.isPending}
                error={campaignsQuery.isError}
                empty="No campaigns scheduled."
                onViewThis={() => setSheet("marketing-this")}
                onViewNext={() => setSheet("marketing-next")}
              />
              <WeekCalendarCard
                icon={CalendarDays}
                title="Content calendar"
                description="Content targeted for this week and next."
                thisWeek={contentWeeks.thisWeek}
                nextWeek={contentWeeks.nextWeek}
                thisLabel={weekLabel(weeks.thisWeek)}
                nextLabel={weekLabel(weeks.nextWeek)}
                loading={contentCalendarQuery.isPending}
                error={contentCalendarQuery.isError}
                empty="Nothing targeted."
                onViewThis={() => setSheet("content-this")}
                onViewNext={() => setSheet("content-next")}
              />
            </div>
        ) : null}
      </div>

      <ResponsiveSheet
        open={sheet === "activation"}
        onClose={() => setSheet(null)}
        title="Pod activation"
        subtitle={`${activationRows.length} pod${activationRows.length === 1 ? "" : "s"}`}
      >
        <div className="space-y-3">
          {activationRows.map((row) => (
            <ActivationRow key={row.id} row={row} />
          ))}
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={sheet === "at-risk" || sheet === "watching" || sheet === "thriving"}
        onClose={() => setSheet(null)}
        title={sheet === "at-risk" ? "At risk pods" : sheet === "watching" ? "Watching pods" : "Thriving pods"}
        subtitle={healthSheetSubtitle(sheet, healthGroups)}
      >
        <div className="space-y-2">
          {healthSheetPods(sheet, healthGroups).map((pod) => (
            <HealthPodRow key={pod.id} pod={pod} />
          ))}
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={sheet === "club-partners" || sheet === "industry-partners"}
        onClose={() => setSheet(null)}
        title={sheet === "club-partners" ? "Club partners" : "Industry partners"}
        subtitle={`${(sheet === "club-partners" ? clubPartners : industryPartners).length} added`}
      >
        <div className="space-y-2">
          {(sheet === "club-partners" ? clubPartners : industryPartners).map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={sheet === "marketing-this" || sheet === "marketing-next" || sheet === "content-this" || sheet === "content-next"}
        onClose={() => setSheet(null)}
        title={calendarSheetTitle(sheet)}
        subtitle={calendarSheetSubtitle(sheet, weeks)}
      >
        <div className="space-y-2">
          {calendarSheetEntries(sheet, marketingWeeks, contentWeeks).map((entry) => (
            <CalendarEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={sheet === "applicants"}
        onClose={() => setSheet(null)}
        title="All applicants"
        subtitle={`${filteredApplicants.length} shown`}
      >
        <TrackFilter value={track} onChange={setTrack} />
        <div className="mt-4 space-y-2">
          {filteredApplicants.length ? (
            filteredApplicants.map((applicant) => <ApplicantRow key={applicant.id} applicant={applicant} />)
          ) : (
            <p className="text-sm text-ink-muted">{emptyApplicantsCopy(track)}</p>
          )}
        </div>
      </ResponsiveSheet>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-ruby-bright" />
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ViewAllButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ruby-bright hover:text-amber-bright">
      View all ({count})
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function activationTone(percent: number) {
  if (percent >= 100) return "good" as const;
  if (percent > 0) return "amber" as const;
  return "muted" as const;
}

function activationLabel(percent: number) {
  if (percent >= 100) return "Complete";
  if (percent > 0) return "In progress";
  return "Not started";
}

function ActivationRow({
  row,
}: {
  row: { id: string; name: string; crew: string; percent: number; complete: number; total: number; latestAt: number };
}) {
  return (
    <Link to={`/pods/${row.id}?tab=ops`} className="block rounded-2xl border border-line bg-surface-2 p-4 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold text-ink">{row.name}</p>
            <Badge tone={activationTone(row.percent)}>{activationLabel(row.percent)}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {row.crew} · {row.complete}/{row.total} steps
            {row.latestAt ? ` · Updated ${formatDate(row.latestAt)}` : ""}
          </p>
        </div>
        <span className="font-display text-xl font-black text-gradient">{row.percent}%</span>
      </div>
      <ProgressBar value={row.percent} tone={row.percent >= 100 ? "good" : row.percent >= 40 ? "amber" : "ruby"} className="mt-3" />
    </Link>
  );
}

function TrackFilter({ value, onChange }: { value: TrackFilter; onChange: (value: TrackFilter) => void }) {
  const options: { id: TrackFilter; label: string }[] = [
    { id: "all", label: "All" },
    ...APPLICANT_TRACKS.map((item) => ({ id: item.id, label: item.label })),
  ];

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Applicant track">
      {options.map((option) => {
        const selected = value === option.id;
        const meta = option.id === "all" ? null : applicantTrackMeta(option.id);
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected ? "border-ruby/40 bg-ruby/15 text-ruby-bright" : "border-line bg-surface-2 text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
            {meta ? <span className="ml-1 font-medium text-ink-faint">· {meta.detail}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function ApplicantRow({ applicant }: { applicant: TrackerApplicant }) {
  const meta = applicantTrackMeta(applicant.track);
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{applicant.name}</p>
        <Badge tone={trackTone[applicant.track]}>{meta.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{applicant.detail || meta.detail}</p>
      <p className="mt-1 text-xs text-ink-faint">
        {applicant.college}
        {applicant.podName ? ` · ${applicant.podName}` : ""}
        {applicant.appliedAt ? ` · ${formatDate(applicant.appliedAt)}` : ""}
      </p>
    </div>
  );
}

function emptyApplicantsCopy(track: TrackFilter) {
  if (track === "castle") return "No Castle apprenticeship applications yet.";
  if (track === "experience-studio") return "No Experience Studio applications yet.";
  if (track === "fws") return "No FWS industry applications yet.";
  return "No applications yet.";
}

const healthTone = {
  "At Risk": "bad",
  Watching: "amber",
  Thriving: "good",
} as const;

function podsByHealth(pods: PodPortfolioEntry[], health: PodHealth) {
  return pods
    .filter((pod) => pod.health === health)
    .sort((left, right) => {
      if (health === "Thriving") {
        return right.activationPercent - left.activationPercent || right.memberCount - left.memberCount || left.name.localeCompare(right.name);
      }
      return right.criticalChallenges - left.criticalChallenges || right.openChallenges - left.openChallenges || left.name.localeCompare(right.name);
    });
}

function healthSheetPods(
  sheet: SheetId,
  groups: { atRisk: PodPortfolioEntry[]; watching: PodPortfolioEntry[]; thriving: PodPortfolioEntry[] },
) {
  if (sheet === "at-risk") return groups.atRisk;
  if (sheet === "watching") return groups.watching;
  if (sheet === "thriving") return groups.thriving;
  return [];
}

function healthSheetSubtitle(
  sheet: SheetId,
  groups: { atRisk: PodPortfolioEntry[]; watching: PodPortfolioEntry[]; thriving: PodPortfolioEntry[] },
) {
  const count = healthSheetPods(sheet, groups).length;
  return `${count} pod${count === 1 ? "" : "s"}`;
}

function HealthColumn({
  title,
  tone,
  pods,
  highlighted = false,
  onViewAll,
}: {
  title: string;
  tone: "bad" | "amber" | "good";
  pods: PodPortfolioEntry[];
  highlighted?: boolean;
  onViewAll: () => void;
}) {
  const Icon = tone === "bad" ? TriangleAlert : tone === "amber" ? Eye : Sparkles;
  return (
    <div className={`rounded-2xl border p-3 ${highlighted ? "border-good/50 bg-good/10" : tone === "bad" ? "border-bad/30 bg-bad/5" : "border-amber/30 bg-amber/5"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === "bad" ? "text-bad" : tone === "amber" ? "text-amber-bright" : "text-good"}`} />
          <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
          <Badge tone={tone}>{pods.length}</Badge>
        </div>
        {pods.length > PREVIEW_COUNT ? <ViewAllButton count={pods.length} onClick={onViewAll} /> : null}
      </div>
      {pods.length ? (
        <div className="mt-3 space-y-2">
          {pods.slice(0, PREVIEW_COUNT).map((pod) => (
            <HealthPodRow key={pod.id} pod={pod} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">None right now.</p>
      )}
    </div>
  );
}

function HealthPodRow({ pod }: { pod: PodPortfolioEntry }) {
  return (
    <Link to={`/pods/${pod.id}`} className="block rounded-xl border border-line bg-surface px-3 py-2 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-ink">{pod.name}</p>
        <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        {pod.openChallenges} open · {pod.activationPercent}% activated
        {pod.podLeader ? ` · ${pod.podLeader}` : ""}
      </p>
    </Link>
  );
}

function PartnerListCard({
  icon,
  title,
  description,
  partners,
  loading,
  error,
  empty,
  onViewAll,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  partners: NetworkPartner[];
  loading: boolean;
  error: boolean;
  empty: string;
  onViewAll: () => void;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeader
        icon={icon}
        title={title}
        description={description}
        action={partners.length > PREVIEW_COUNT ? <ViewAllButton count={partners.length} onClick={onViewAll} /> : null}
      />
      {loading ? (
        <p className="mt-4 text-sm text-ink-muted">Loading partners…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-bad">Could not load partners.</p>
      ) : partners.length ? (
        <div className="mt-4 space-y-2">
          {partners.slice(0, PREVIEW_COUNT).map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">{empty}</p>
      )}
    </Card>
  );
}

function PartnerRow({ partner }: { partner: NetworkPartner }) {
  const detail = [partner.podName || "Unassigned pod", partner.institution, partner.createdAt ? formatDate(partner.createdAt) : ""]
    .filter(Boolean)
    .join(" · ");
  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{partner.name}</p>
        <Badge tone={partner.category === "industry" ? "amber" : "info"}>{partner.spaType || partner.domain || partner.category}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </>
  );
  if (!partner.podId) {
    return <div className="rounded-xl border border-line bg-surface-2 p-3">{body}</div>;
  }
  return (
    <Link to={`/pods/${partner.podId}?tab=partners`} className="block rounded-xl border border-line bg-surface-2 p-3 hover:border-line-strong">
      {body}
    </Link>
  );
}

type CalendarEntry = {
  id: string;
  title: string;
  detail: string;
  badge: string;
  tone: "good" | "amber" | "info" | "muted";
};

type WeekWindow = { start: number; end: number };

function weekWindows(now = new Date()) {
  const start = startOfWeek(now);
  const nextStart = addDays(start, 7);
  return {
    thisWeek: { start, end: addDays(start, 6) },
    nextWeek: { start: nextStart, end: addDays(nextStart, 6) },
  };
}

function startOfWeek(now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.getTime();
}

function addDays(time: number, days: number) {
  const date = new Date(time);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function dayStamp(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function coversWeek(start: string | null, end: string | null, week: WeekWindow) {
  const from = dayStamp(start);
  const to = dayStamp(end);
  if (from === null && to === null) return false;
  return (from ?? to!) <= week.end && (to ?? from!) >= week.start;
}

function shortDay(time: number) {
  return new Date(time).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function weekLabel(week: WeekWindow) {
  return `${shortDay(week.start)} – ${shortDay(week.end)}`;
}

function formatStamp(value: string | null) {
  const stamp = dayStamp(value);
  return stamp === null ? "" : shortDay(stamp);
}

function dateRange(start: string | null, end: string | null) {
  const from = formatStamp(start);
  const to = formatStamp(end);
  if (from && to && from !== to) return `${from} – ${to}`;
  return from || to;
}

function campaignsInWeek(campaigns: MarketingCalendarCampaign[], week: WeekWindow): CalendarEntry[] {
  return campaigns
    .filter((campaign) => coversWeek(campaign.startDate, campaign.endDate, week))
    .sort((left, right) => (dayStamp(left.startDate) ?? dayStamp(left.endDate) ?? 0) - (dayStamp(right.startDate) ?? dayStamp(right.endDate) ?? 0) || left.title.localeCompare(right.title))
    .map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      detail: [campaign.ownerName, dateRange(campaign.startDate, campaign.endDate)].filter(Boolean).join(" · "),
      badge: campaign.status || "Campaign",
      tone: campaign.status === "Active" ? "good" : campaign.status === "On hold" ? "amber" : campaign.status === "Completed" ? "info" : "muted",
    }));
}

function contentInWeek(items: ContentCalendarItem[], week: WeekWindow): CalendarEntry[] {
  return items
    .filter((item) => coversWeek(item.targetDate, item.targetDate, week))
    .sort((left, right) => (dayStamp(left.targetDate) ?? 0) - (dayStamp(right.targetDate) ?? 0) || left.title.localeCompare(right.title))
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: [item.channel, item.format, item.ownerName, formatStamp(item.targetDate)].filter(Boolean).join(" · "),
      badge: item.status || "Content",
      tone: item.status === "Published" || item.status === "Ready" ? "good" : item.status === "In review" || item.status === "In progress" ? "amber" : "muted",
    }));
}

function calendarSheetEntries(
  sheet: SheetId,
  marketing: { thisWeek: CalendarEntry[]; nextWeek: CalendarEntry[] },
  content: { thisWeek: CalendarEntry[]; nextWeek: CalendarEntry[] },
) {
  if (sheet === "marketing-this") return marketing.thisWeek;
  if (sheet === "marketing-next") return marketing.nextWeek;
  if (sheet === "content-this") return content.thisWeek;
  if (sheet === "content-next") return content.nextWeek;
  return [];
}

function calendarSheetTitle(sheet: SheetId) {
  if (sheet === "marketing-this") return "Marketing · this week";
  if (sheet === "marketing-next") return "Marketing · next week";
  if (sheet === "content-this") return "Content · this week";
  if (sheet === "content-next") return "Content · next week";
  return "Calendar";
}

function calendarSheetSubtitle(sheet: SheetId, weeks: { thisWeek: WeekWindow; nextWeek: WeekWindow }) {
  return weekLabel(sheet === "marketing-next" || sheet === "content-next" ? weeks.nextWeek : weeks.thisWeek);
}

function WeekCalendarCard({
  icon,
  title,
  description,
  thisWeek,
  nextWeek,
  thisLabel,
  nextLabel,
  loading,
  error,
  empty,
  onViewThis,
  onViewNext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  thisWeek: CalendarEntry[];
  nextWeek: CalendarEntry[];
  thisLabel: string;
  nextLabel: string;
  loading: boolean;
  error: boolean;
  empty: string;
  onViewThis: () => void;
  onViewNext: () => void;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeader icon={icon} title={title} description={description} />
      {loading ? (
        <p className="mt-4 text-sm text-ink-muted">Loading calendar…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-bad">Could not load this calendar.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <WeekColumn label="This week" range={thisLabel} entries={thisWeek} empty={empty} onViewAll={onViewThis} />
          <WeekColumn label="Next week" range={nextLabel} entries={nextWeek} empty={empty} onViewAll={onViewNext} />
        </div>
      )}
    </Card>
  );
}

function WeekColumn({
  label,
  range,
  entries,
  empty,
  onViewAll,
}: {
  label: string;
  range: string;
  entries: CalendarEntry[];
  empty: string;
  onViewAll: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-faint">{range}</p>
        </div>
        {entries.length > PREVIEW_COUNT ? <ViewAllButton count={entries.length} onClick={onViewAll} /> : null}
      </div>
      {entries.length ? (
        <div className="mt-2 space-y-2">
          {entries.slice(0, PREVIEW_COUNT).map((entry) => (
            <CalendarEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{empty}</p>
      )}
    </div>
  );
}

function CalendarEntryRow({ entry }: { entry: CalendarEntry }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{entry.title}</p>
        <Badge tone={entry.tone}>{entry.badge}</Badge>
      </div>
      {entry.detail ? <p className="mt-1 text-xs text-ink-muted">{entry.detail}</p> : null}
    </div>
  );
}
