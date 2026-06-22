import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Vault,
  Plus,
  Search,
  GitBranch,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { challengeStore } from "@/lib/data/collections";
import { actionProgress, rcaProgress, vaultStats } from "@/lib/data/challenges";
import {
  CHALLENGE_SEVERITY_TONE,
  CHALLENGE_STATUSES,
  CHALLENGE_STATUS_TONE,
} from "@/lib/constants";
import type { Challenge, ChallengeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ChallengeStatus;
type ViewMode = "cards" | "table";

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

function ChallengeTable({ items }: { items: Challenge[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-xs font-bold uppercase tracking-widest text-ink-faint">
              <th className="px-4 py-3 font-bold">Challenge</th>
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
  const challenges = useCollection(challengeStore);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const stats = useMemo(() => vaultStats(challenges), [challenges]);

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (pillarFilter !== "all" && c.pillar !== pillarFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.pillar.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q)
      );
    });
  }, [challenges, search, statusFilter, pillarFilter]);

  return (
    <div>
      <PageHeader
        icon={Vault}
        title="Challenge Vault"
        description="Map what's blocking your pod, run root cause analysis, and track actions until it's solved."
        actions={
          <Link to="/challenges/new">
            <Button>
              <Plus className="h-4 w-4" /> Map challenge
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open challenges" value={stats.open} icon={AlertTriangle} tone="amber" />
        <StatCard label="In RCA" value={stats.investigating} icon={GitBranch} tone="info" />
        <StatCard label="Action plans" value={stats.actionPlan} icon={ListChecks} tone="ruby" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="good" />
        <StatCard label="High priority" value={stats.critical} icon={AlertTriangle} tone="bad" />
      </div>

      <Card className="mb-4 p-4">
        <p className="mb-3 font-display text-sm font-bold text-ink">How the vault works</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { step: "1", label: "Map", desc: "Capture symptoms, impact, and severity", tone: "text-ruby-bright" },
            { step: "2", label: "RCA", desc: "5 Whys to find the real root cause", tone: "text-amber-bright" },
            { step: "3", label: "Solve", desc: "Owned actions until the challenge closes", tone: "text-good" },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
              <span className={cn("font-display text-lg font-black", s.tone)}>{s.step}</span>
              <p className="font-semibold text-ink">{s.label}</p>
              <p className="text-xs text-ink-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search challenges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <div className="flex rounded-xl border border-line bg-surface-2 p-0.5">
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={Vault}
          title="No challenges mapped"
          description="When something blocks your pod, map it here — run RCA and track the fix."
          action={
            <Link to="/challenges/new">
              <Button>
                <Plus className="h-4 w-4" /> Map challenge
              </Button>
            </Link>
          }
        />
      ) : viewMode === "cards" ? (
        <ChallengeCards items={filtered} />
      ) : (
        <ChallengeTable items={filtered} />
      )}
    </div>
  );
}
