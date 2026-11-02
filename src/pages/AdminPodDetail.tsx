import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Lock,
  Package,
  Plus,
  Rocket,
  Users2,
} from "lucide-react";
import {
  dashboardQueryOptions,
  futureCraftApplicantsQueryOptions,
  industryApplicantsQueryOptions,
  leaderGoalsQueryOptions,
  managedUsersQueryOptions,
  mentorsQueryOptions,
  podActivationQueryOptions,
  podPortfolioQueryOptions,
} from "@/lib/adminQueries";
import { buildTrackerApplicants, applicantTrackMeta, type TrackerApplicant } from "@/lib/applicantTracks";
import { leadershipRows } from "@/lib/podLeadership";
import { buildActivationSnapshot } from "@/lib/podActivation";
import type { AllowedUser, PodClub, PodPortfolioEntry } from "@/lib/api";
import { clubStageTone } from "@/lib/clubStage";
import { formatPodRole } from "@/lib/podRoles";
import type { PodLeaderGoal, PodMentor } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExpertiseTags } from "@/components/ui/ExpertiseTags";
import { ProgressBar } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";
import { PodLeaderGoalsPanel } from "@/components/pods/PodLeaderGoalsPanel";
import { PodQuarterlyGoalsCard } from "@/components/pods/PodQuarterlyGoalsCard";
import { buildQuarterlySnapshot, emptyQuarterlyCounts } from "@/lib/quarterlyGoals";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "talent", label: "Talent" },
  { id: "partners", label: "Partners" },
  { id: "ops", label: "Pod Ops" },
] as const;

type PodTab = (typeof TABS)[number]["id"];
type TalentSection = "roster" | "mentors" | "applicants";
type PartnerSection = "industry" | "academic" | "rolodex";

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

const trackTone = {
  "experience-studio": "info",
  castle: "amber",
  fws: "good",
} as const;

function parseTab(value: string | null): PodTab {
  return TABS.some((tab) => tab.id === value) ? (value as PodTab) : "summary";
}

function sameText(left?: string, right?: string) {
  return Boolean(left?.trim() && right?.trim() && left.trim().toLowerCase() === right.trim().toLowerCase());
}

