import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Network, Search, ShieldAlert, Users2, Microscope, Building2, BriefcaseBusiness } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Select } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Misc";
import { adminPods, podDetails, type AdminPod } from "@/lib/admin/demoData";

const healthTone = {
  Thriving: "good",
  Watching: "amber",
  "At Risk": "bad",
} as const;

export default function AdminPods() {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const [selectedPod, setSelectedPod] = useState<AdminPod | null>(null);
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return adminPods.filter((pod) => {
      if (health !== "all" && pod.health !== health) return false;
      if (!needle) return true;
      return [pod.name, pod.city, pod.college, pod.lead].join(" ").toLowerCase().includes(needle);
    });
  }, [deferredQuery, health]);

  return (
    <div>
      <PageHeader
        icon={Network}
        title="Pod Portfolio"
        description="Demo admin view for network health, rollout coverage, and intervention priority."
      />

      <Card className="mb-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                startTransition(() => setQuery(next));
              }}
              placeholder="Search by pod, city, college, or lead…"
              className="pl-9"
            />
          </div>
          <Select value={health} onChange={(e) => setHealth(e.target.value)} className="w-full lg:w-52">
            <option value="all">All health states</option>
            <option value="Thriving">Thriving</option>
            <option value="Watching">Watching</option>
            <option value="At Risk">At Risk</option>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-3">
          {rows.map((pod) => (
            <button
              key={pod.id}
              type="button"
              onClick={() => setSelectedPod(pod)}
              className="block w-full text-left"
            >
            <Card hover className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-ink">{pod.name}</h2>
                    <Badge tone={healthTone[pod.health]}>{pod.health}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{pod.college} · {pod.city} · Lead {pod.lead}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Maturity</p>
                  <p className="font-display text-2xl font-black text-gradient">{pod.maturityScore}%</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Members" value={pod.members} />
                <Stat label="Clubs" value={pod.activeClubs} />
                <Stat label="Placements" value={pod.placements} />
                <Stat label="Open risks" value={pod.openRisks} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <Bar label="Outreach coverage" value={pod.outreachCoverage} />
                <Bar label="Admin readiness" value={pod.maturityScore} />
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-sm text-ruby-bright">View pod details</span>
              </div>
            </Card>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-ruby/10 p-3 text-ruby-bright">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Intervention playbook</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Watch for pods below 60% maturity, 2+ open risks, and 3+ pending approvals.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-ink-muted">
              <p>1. Freeze elevated role grants on pods marked at risk.</p>
              <p>2. Assign an org admin shadow lead for 7 days.</p>
              <p>3. Audit sponsor exposure before new outreach is unlocked.</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-info/10 p-3 text-info">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Rollout heuristic</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Best-performing pods keep role hygiene, sponsorship freshness, and talent coverage in sync.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="good">Role hygiene weekly</Badge>
              <Badge tone="amber">Partner board review</Badge>
              <Badge tone="info">Talent audit every sprint</Badge>
            </div>
          </Card>
        </div>
      </div>

      <PodDetailDrawer pod={selectedPod} onClose={() => setSelectedPod(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <ProgressBar value={value} tone={value >= 80 ? "good" : value >= 60 ? "amber" : "ruby"} />
    </div>
  );
}

function PodDetailDrawer({
  pod,
  onClose,
}: {
  pod: AdminPod | null;
  onClose: () => void;
}) {
  if (!pod) return null;
  const detail = podDetails[pod.id];

  return (
    <Drawer
      open={Boolean(pod)}
      onClose={onClose}
      title={pod.name}
      subtitle={`${pod.college} · Lead ${pod.lead}`}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">{pod.city} · {pod.health} · {pod.placements} placements</span>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-ruby-bright" />
            <h3 className="font-display text-lg font-bold text-ink">Members</h3>
          </div>
          <div className="mt-3 space-y-3">
            {detail.members.map((member) => (
              <div key={member.name} className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-sm font-semibold text-ink">{member.name}</p>
                <p className="text-xs text-ink-muted">{member.role}</p>
                <p className="mt-1 text-xs text-ink-faint">{member.focus}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-bright" />
            <h3 className="font-display text-lg font-bold text-ink">Clubs</h3>
          </div>
          <div className="mt-3 space-y-3">
            {detail.clubs.map((club) => (
              <div key={club.name} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{club.name}</p>
                  <Badge tone={club.stage === "Strategic" || club.stage === "Active" ? "good" : club.stage === "Engaged" ? "amber" : "muted"}>
                    {club.stage}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-faint">{club.contribution}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-info" />
            <h3 className="font-display text-lg font-bold text-ink">Placements</h3>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-surface-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Current status</p>
            <p className="mt-1 font-display text-3xl font-black text-gradient">{pod.placements}</p>
            <p className="text-sm text-ink-muted">Students placed from this pod so far.</p>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-surface-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Open risks</p>
            <p className="mt-1 font-display text-2xl font-black text-ink">{pod.openRisks}</p>
            <p className="text-sm text-ink-muted">Operational issues that could affect partner delivery.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-2">
          <Microscope className="h-4 w-4 text-ruby-bright" />
          <h3 className="font-display text-lg font-bold text-ink">Current research</h3>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {detail.research.map((item) => (
            <div key={`${item.company}-${item.status}`} className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{item.company}</p>
                <Badge tone={item.status === "In Conversation" || item.status === "Outreach Sent" ? "amber" : item.status === "Scored" ? "info" : item.status === "Blocked" ? "bad" : "muted"}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{item.type}</p>
              <p className="mt-2 text-sm text-ink-faint">{item.angle}</p>
            </div>
          ))}
        </div>
      </Card>
    </Drawer>
  );
}
