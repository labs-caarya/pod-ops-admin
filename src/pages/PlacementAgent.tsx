import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  UserCheck,
  Building2,
  Microscope,
  Send,
  Sparkles,
  ChevronRight,
  Users2,
  CheckCircle2,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Avatar, EmptyState } from "@/components/ui/Misc";
import { TalentPickList } from "@/components/placement/TalentPickList";
import { useCollection } from "@/lib/store";
import {
  jobStore,
  partnerStore,
  placementOfferStore,
  talentStore,
} from "@/lib/data/collections";
import {
  getPartnerRoster,
  normalizeJob,
  opportunitySourceLabel,
  placementModeCopy,
  recommendCandidates,
  scoreCandidate,
  searchTalentRoster,
} from "@/lib/data/placement";
import { normalizeTalent } from "@/lib/data/services";
import {
  JOB_STATUS_TONE,
  OPPORTUNITY_SOURCE_TONE,
  PLACEMENT_OFFER_TONE,
} from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { JobOpportunity, OpportunitySource } from "@/lib/types";
import { cn } from "@/lib/utils";

type SourceTab = "all" | OpportunitySource;

const SOURCE_TABS: { key: SourceTab; label: string; icon: LucideIcon }[] = [
  { key: "all", label: "All open", icon: Users2 },
  { key: "partner", label: "Partner", icon: Building2 },
  { key: "researched", label: "Researched", icon: Microscope },
];