export default function AdminPodDetail() {
  const { podId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const [talentSection, setTalentSection] = useState<TalentSection>("roster");
  const [partnerSection, setPartnerSection] = useState<PartnerSection>("industry");

  const portfolioQuery = useQuery(podPortfolioQueryOptions());
  const goalsQuery = useQuery(leaderGoalsQueryOptions());
  const usersQuery = useQuery(managedUsersQueryOptions());
  const mentorsQuery = useQuery(mentorsQueryOptions());
  const activationQuery = useQuery(podActivationQueryOptions());
  const studioQuery = useQuery(futureCraftApplicantsQueryOptions());
  const industryQuery = useQuery(industryApplicantsQueryOptions());
  const dashboardQuery = useQuery(dashboardQueryOptions());

  const pod = (portfolioQuery.data || []).find((entry) => entry.id === podId) || null;
  const loading = portfolioQuery.isPending;

  function selectTab(next: PodTab) {
    const nextParams = new URLSearchParams(params);
    if (next === "summary") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  if (loading) {
    return <Card className="p-8 text-center text-sm text-ink-muted">Loading pod…</Card>;
  }

  if (!pod) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display font-bold text-ink">Pod not found</p>
        <Link to="/pods" className="mt-2 inline-block text-sm text-ruby-bright hover:underline">
          Back to portfolio
        </Link>
      </Card>
    );
  }

  const goals = (goalsQuery.data || []).filter((goal) => goal.collegeId === pod.id);
  const roster = (usersQuery.data || []).filter((user) => user.collegeId === pod.id && user.isActive !== false);
  const mentors = (mentorsQuery.data || []).filter((mentor) => mentor.collegeId === pod.id);
  const applicants = buildTrackerApplicants(studioQuery.data || [], industryQuery.data || []).filter((applicant) => (
    sameText(applicant.podName, pod.name)
    || sameText(applicant.podName, pod.collegeName)
    || sameText(applicant.college, pod.collegeName)
    || sameText(applicant.college, pod.name)
  ));
  const progress = activationQuery.data?.progress || [];
  const artifacts = activationQuery.data?.artifacts || [];
  const snapshot = buildActivationSnapshot(pod.id, progress, artifacts);
  const insight = (dashboardQuery.data?.insights || []).find((item) => item.collegeId === pod.id);
  const quarterlySnapshot = buildQuarterlySnapshot({
    ...emptyQuarterlyCounts(),
    observership: applicants.filter((row) => row.track === "experience-studio").length,
    castle: applicants.filter((row) => row.track === "castle").length,
    placements: Math.max(applicants.filter((row) => row.track === "fws").length, insight?.weekly.placements ?? 0),
    industryPartners: insight?.snapshot.activePartners ?? 0,
    outreach: insight?.snapshot.contactsInConversation ?? 0,
    research: (insight?.weekly.researchCreated ?? 0) + (insight?.weekly.researchScored ?? 0),
    academicPartners: pod.clubs.length,
    brandEngagementSpecialists: insight?.snapshot.talentMapped ?? 0,
  });

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Rocket}
        title={pod.name}
        description={`${pod.collegeName}${pod.crew ? ` · ${pod.crew}` : ""}`}
        className="mb-0 shrink-0"
        actions={
          <Link to="/pods" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
        }
      />

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-1" role="tablist" aria-label="Pod sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => selectTab(item.id)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === item.id ? "bg-ruby/15 text-ruby-bright" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === "summary" ? (
          <SummaryTab pod={pod} goals={goals} goalsLoading={goalsQuery.isPending} quarterlySnapshot={quarterlySnapshot} />
        ) : null}
        {tab === "talent" ? (
          <TalentTab
            section={talentSection}
            onSection={setTalentSection}
            roster={roster}
            mentors={mentors}
            applicants={applicants}
            loading={usersQuery.isPending || mentorsQuery.isPending || studioQuery.isPending || industryQuery.isPending}
          />
        ) : null}
        {tab === "partners" ? (
          <PartnersTab
            section={partnerSection}
            onSection={setPartnerSection}
            clubs={pod.clubs}
            industryCount={insight?.snapshot.activePartners ?? 0}
            rolodexCount={insight?.snapshot.contactsInConversation ?? 0}
          />
        ) : null}
        {tab === "ops" ? (
          <OpsTab
            podId={pod.id}
            podName={pod.name}
            goals={goals}
            roster={roster}
            snapshot={snapshot}
            goalsLoading={goalsQuery.isPending}
            activationLoading={activationQuery.isPending}
          />
        ) : null}
      </div>
    </div>
  );
}

function sortSprintGoals(goals: PodLeaderGoal[]) {
  return [...goals].sort((left, right) => {
    if (left.status !== right.status) return left.status === "in_review" ? -1 : right.status === "in_review" ? 1 : left.status === "active" ? -1 : 1;
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return leftDue - rightDue || left.title.localeCompare(right.title);
  });
}

