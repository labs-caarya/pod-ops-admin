import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  Flag,
  GraduationCap,
  Handshake,
  Megaphone,
  Rocket,
  Users,
} from "lucide-react";
import {
  dashboardQueryOptions,
  futureCraftApplicantsQueryOptions,
  industryApplicantsQueryOptions,
  networkPartnersQueryOptions,
  podPortfolioQueryOptions,
} from "@/lib/adminQueries";
import { buildTrackerApplicants } from "@/lib/applicantTracks";
import {
  buildQuarterlySnapshot,
  currentQuarterMeta,
  emptyQuarterlyCounts,
  QUARTERLY_SECTIONS,
  type QuarterlyCounts,
  type QuarterlyGoalSectionId,
} from "@/lib/quarterlyGoals";
import type { PodInsight, PodPortfolioEntry, Profile } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "progress", label: "Progress by pods" },
  { id: "targets", label: "Targets" },
] as const;

type GoalsTab = (typeof TABS)[number]["id"];

const SECTION_ICONS: Record<QuarterlyGoalSectionId, typeof Flag> = {
  talent: GraduationCap,
  industry: Briefcase,
  marketing: Megaphone,
  distribution: Handshake,
  "campus-companies": Building2,
  community: CalendarDays,
};

function progressTone(percent: number): "ruby" | "amber" | "good" {
  if (percent >= 70) return "good";
  if (percent >= 35) return "amber";
  return "ruby";
}

function parseTab(value: string | null): GoalsTab {
  return TABS.some((tab) => tab.id === value) ? (value as GoalsTab) : "progress";
}

