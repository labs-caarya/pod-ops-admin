import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Vault,
  Search,
  Info,
  GitBranch,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Table2,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { actionProgress, rcaProgress, vaultStats } from "@/lib/data/challenges";
import { challengesQueryOptions, collegesQueryOptions } from "@/lib/adminQueries";
import {
  CHALLENGE_SEVERITY_TONE,
  CHALLENGE_STATUSES,
  CHALLENGE_STATUS_TONE,
} from "@/lib/constants";
import type { Challenge, ChallengeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ChallengeStatus;
type ViewMode = "cards" | "table";
type VaultStats = ReturnType<typeof vaultStats>;

const CHALLENGE_GUIDE_STEPS = [
  { step: "1", label: "Map", desc: "Capture symptoms, impact, and severity", tone: "text-ruby-bright" },
  { step: "2", label: "RCA", desc: "5 Whys to find the real root cause", tone: "text-amber-bright" },
  { step: "3", label: "Solve", desc: "Owned actions until the challenge closes", tone: "text-good" },
];

function collegeLabel(challenge: Challenge) {
  return challenge.collegeName || challenge.collegeId || "All colleges";
}

function CollegeName({ challenge }: { challenge: Challenge }) {
  const label = collegeLabel(challenge);
  const [primary, ...rest] = label.split(",").map((part) => part.trim()).filter(Boolean);
  return (
    <div className="max-w-[220px] leading-snug">
      <p className="line-clamp-1 text-sm font-medium text-ink">{primary || label}</p>
      {rest.length > 0 && (
        <p className="line-clamp-1 text-xs text-ink-muted">{rest.join(", ")}</p>
      )}
    </div>
  );
}

function ChallengeCards({ items }: { items: Challenge[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {items.map((c) => {
        const rca = rcaProgress(c);
        const actions = actionProgress(c);
        return (
          <Link key={c.id} to={`/challenges/${c.id}`} className="block">
            <Card hover className="flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-ink">{c.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{c.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <CollegeName challenge={c} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={CHALLENGE_STATUS_TONE[c.status] ?? "muted"}>{c.status}</Badge>
                <Badge tone={CHALLENGE_SEVERITY_TONE[c.severity] ?? "muted"}>{c.severity}</Badge>
                <Badge tone="muted">{c.pillar}</Badge>
                {c.owner && <Badge tone="muted">{c.owner}</Badge>}
              </div>

              {c.symptoms.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-ink-muted">
                  {c.symptoms.slice(0, 2).map((s) => (
                    <li key={s} className="flex gap-1.5">
                      <span className="text-ink-faint">·</span>
                      <span className="line-clamp-1">{s}</span>
                    </li>
                  ))}
                  {c.symptoms.length > 2 && (
                    <li className="text-ink-faint">+{c.symptoms.length - 2} more symptoms</li>
                  )}
                </ul>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                    <GitBranch className="h-3 w-3" /> RCA {rca}%
                  </p>
                  <ProgressBar value={rca} tone={rca >= 80 ? "good" : rca >= 40 ? "amber" : "ruby"} />
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                    <ListChecks className="h-3 w-3" /> Actions {actions}%
                  </p>
                  <ProgressBar value={actions} tone={actions >= 100 ? "good" : "amber"} />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function MiniProgress({ value, tone }: { value: number; tone: "ruby" | "amber" | "good" }) {
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <ProgressBar value={value} tone={tone} className="flex-1" />
      <span className="w-8 text-right text-xs tabular-nums text-ink-muted">{value}%</span>
    </div>
  );
}

function MobileVaultStats({ stats }: { stats: VaultStats }) {
  const items = [
    { label: "Open", value: stats.open, tone: "text-amber-bright" },
    { label: "RCA", value: stats.investigating, tone: "text-blue-300" },
    { label: "Actions", value: stats.actionPlan, tone: "text-ruby-bright" },
    { label: "Resolved", value: stats.resolved, tone: "text-good" },
    { label: "High", value: stats.critical, tone: "text-bad" },
  ];

  return (
    <div className="-mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
      {items.map((item) => (
        <div key={item.label} className="min-w-[76px] rounded-lg border border-line bg-surface/80 px-3 py-2">
          <p className={cn("font-display text-lg font-black leading-none", item.tone)}>{item.value}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function MobileVaultGuideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="How the vault works" width="max-w-md">
      <div className="grid gap-3">
        {CHALLENGE_GUIDE_STEPS.map((step) => (
          <div key={step.step} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={cn("font-display text-lg font-black", step.tone)}>{step.step}</span>
              <p className="font-semibold text-ink">{step.label}</p>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function MobileChallengeCards({ items }: { items: Challenge[] }) {
  return (
    <div className="grid gap-3">
      {items.map((challenge) => {
        const rca = rcaProgress(challenge);
        const actions = actionProgress(challenge);
        const owner = challenge.owner || "Unassigned";
        return (
          <Link key={challenge.id} to={`/challenges/${challenge.id}`} className="block">
            <Card hover className="p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-ink">{challenge.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{collegeLabel(challenge)}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={CHALLENGE_SEVERITY_TONE[challenge.severity] ?? "muted"}>{challenge.severity}</Badge>
                <Badge tone={CHALLENGE_STATUS_TONE[challenge.status] ?? "muted"}>{challenge.status}</Badge>
                <Badge tone="muted">{challenge.pillar}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-y border-line py-2 text-xs">
                <div>
                  <p className="text-ink-faint">Owner</p>
                  <p className="mt-0.5 truncate font-medium text-ink-muted">{owner}</p>
                </div>
                <div>
                  <p className="text-ink-faint">Symptoms</p>
                  <p className="mt-0.5 font-medium text-ink-muted">{challenge.symptoms.length}</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    <span>RCA</span>
                    <span>{rca}%</span>
                  </div>
                  <ProgressBar value={rca} tone={rca >= 80 ? "good" : rca >= 40 ? "amber" : "ruby"} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    <span>Actions</span>
                    <span>{actions}%</span>
                  </div>
                  <ProgressBar value={actions} tone={actions >= 100 ? "good" : "amber"} />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
function ChallengeTable({ items }: { items: Challenge[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-xs font-bold uppercase tracking-widest text-ink-faint">
              <th className="px-4 py-3 font-bold">Challenge</th>
              <th className="px-4 py-3 font-bold">College</th>
              <th className="px-4 py-3 font-bold">Pillar</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Severity</th>
              <th className="px-4 py-3 font-bold">Owner</th>
              <th className="px-4 py-3 font-bold">RCA</th>
              <th className="px-4 py-3 font-bold">Actions</th>
              <th className="px-4 py-3 font-bold">Symptoms</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const rca = rcaProgress(c);
              const actions = actionProgress(c);
              const actionsDone = c.actions.filter((a) => a.done).length;
              return (
                <tr
                  key={c.id}
                  className="border-b border-line last:border-0 transition-colors hover:bg-surface-2/80"
                >
                  <td className="px-4 py-3">
                    <Link to={`/challenges/${c.id}`} className="group block min-w-[200px]">
                      <p className="font-semibold text-ink group-hover:text-ruby-bright">{c.title}</p>
                      {c.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{c.description}</p>
                      )}
                      {c.rootCause && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-ink-faint">
                          Root: {c.rootCause}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CollegeName challenge={c} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="muted">{c.pillar}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={CHALLENGE_STATUS_TONE[c.status] ?? "muted"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={CHALLENGE_SEVERITY_TONE[c.severity] ?? "muted"}>{c.severity}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{c.owner || "—"}</td>
                  <td className="px-4 py-3">
                    <MiniProgress value={rca} tone={rca >= 80 ? "good" : rca >= 40 ? "amber" : "ruby"} />
                  </td>
                  <td className="px-4 py-3">
                    <MiniProgress value={actions} tone={actions >= 100 ? "good" : "amber"} />
                    <p className="mt-0.5 text-[10px] text-ink-faint">
                      {actionsDone}/{c.actions.length} done
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-muted">{c.symptoms.length}</td>
                  <td className="px-4 py-3">
                    <Link to={`/challenges/${c.id}`} className="text-ink-faint hover:text-ruby-bright">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ChallengeVault() {
  const challengesQuery = useQuery(challengesQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const rawChallenges = challengesQuery.data || [];
  const colleges = useMemo(
    () => (collegesQuery.data || []).filter((college) => college.isPod),
    [collegesQuery.data],
  );
  const collegeNameById = useMemo(
    () => new Map(colleges.map((college) => [college.id, college.name])),
    [colleges],
  );
  const challenges = useMemo(
    () => rawChallenges.map((challenge) => {
      if (!challenge.collegeId || challenge.collegeName) return challenge;
      const collegeName = collegeNameById.get(challenge.collegeId);
      return collegeName ? { ...challenge, collegeName } : challenge;
    }),
    [rawChallenges, collegeNameById],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const stats = useMemo(() => vaultStats(challenges), [challenges]);

  const collegeOptions = useMemo(() => {
    const fromChallenges = new Map<string, string>();
    for (const challenge of challenges) {
      if (challenge.collegeId) fromChallenges.set(challenge.collegeId, challenge.collegeName || challenge.collegeId);
    }
    for (const college of colleges) {
      fromChallenges.set(college.id, college.name);
    }
    return [...fromChallenges.entries()].map(([id, name]) => ({ id, name }));
  }, [challenges, colleges]);

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "all" || pillarFilter !== "all" || collegeFilter !== "all");

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPillarFilter("all");
    setCollegeFilter("all");
  }

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (pillarFilter !== "all" && c.pillar !== pillarFilter) return false;
      if (collegeFilter !== "all" && c.collegeId !== collegeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.pillar.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        collegeLabel(c).toLowerCase().includes(q)
      );
    });
  }, [challenges, search, statusFilter, pillarFilter, collegeFilter]);

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        icon={Vault}
        title="Challenge Vault"
        description="See every challenge colleges have mapped — symptoms, RCA progress, and action plans across the network."
        className="mb-0 shrink-0"
        actionsClassName="w-auto justify-end"
        actions={
          <>
            <MobileFilterDrawer
              open={filterDrawerOpen}
              onOpen={() => setFilterDrawerOpen(true)}
              onClose={() => setFilterDrawerOpen(false)}
              active={hasActiveFilters}
              title="Challenge filters"
              triggerLabel="Open challenge filters"
              onClear={clearFilters}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  placeholder="Search challenges or colleges…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}>
                <option value="all">All colleges</option>
                {collegeOptions.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                <option value="all">All statuses</option>
                {CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
                <option value="all">All pillars</option>
                {["Research", "Network", "Talent", "Opportunities", "Brand", "Ops"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </MobileFilterDrawer>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="sm:hidden"
              aria-label="How the vault works"
              title="How the vault works"
              onClick={() => setGuideDrawerOpen(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Link to="/challenges/new" className="sm:hidden">
              <Button size="icon" aria-label="Map challenge" title="Map challenge">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/challenges/new" className="hidden sm:block">
              <Button>Map challenge</Button>
            </Link>
          </>
        }
      />

      <MobileVaultStats stats={stats} />

      <div className="hidden shrink-0 grid-cols-2 gap-3 sm:grid lg:grid-cols-5">
        <StatCard label="Open challenges" value={stats.open} icon={AlertTriangle} tone="amber" />
        <StatCard label="In RCA" value={stats.investigating} icon={GitBranch} tone="info" />
        <StatCard label="Action plans" value={stats.actionPlan} icon={ListChecks} tone="ruby" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="good" />
        <StatCard label="High priority" value={stats.critical} icon={AlertTriangle} tone="bad" />
      </div>

      <Card className="hidden shrink-0 p-4 sm:block">
        <p className="mb-3 font-display text-sm font-bold text-ink">How the vault works</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHALLENGE_GUIDE_STEPS.map((s) => (
            <div key={s.step} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
              <span className={cn("font-display text-lg font-black", s.tone)}>{s.step}</span>
              <p className="font-semibold text-ink">{s.label}</p>
              <p className="text-xs text-ink-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="hidden shrink-0 flex-col gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search challenges or colleges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} className="w-44">
          <option value="all">All colleges</option>
          {collegeOptions.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-44">
          <option value="all">All statuses</option>
          {CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="w-36">
          <option value="all">All pillars</option>
          {["Research", "Network", "Talent", "Opportunities", "Brand", "Ops"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <div className="hidden rounded-xl border border-line bg-surface-2 p-0.5 sm:flex">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "cards"
                ? "bg-ruby/15 text-ruby-bright"
                : "text-ink-muted hover:text-ink",
            )}
            aria-pressed={viewMode === "cards"}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "table"
                ? "bg-ruby/15 text-ruby-bright"
                : "text-ink-muted hover:text-ink",
            )}
            aria-pressed={viewMode === "table"}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {challengesQuery.isPending ? (
          <Card className="p-8 text-center text-sm text-ink-muted">Loading challenges…</Card>
        ) : challengesQuery.isError ? (
          <Card className="p-8 text-center text-sm text-bad">
            {challengesQuery.error instanceof Error ? challengesQuery.error.message : "Could not load challenges."}
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Vault}
            title="No challenges mapped"
            description="When colleges map blockers in their Challenge Vault, they will appear here for Caarya oversight."
          />
        ) : (
          <>
            <div className="sm:hidden">
              <MobileChallengeCards items={filtered} />
            </div>
            <div className="hidden sm:block">
              {viewMode === "cards" ? <ChallengeCards items={filtered} /> : <ChallengeTable items={filtered} />}
            </div>
          </>
        )}
      </div>

      <MobileVaultGuideDrawer open={guideDrawerOpen} onClose={() => setGuideDrawerOpen(false)} />
    </div>
  );
}
