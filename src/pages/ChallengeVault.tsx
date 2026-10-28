import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Vault,
  Search,
  GitBranch,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Table2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { CompactStatGrid } from "@/components/ui/CompactStatGrid";
import { Card } from "@/components/ui/Card";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { actionProgress, rcaProgress, statusIndex, vaultStats } from "@/lib/data/challenges";
import { challengesQueryOptions, collegesQueryOptions } from "@/lib/adminQueries";
import {
  CHALLENGE_SEVERITY_TONE,
  CHALLENGE_STATUSES,
  CHALLENGE_STATUS_TONE,
} from "@/lib/constants";
import type { Challenge, ChallengeSeverity, ChallengeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ChallengeStatus;
type ViewMode = "cards" | "table";
type VaultTab = "stats" | "open";
type VaultStats = ReturnType<typeof vaultStats>;

const VAULT_TABS: { id: VaultTab; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "open", label: "Open challenges" },
];

const OPEN_CHALLENGE_STATUSES = CHALLENGE_STATUSES.filter((status) => status !== "Resolved");
const PREVIEW_COUNT = 5;
const SEVERITY_ORDER: ChallengeSeverity[] = ["Critical", "High", "Medium", "Low"];

type SeveritySheet = ChallengeSeverity | null;

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
    <CompactStatGrid label="Challenge statistics" className="shrink-0 grid-cols-3 sm:hidden">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-surface/80 px-4 py-3">
          <p className={cn("font-display text-2xl font-black leading-none", item.tone)}>{item.value}</p>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">{item.label}</p>
        </div>
      ))}
    </CompactStatGrid>
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [vaultTab, setVaultTab] = useState<VaultTab>("stats");
  const [severitySheet, setSeveritySheet] = useState<SeveritySheet>(null);

  const stats = useMemo(() => vaultStats(challenges), [challenges]);
  const openChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status !== "Resolved"),
    [challenges],
  );
  const severityGroups = useMemo(() => {
    const groups = Object.fromEntries(SEVERITY_ORDER.map((severity) => [severity, [] as Challenge[]])) as Record<
      ChallengeSeverity,
      Challenge[]
    >;
    for (const challenge of openChallenges) {
      groups[challenge.severity]?.push(challenge);
    }
    for (const severity of SEVERITY_ORDER) {
      groups[severity].sort(
        (left, right) => statusIndex(right.status) - statusIndex(left.status) || left.title.localeCompare(right.title),
      );
    }
    return groups;
  }, [openChallenges]);

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

  const filteredOpen = useMemo(() => {
    return openChallenges.filter((c) => {
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
  }, [openChallenges, search, statusFilter, pillarFilter, collegeFilter]);

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
            {vaultTab === "open" ? (
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
                {OPEN_CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
                <option value="all">All pillars</option>
                {["Research", "Network", "Talent", "Opportunities", "Brand", "Ops"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </MobileFilterDrawer>
            ) : null}
          </>
        }
      />

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-1" role="tablist" aria-label="Challenge vault sections">
        {VAULT_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={vaultTab === item.id}
            onClick={() => setVaultTab(item.id)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              vaultTab === item.id ? "bg-ruby/15 text-ruby-bright" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {vaultTab === "stats" ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <MobileVaultStats stats={stats} />
          <CompactStatGrid label="Challenge statistics" className="hidden grid-cols-2 sm:grid lg:grid-cols-5">
            <StatCard label="Open challenges" value={stats.open} icon={AlertTriangle} tone="amber" />
            <StatCard label="In RCA" value={stats.investigating} icon={GitBranch} tone="info" />
            <StatCard label="Action plans" value={stats.actionPlan} icon={ListChecks} tone="ruby" />
            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="good" />
            <StatCard label="High priority" value={stats.critical} icon={AlertTriangle} tone="bad" />
          </CompactStatGrid>
          <Card className="p-4 sm:p-5">
            <div className="mb-1">
              <h2 className="font-display text-lg font-bold text-ink">Open by severity</h2>
              <p className="mt-1 text-sm text-ink-muted">Unresolved challenges grouped by severity across the network.</p>
            </div>
            {challengesQuery.isPending ? (
              <p className="mt-4 text-sm text-ink-muted">Loading challenges…</p>
            ) : challengesQuery.isError ? (
              <p className="mt-4 text-sm text-bad">Could not load challenges.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {SEVERITY_ORDER.map((severity) => (
                  <SeverityColumn
                    key={severity}
                    severity={severity}
                    challenges={severityGroups[severity]}
                    highlighted={severity === "Critical"}
                    onViewAll={() => setSeveritySheet(severity)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {vaultTab === "open" ? (
        <>
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
          {OPEN_CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
        ) : filteredOpen.length === 0 ? (
          <EmptyState
            icon={Vault}
            title={openChallenges.length ? "No matching open challenges" : "No open challenges"}
            description={
              openChallenges.length
                ? "Try another search or filter."
                : "When colleges map blockers in their Challenge Vault, open items will appear here for Caarya oversight."
            }
          />
        ) : (
          <>
            <div className="sm:hidden">
              <MobileChallengeCards items={filteredOpen} />
            </div>
            <div className="hidden sm:block">
              {viewMode === "cards" ? <ChallengeCards items={filteredOpen} /> : <ChallengeTable items={filteredOpen} />}
            </div>
          </>
        )}
      </div>
        </>
      ) : null}

      <ResponsiveSheet
        open={Boolean(severitySheet)}
        onClose={() => setSeveritySheet(null)}
        title={severitySheet ? `${severitySheet} severity` : "Challenges"}
        subtitle={
          severitySheet
            ? `${severityGroups[severitySheet].length} open challenge${severityGroups[severitySheet].length === 1 ? "" : "s"}`
            : undefined
        }
      >
        {severitySheet ? (
          <div className="space-y-2">
            {severityGroups[severitySheet].map((challenge) => (
              <SeverityChallengeRow key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : null}
      </ResponsiveSheet>
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

function severityColumnTone(severity: ChallengeSeverity): "bad" | "amber" | "info" | "muted" {
  return CHALLENGE_SEVERITY_TONE[severity] ?? "muted";
}

function SeverityColumn({
  severity,
  challenges,
  highlighted = false,
  onViewAll,
}: {
  severity: ChallengeSeverity;
  challenges: Challenge[];
  highlighted?: boolean;
  onViewAll: () => void;
}) {
  const tone = severityColumnTone(severity);
  const borderClass =
    highlighted
      ? "border-bad/50 bg-bad/10"
      : tone === "amber"
        ? "border-amber/30 bg-amber/5"
        : tone === "info"
          ? "border-info/30 bg-info/5"
          : "border-line bg-surface-2/50";

  return (
    <div className={cn("rounded-2xl border p-3", borderClass)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              tone === "bad" ? "text-bad" : tone === "amber" ? "text-amber-bright" : tone === "info" ? "text-info" : "text-ink-muted",
            )}
          />
          <h3 className="font-display text-sm font-bold text-ink">{severity}</h3>
          <Badge tone={tone}>{challenges.length}</Badge>
        </div>
        {challenges.length > PREVIEW_COUNT ? <ViewAllButton count={challenges.length} onClick={onViewAll} /> : null}
      </div>
      {challenges.length ? (
        <div className="mt-3 space-y-2">
          {challenges.slice(0, PREVIEW_COUNT).map((challenge) => (
            <SeverityChallengeRow key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">None right now.</p>
      )}
    </div>
  );
}

function SeverityChallengeRow({ challenge }: { challenge: Challenge }) {
  return (
    <Link to={`/challenges/${challenge.id}`} className="block rounded-xl border border-line bg-surface px-3 py-2 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-ink">{challenge.title}</p>
        <Badge tone={CHALLENGE_SEVERITY_TONE[challenge.severity] ?? "muted"}>{challenge.severity}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        {collegeLabel(challenge)}
        {challenge.status ? ` · ${challenge.status}` : ""}
        {challenge.owner ? ` · ${challenge.owner}` : ""}
      </p>
    </Link>
  );
}