function sameText(left?: string, right?: string) {
  return Boolean(left?.trim() && right?.trim() && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function looksFor(profile: Profile, optionId: string) {
  return (profile.lookingFor ?? []).includes(optionId);
}

function countsForPod(
  pod: PodPortfolioEntry,
  insight: PodInsight | undefined,
  studio: number,
  castle: number,
  fws: number,
  nano: number,
  campusCompanies: number,
): QuarterlyCounts {
  return {
    ...emptyQuarterlyCounts(),
    observership: studio,
    castle,
    placements: Math.max(fws, insight?.weekly.placements ?? 0),
    industryPartners: insight?.snapshot.activePartners ?? 0,
    outreach: insight?.snapshot.contactsInConversation ?? 0,
    research: (insight?.weekly.researchCreated ?? 0) + (insight?.weekly.researchScored ?? 0),
    academicPartners: pod.clubs.length,
    brandEngagementSpecialists: insight?.snapshot.talentMapped ?? 0,
    nanoInfluencers: nano,
    campusCompanies,
  };
}

export default function AdminQuarterlyGoals() {
  const quarter = currentQuarterMeta();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const portfolioQuery = useQuery(podPortfolioQueryOptions());
  const dashboardQuery = useQuery(dashboardQueryOptions());
  const studioQuery = useQuery(futureCraftApplicantsQueryOptions());
  const industryQuery = useQuery(industryApplicantsQueryOptions());
  const partnersQuery = useQuery(networkPartnersQueryOptions());

  const applicants = useMemo(
    () => buildTrackerApplicants(studioQuery.data || [], industryQuery.data || []),
    [industryQuery.data, studioQuery.data],
  );

  const rows = useMemo(() => {
    const pods = portfolioQuery.data ?? [];
    const insights = dashboardQuery.data?.insights ?? [];
    return pods.map((pod) => {
      const insight = insights.find((item) => item.collegeId === pod.id);
      const podApplicants = applicants.filter((applicant) => (
        sameText(applicant.podName, pod.name)
        || sameText(applicant.podName, pod.collegeName)
        || sameText(applicant.college, pod.collegeName)
        || sameText(applicant.college, pod.name)
      ));
      const industry = (industryQuery.data ?? []).filter((profile) => (
        sameText(profile.personal?.collegeName, pod.collegeName) || sameText(profile.personal?.collegeName, pod.name)
      ));
      const snapshot = buildQuarterlySnapshot(countsForPod(
        pod,
        insight,
        podApplicants.filter((row) => row.track === "experience-studio").length,
        podApplicants.filter((row) => row.track === "castle").length + industry.filter((profile) => looksFor(profile, "first-experience")).length,
        podApplicants.filter((row) => row.track === "fws").length,
        industry.filter((profile) => profile.nanoInfluencer?.interested === true).length,
        (partnersQuery.data ?? []).filter((partner) => partner.podId === pod.id && /campus|startup|student/i.test(`${partner.category} ${partner.spaType}`)).length,
      ));
      return { pod, snapshot };
    }).sort((left, right) => left.snapshot.percent - right.snapshot.percent);
  }, [applicants, dashboardQuery.data?.insights, industryQuery.data, partnersQuery.data, portfolioQuery.data]);

  function selectTab(next: GoalsTab) {
    const nextParams = new URLSearchParams(params);
    if (next === "progress") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  const loading = portfolioQuery.isPending || dashboardQuery.isPending || studioQuery.isPending || industryQuery.isPending;

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Flag}
        title="Quarterly Goals"
        description="Goals that we recommend for every pod to get financial stability."
        className="mb-0 shrink-0"
      />

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-1" role="tablist" aria-label="Quarterly goals views">
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
        {tab === "progress" ? (
          <div className="space-y-4 pb-6">
            <p className="text-sm text-ink-muted">
              {quarter.label} · {quarter.rangeLabel} · live snapshot from applicants, partners, talent mapped, and Rolodex conversation.
            </p>
            {loading ? (
              <Card className="p-6 text-sm text-ink-muted">Loading pod progress…</Card>
            ) : rows.length ? (
              <div className="space-y-3">
                {rows.map(({ pod, snapshot }) => (
                  <Link
                    key={pod.id}
                    to={`/pods/${pod.id}`}
                    className="focus-ring block rounded-xl border border-line bg-surface-2 p-4 hover:border-line-strong"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{pod.name}</p>
                        <p className="text-xs text-ink-muted">{pod.collegeName} · {snapshot.complete}/{snapshot.total} targets</p>
                      </div>
                      <span className="font-display text-lg font-black tabular-nums text-ink">{snapshot.percent}%</span>
                    </div>
                    <ProgressBar className="mt-2" value={snapshot.percent} tone={progressTone(snapshot.percent)} />
                    <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                      {snapshot.sections.map((section) => {
                        const def = QUARTERLY_SECTIONS.find((item) => item.id === section.id);
                        if (!def) return null;
                        return (
                          <div key={section.id} className="rounded-lg border border-line bg-surface px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-ink">{def.title}</p>
                              <span className="text-xs font-bold tabular-nums text-ink-muted">{section.percent}%</span>
                            </div>
                            <ProgressBar className="mt-1.5 h-1.5" value={section.percent} tone={progressTone(section.percent)} />
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-sm text-ink-muted">No pods are registered yet.</Card>
            )}
          </div>
        ) : (
          <div className="space-y-8 pb-6">
            <p className="text-sm text-ink-muted">
              {quarter.label} · {quarter.rangeLabel} · {quarter.playbookWeeks} weeks in the playbook. These are the generic targets any pod should hit.
            </p>
            {QUARTERLY_SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.id];
              return (
                <MobileCollapsedSection
                  key={section.id}
                  id={section.id}
                  header={
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ruby/25 bg-ruby/10 text-ruby-bright">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-black tracking-tight text-ink sm:text-xl">{section.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{section.summary}</p>
                      </div>
                    </div>
                  }
                >
                  <div className="grid gap-4">
                    {section.goals.map((goal) => (
                      <Card key={goal.id} id={goal.id} className="scroll-mt-24 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-bold text-ink">{goal.title}</h3>
                            {goal.cadence ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ruby-bright">{goal.cadence}</p> : null}
                            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{goal.description}</p>
                          </div>
                          <Badge tone="ruby">{goal.target} {goal.unit}</Badge>
                        </div>
                        {goal.helpsPod || goal.helpsStudents ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {goal.helpsPod ? (
                              <div className="rounded-xl border border-line bg-surface-2 p-3">
                                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
                                  <Rocket className="h-3.5 w-3.5 text-ruby-bright" /> How this helps the pod
                                </p>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink">{goal.helpsPod}</p>
                              </div>
                            ) : null}
                            {goal.helpsStudents ? (
                              <div className="rounded-xl border border-line bg-surface-2 p-3">
                                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
                                  <Users className="h-3.5 w-3.5 text-ruby-bright" /> How this helps the students
                                </p>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink">{goal.helpsStudents}</p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link to={goal.href} className={cn("focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ruby/40")}>
                            {goal.trackHint}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                          {goal.knowledgeHref ? (
                            <Link to={goal.knowledgeHref} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ruby/30 bg-ruby/10 px-3 py-1.5 text-xs font-semibold text-ruby-bright hover:bg-ruby/15">
                              <BookOpen className="h-3.5 w-3.5" />
                              Knowledge Space
                            </Link>
                          ) : null}
                        </div>
                      </Card>
                    ))}
                  </div>
                </MobileCollapsedSection>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileCollapsedSection({
  id,
  header,
  children,
}: {
  id: string;
  header: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line p-3 sm:border-0 sm:p-0">
      <button
        type="button"
        className="focus-ring flex w-full items-start gap-2 rounded-xl text-left sm:pointer-events-none sm:cursor-default"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">{header}</span>
        <ChevronDown className={cn("mt-2 h-5 w-5 shrink-0 text-ink-muted transition-transform sm:hidden", open && "rotate-180")} />
      </button>
      <div className={cn("mt-3", open ? "block" : "hidden", "sm:block")}>{children}</div>
    </section>
  );
}