function SummaryTab({
  pod,
  goals,
  goalsLoading,
  quarterlySnapshot,
}: {
  pod: PodPortfolioEntry;
  goals: PodLeaderGoal[];
  goalsLoading: boolean;
  quarterlySnapshot: ReturnType<typeof buildQuarterlySnapshot>;
}) {
  const sprintGoals = sortSprintGoals(goals);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
        <span className="text-sm text-ink-muted">{pod.activationPercent}% activated</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active users" value={pod.memberCount} />
        <Stat label="Open challenges" value={pod.openChallenges} />
        <Stat label="Critical" value={pod.criticalChallenges} />
        <Stat label="Clubs" value={pod.clubs.length} />
      </div>

      <PodQuarterlyGoalsCard snapshot={quarterlySnapshot} />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Sprint Goals</h2>
            <p className="mt-1 text-sm text-ink-muted">Leader commitments for this pod&apos;s current sprint.</p>
          </div>
          <Link
            to={`/pods/${pod.id}?tab=ops`}
            className="focus-ring inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-xs font-semibold text-ink hover:bg-surface-3"
          >
            <Plus className="h-3.5 w-3.5" />
            Assign goal
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {goalsLoading ? <p className="text-sm text-ink-muted">Loading sprint goals…</p> : null}
          {sprintGoals.map((goal) => (
            <div key={goal.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{goal.title}</p>
                <Badge tone={goal.status === "done" ? "good" : goal.status === "in_review" ? "info" : "amber"}>{goal.status === "done" ? "Done" : goal.status === "in_review" ? "In review" : "Active"}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {goal.assigneeName || "Unassigned"} · {formatPodRole(goal.assignedPodRole)}
              </p>
              {goal.description ? <p className="mt-1 text-xs text-ink-muted">{goal.description}</p> : null}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                <CalendarClock className="h-3.5 w-3.5" />
                {goal.dueDate ? `Due ${formatDate(goal.dueDate)}` : "No due date"}
              </p>
            </div>
          ))}
          {!goalsLoading && !sprintGoals.length ? (
            <div className="rounded-xl border border-dashed border-line bg-surface-2 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-ink">No sprint goals yet</p>
              <p className="mt-1 text-sm text-ink-muted">Assign a goal in Pod Ops so leaders know what to focus on this sprint.</p>
              <Link
                to={`/pods/${pod.id}?tab=ops`}
                className="focus-ring btn-primary mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg shadow-ruby/20"
              >
                <Plus className="h-4 w-4" />
                Assign sprint goal
              </Link>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users2 className="h-4 w-4 text-ruby-bright" />
          <h2 className="font-display text-lg font-bold text-ink">Current leadership</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {leadershipRows(pod).map((row) => (
            <div key={row.role} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-xs text-ink-faint">{row.role}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{row.name || "Unassigned"}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TalentTab({
  section,
  onSection,
  roster,
  mentors,
  applicants,
  loading,
}: {
  section: TalentSection;
  onSection: (section: TalentSection) => void;
  roster: AllowedUser[];
  mentors: PodMentor[];
  applicants: TrackerApplicant[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <SectionSwitch
        value={section}
        onChange={onSection}
        options={[
          { id: "roster", label: `Roster (${roster.length})` },
          { id: "mentors", label: `Mentors (${mentors.length})` },
          { id: "applicants", label: `Applicants (${applicants.length})` },
        ]}
      />
      {loading ? <Card className="p-6 text-sm text-ink-muted">Loading talent…</Card> : null}
      {!loading && section === "roster" ? (
        roster.length ? (
          <div className="space-y-2">
            {roster.map((user) => (
              <Card key={user.id || user.username} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{user.name || user.username || "Unnamed account"}</p>
                  <Badge tone="ruby">{formatPodRole(user.podRole)}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{user.username || user.phoneNumber || "No contact on file"}</p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyCopy title="No roster yet" body="Active accounts linked to this pod will show up here." />
        )
      ) : null}
      {!loading && section === "mentors" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to="/mentors" className="text-sm font-semibold text-ruby-bright hover:underline">Manage mentors</Link>
          </div>
          {mentors.length ? mentors.map((mentor) => (
            <Card key={mentor.id} className="p-4">
              <p className="font-semibold text-ink">{mentor.name}</p>
              <div className="mt-2">
                <ExpertiseTags tags={mentor.expertise} />
              </div>
            </Card>
          )) : (
            <EmptyCopy title="No mentors assigned" body="Mentors added for this pod will show up here." />
          )}
        </div>
      ) : null}
      {!loading && section === "applicants" ? (
        applicants.length ? (
          <div className="space-y-2">
            {applicants.map((applicant) => {
              const meta = applicantTrackMeta(applicant.track);
              return (
                <Card key={applicant.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{applicant.name}</p>
                    <Badge tone={trackTone[applicant.track]}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{applicant.detail}</p>
                  <p className="mt-1 text-xs text-ink-faint">{applicant.appliedAt ? formatDate(applicant.appliedAt) : meta.detail}</p>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyCopy title="No applicants for this pod" body="Experience Studio and FWS applications matched to this college will show up here. Castle applications are not coming in yet." />
        )
      ) : null}
    </div>
  );
}

function PartnersTab({
  section,
  onSection,
  clubs,
  industryCount,
  rolodexCount,
}: {
  section: PartnerSection;
  onSection: (section: PartnerSection) => void;
  clubs: PodClub[];
  industryCount: number;
  rolodexCount: number;
}) {
  return (
    <div className="space-y-4">
      <SectionSwitch
        value={section}
        onChange={onSection}
        options={[
          { id: "industry", label: "Industry" },
          { id: "academic", label: "Academic" },
          { id: "rolodex", label: "Current Rolodex" },
        ]}
      />
      {section === "industry" ? (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-ruby-bright" />
            <h2 className="font-display font-bold text-ink">Industry partners</h2>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">{industryCount}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {industryCount
              ? "Active industry partners counted for this pod. Named partner records are not stored on this workspace yet."
              : "No industry partners are counted for this pod yet."}
          </p>
        </Card>
      ) : null}
      {section === "academic" ? (
        clubs.length ? (
          <div className="space-y-2">
            {clubs.map((club) => (
              <Card key={club.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-bright" />
                    <p className="font-semibold text-ink">{club.name}</p>
                  </div>
                  <Badge tone={clubStageTone(club.stage)}>{club.stage}</Badge>
                </div>
                {club.contribution ? <p className="mt-2 text-sm text-ink-muted">{club.contribution}</p> : null}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyCopy title="No academic partners" body="Clubs linked to this pod will show up here." />
        )
      ) : null}
      {section === "rolodex" ? (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-ruby-bright" />
            <h2 className="font-display font-bold text-ink">Current rolodex</h2>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">{rolodexCount}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {rolodexCount
              ? "Contacts currently in conversation. Individual rolodex entries are not stored on this workspace yet."
              : "No contacts are in conversation for this pod yet."}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function OpsTab({
  podId,
  podName,
  goals,
  roster,
  snapshot,
  goalsLoading,
  activationLoading,
}: {
  podId: string;
  podName: string;
  goals: PodLeaderGoal[];
  roster: AllowedUser[];
  snapshot: ReturnType<typeof buildActivationSnapshot>;
  goalsLoading: boolean;
  activationLoading: boolean;
}) {
  const firstOpen = snapshot.byCategory.find((category) => category.complete < category.total)?.categoryId ?? null;
  const [openCategory, setOpenCategory] = useState<string | null>(firstOpen);

  useEffect(() => {
    setOpenCategory(firstOpen);
  }, [podId, firstOpen]);

  return (
    <div className="space-y-4">
      <PodLeaderGoalsPanel podId={podId} podName={podName} goals={goals} roster={roster} loading={goalsLoading} />

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Activation status</h2>
            <p className="mt-1 text-sm text-ink-muted">{snapshot.complete} of {snapshot.total} steps complete</p>
          </div>
          <span className="font-display text-2xl font-black text-gradient">{snapshot.percent}%</span>
        </div>
        <ProgressBar value={snapshot.percent} tone={snapshot.percent >= 100 ? "good" : "ruby"} />
        {activationLoading ? <p className="mt-3 text-sm text-ink-muted">Loading activation…</p> : null}
        <div className="mt-4 space-y-2">
          {snapshot.byCategory.map((category) => {
            const open = openCategory === category.categoryId;
            const items = snapshot.items.filter((item) => item.categoryId === category.categoryId);
            const percent = category.total ? Math.round((category.complete / category.total) * 100) : 0;
            return (
              <div key={category.categoryId} className="overflow-hidden rounded-xl border border-line">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  aria-expanded={open}
                  onClick={() => setOpenCategory(open ? null : category.categoryId)}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{category.title}</p>
                    <p className="text-xs text-ink-muted">{category.complete}/{category.total} complete</p>
                  </div>
                  <span className="text-sm font-bold text-ink">{percent}%</span>
                </button>
                {open ? (
                  <div className="divide-y divide-line border-t border-line">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 px-3 py-3">
                        <span className="mt-0.5 text-ink-faint">
                          {item.status === "locked" ? <Lock className="h-4 w-4" /> : item.status === "complete" ? <CheckCircle2 className="h-4 w-4 text-good" /> : item.type === "learn" ? <BookOpen className="h-4 w-4 text-info" /> : <Package className="h-4 w-4 text-amber-bright" />}
                        </span>
                        <div>
                          <p className="text-sm text-ink">{item.title}</p>
                          <p className="text-xs text-ink-muted">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SectionSwitch<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          size="sm"
          variant={value === option.id ? "primary" : "secondary"}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-ink">{value}</p>
    </Card>
  );
}

function EmptyCopy({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6 text-center">
      <p className="font-display font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </Card>
  );
}