export default function PlacementAgent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobs = useCollection(jobStore);
  const talent = useCollection(talentStore);
  const partners = useCollection(partnerStore);
  const offers = useCollection(placementOfferStore);

  const normalizedJobs = useMemo(
    () => jobs.map(normalizeJob).filter((j) => j.status !== "Closed"),
    [jobs],
  );

  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [selectedTalentIds, setSelectedTalentIds] = useState<Set<string>>(new Set());
  const [talentSearch, setTalentSearch] = useState("");
  const [talentStatusFilter, setTalentStatusFilter] = useState("all");
  const [justSent, setJustSent] = useState(false);

  const filteredJobs = useMemo(() => {
    if (sourceTab === "all") return normalizedJobs;
    return normalizedJobs.filter((j) => j.source === sourceTab);
  }, [normalizedJobs, sourceTab]);

  const activeJobId = useMemo(() => {
    const param = searchParams.get("job");
    if (param && filteredJobs.some((j) => j.id === param)) return param;
    return filteredJobs[0]?.id ?? null;
  }, [searchParams, filteredJobs]);

  useEffect(() => {
    if (!filteredJobs.length) return;
    const param = searchParams.get("job");
    if (!param || !filteredJobs.some((j) => j.id === param)) {
      setSearchParams({ job: filteredJobs[0].id }, { replace: true });
    }
  }, [filteredJobs, searchParams, setSearchParams]);

  const selectedJob = useMemo(
    () => filteredJobs.find((j) => j.id === activeJobId) ?? null,
    [filteredJobs, activeJobId],
  );

  const partnerName = useMemo(() => {
    if (!selectedJob?.partnerId) return null;
    return partners.find((p) => p.id === selectedJob.partnerId)?.name ?? selectedJob.company;
  }, [selectedJob, partners]);

  const jobOffers = useMemo(
    () => (selectedJob ? offers.filter((o) => o.jobId === selectedJob.id) : []),
    [offers, selectedJob],
  );

  const offeredTalentIds = useMemo(
    () => new Set(jobOffers.map((o) => o.talentId)),
    [jobOffers],
  );

  const recommendations = useMemo(() => {
    if (!selectedJob) return [];
    try {
      return recommendCandidates(selectedJob, talent);
    } catch {
      return [];
    }
  }, [selectedJob, talent]);

  const partnerRoster = useMemo(() => {
    if (!selectedJob) return [];
    try {
      return getPartnerRoster(selectedJob, talent, jobs, offers);
    } catch {
      return [];
    }
  }, [selectedJob, talent, jobs, offers]);

  const recommendationIds = useMemo(
    () => new Set(recommendations.map((r) => r.talent.id)),
    [recommendations],
  );

  const partnerRosterIds = useMemo(
    () => new Set(partnerRoster.map((r) => r.talent.id)),
    [partnerRoster],
  );

  const rosterMatches = useMemo(() => {
    if (!selectedJob) return [];
    try {
      return searchTalentRoster(selectedJob, talent, talentSearch, talentStatusFilter).filter(
        (m) => !recommendationIds.has(m.talent.id) && !partnerRosterIds.has(m.talent.id),
      );
    } catch {
      return [];
    }
  }, [selectedJob, talent, talentSearch, talentStatusFilter, recommendationIds, partnerRosterIds]);

  const copy = selectedJob ? placementModeCopy(selectedJob.source) : null;

  const selectJob = (job: JobOpportunity) => {
    setSelectedTalentIds(new Set());
    setTalentSearch("");
    setTalentStatusFilter("all");
    setJustSent(false);
    setSearchParams({ job: job.id });
  };

  const toggleTalent = (talentId: string) => {
    if (offeredTalentIds.has(talentId)) return;
    setSelectedTalentIds((prev) => {
      const next = new Set(prev);
      if (next.has(talentId)) next.delete(talentId);
      else next.add(talentId);
      return next;
    });
  };

  const sendOffers = () => {
    if (!selectedJob || selectedTalentIds.size === 0) return;

    const now = new Date().toISOString();
    let sent = 0;

    for (const talentId of selectedTalentIds) {
      if (offeredTalentIds.has(talentId)) continue;
      const raw = talent.find((t) => t.id === talentId);
      if (!raw) continue;
      const match = scoreCandidate(selectedJob, raw);

      placementOfferStore.upsert({
        id: makeId("offer"),
        jobId: selectedJob.id,
        talentId,
        status: "Sent",
        matchScore: match.score,
        matchReason: match.reasons.join(" · ") || "Added from roster",
        sentAt: now,
      });
      sent += 1;
    }

    if (sent > 0) {
      jobStore.upsert({
        id: selectedJob.id,
        applicants: selectedJob.applicants + sent,
      });
      setSelectedTalentIds(new Set());
      setJustSent(true);
    }
  };

  const pickListProps = {
    selectedIds: selectedTalentIds,
    offeredIds: offeredTalentIds,
    onToggle: toggleTalent,
  };

  return (
    <div>
      <PageHeader
        icon={UserCheck}
        title="Placement Agent"
        description="Review recommendations, pull from partner rosters, or search your full talent pool to send offers."
        actions={
          <Link to="/opportunities">
            <Button variant="secondary">Opportunity Canvas</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCE_TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSourceTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                sourceTab === tab.key
                  ? "border-ruby/40 bg-ruby/15 text-ruby-bright"
                  : "border-line bg-surface-2 text-ink-muted hover:border-line-strong",
              )}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No open opportunities"
          description="Create partner or researched opportunities first, then return here to place talent."
          action={
            <Link to="/opportunities">
              <Button>Go to Opportunity Canvas</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,340px)_1fr]">
          <Card className="p-3">
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-ink-faint">
              Select opportunity
            </p>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {filteredJobs.map((job) => {
                const active = activeJobId === job.id;
                const offerCount = offers.filter((o) => o.jobId === job.id && o.status === "Sent").length;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => selectJob(job)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-ruby/40 bg-ruby/10"
                        : "border-line bg-surface-2 hover:border-line-strong hover:bg-surface-3",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display font-bold text-ink">{job.title}</p>
                        <p className="truncate text-xs text-ink-muted">{job.company}</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0", active ? "text-ruby-bright" : "text-ink-faint")} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={OPPORTUNITY_SOURCE_TONE[job.source] ?? "muted"} className="text-[10px]">
                        {opportunitySourceLabel(job.source)}
                      </Badge>
                      <Badge tone={JOB_STATUS_TONE[job.status] ?? "muted"} className="text-[10px]">
                        {job.status}
                      </Badge>
                      {offerCount > 0 && (
                        <Badge tone="amber" className="text-[10px]">{offerCount} sent</Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedJob && copy ? (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge tone={OPPORTUNITY_SOURCE_TONE[selectedJob.source] ?? "muted"}>
                      {opportunitySourceLabel(selectedJob.source)}
                    </Badge>
                    <h2 className="mt-2 font-display text-xl font-bold text-ink">{selectedJob.title}</h2>
                    <p className="text-sm text-ink-muted">{selectedJob.company} · {selectedJob.seats} seats</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-2 px-4 py-2 text-right">
                    <p className="text-xs text-ink-faint">{copy.headline}</p>
                    <p className="font-display text-lg font-bold text-ruby-bright">{jobOffers.length} offers</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-muted">{selectedJob.description}</p>
              </Card>

              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ruby/30 bg-surface/95 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm text-ink-muted">
                  {selectedTalentIds.size} selected from recommendations, partner roster, or search
                </p>
                <Button onClick={sendOffers} disabled={selectedTalentIds.size === 0}>
                  <Send className="h-4 w-4" />
                  {copy.action}
                  {selectedTalentIds.size > 0 && ` (${selectedTalentIds.size})`}
                </Button>
              </div>

              {justSent && (
                <div className="flex items-center gap-2 rounded-xl border border-good/30 bg-good/10 px-4 py-3 text-sm text-good">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {copy.sentLabel} — candidates will see the opportunity in their pod feed.
                </div>
              )}

              {jobOffers.length > 0 && (
                <Card className="p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-faint">
                    Offers sent
                  </p>
                  <div className="space-y-2">
                    {jobOffers.map((offer) => {
                      const raw = talent.find((t) => t.id === offer.talentId);
                      if (!raw) return null;
                      const member = normalizeTalent(raw);
                      return (
                        <div key={offer.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={member.name} color={member.avatarColor} className="h-8 w-8 text-xs" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                              <p className="truncate text-xs text-ink-faint">{offer.matchScore}% match</p>
                            </div>
                          </div>
                          <Badge tone={PLACEMENT_OFFER_TONE[offer.status] ?? "muted"}>{offer.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ruby-bright" />
                  <p className="font-display font-bold text-ink">Recommended candidates</p>
                </div>
                <TalentPickList
                  {...pickListProps}
                  matches={recommendations}
                  emptyMessage="No strong automatic matches — search your roster below or check the partner pool."
                />
              </Card>

              {selectedJob.source === "partner" && (
                <Card className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-good" />
                    <div>
                      <p className="font-display font-bold text-ink">Partner roster</p>
                      <p className="text-xs text-ink-muted">
                        Talent affiliated with {partnerName ?? selectedJob.company}, prior placements, or past offers on this partner&apos;s opportunities
                      </p>
                    </div>
                  </div>
                  <TalentPickList
                    {...pickListProps}
                    matches={partnerRoster}
                    highlightIds={partnerRosterIds}
                    emptyMessage="No one in the partner roster yet — search your full pod talent below."
                  />
                </Card>
              )}

              <Card className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-ink-muted" />
                  <div>
                    <p className="font-display font-bold text-ink">Search full roster</p>
                    <p className="text-xs text-ink-muted">Browse and add anyone from your talent map — not limited to recommendations</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <Input
                      placeholder="Search by name, skill, role, college…"
                      value={talentSearch}
                      onChange={(e) => setTalentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={talentStatusFilter}
                    onChange={(e) => setTalentStatusFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="all">All statuses</option>
                    <option value="Available">Available</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Bench">Bench</option>
                    <option value="Placed">Placed</option>
                  </Select>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  <TalentPickList
                    {...pickListProps}
                    matches={rosterMatches}
                    emptyMessage={
                      talentSearch
                        ? "No talent matches your search."
                        : "Showing your full roster — type to narrow results."
                    }
                  />
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex min-h-[280px] items-center justify-center p-8">
              <p className="text-sm text-ink-muted">Select an opportunity to see recommendations.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
