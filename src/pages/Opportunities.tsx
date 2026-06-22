import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  IndianRupee,
  Users2,
  Share2,
  Megaphone,
  UserCheck,
  Building2,
  Microscope,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { jobStore } from "@/lib/data/collections";
import { normalizeJob, opportunitySourceLabel } from "@/lib/data/placement";
import { JOB_STATUS_TONE, OPPORTUNITY_SOURCE_TONE } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { JobOpportunity, OpportunitySource } from "@/lib/types";
import { JobDrawer } from "@/components/jobs/JobDrawer";
import { cn } from "@/lib/utils";

type SourceTab = "all" | OpportunitySource;

export default function Opportunities() {
  const jobs = useCollection(jobStore);
  const normalizedJobs = useMemo(() => jobs.map(normalizeJob), [jobs]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [editing, setEditing] = useState<JobOpportunity | "new" | null>(null);

  const filtered = useMemo(() => {
    return normalizedJobs.filter((j) => {
      if (sourceTab !== "all" && j.source !== sourceTab) return false;
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    });
  }, [normalizedJobs, search, statusFilter, sourceTab]);

  const stats = useMemo(
    () => ({
      live: normalizedJobs.filter((j) => j.status === "Open" || j.status === "Shared").length,
      partner: normalizedJobs.filter((j) => j.source === "partner").length,
      researched: normalizedJobs.filter((j) => j.source === "researched").length,
      seats: normalizedJobs.reduce((a, j) => a + j.seats, 0),
      applicants: normalizedJobs.reduce((a, j) => a + j.applicants, 0),
    }),
    [normalizedJobs],
  );

  const newJob = (): JobOpportunity => ({
    id: makeId("job"),
    title: "",
    company: "",
    source: "researched",
    type: "Internship",
    status: "Draft",
    location: "",
    workMode: "Remote",
    stipend: "",
    skills: [],
    description: "",
    seats: 1,
    applicants: 0,
    sharedChannels: [],
  });

  const quickShare = (j: JobOpportunity) => {
    const channels = j.sharedChannels.length ? j.sharedChannels : ["Pod Board"];
    jobStore.upsert({ id: j.id, status: "Shared", sharedChannels: channels });
  };

  const sourceTabs: { key: SourceTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: normalizedJobs.length },
    { key: "partner", label: "Partner", count: stats.partner },
    { key: "researched", label: "Researched", count: stats.researched },
  ];

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="Opportunity Canvas"
        description="Partner opportunities come directly from industry partners. Researched opportunities are built from HIVE research."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/placement">
              <Button variant="secondary"><UserCheck className="h-4 w-4" /> Placement Agent</Button>
            </Link>
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> New opportunity
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Live opportunities" value={stats.live} icon={Megaphone} tone="amber" />
        <StatCard label="Partner direct" value={stats.partner} icon={Building2} tone="good" />
        <StatCard label="Researched" value={stats.researched} icon={Microscope} tone="info" />
        <StatCard label="Total seats" value={stats.seats} icon={Users2} tone="ruby" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {sourceTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSourceTab(tab.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              sourceTab === tab.key
                ? "border-ruby/40 bg-ruby/15 text-ruby-bright"
                : "border-line bg-surface-2 text-ink-muted hover:border-line-strong",
            )}
          >
            {tab.label} <span className="text-ink-faint">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search opportunities…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          {["Draft", "Open", "Shared", "Filled", "Closed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities yet"
          description="Post a partner opportunity or convert HIVE research into a researched gig."
          action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New opportunity</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((j) => (
            <Card key={j.id} hover className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setEditing(j)} className="min-w-0 text-left">
                  <h3 className="truncate font-display font-bold text-ink">{j.title}</h3>
                  <p className="truncate text-xs text-ink-muted">{j.company}</p>
                </button>
                <Badge tone={JOB_STATUS_TONE[j.status] ?? "muted"}>{j.status}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={OPPORTUNITY_SOURCE_TONE[j.source] ?? "muted"}>
                  {j.source === "partner" ? <Building2 className="mr-1 inline h-3 w-3" /> : <Microscope className="mr-1 inline h-3 w-3" />}
                  {opportunitySourceLabel(j.source)}
                </Badge>
                <Badge tone="ruby">{j.type}</Badge>
                <span className="flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-ink-muted">
                  <MapPin className="h-3 w-3" /> {j.workMode}
                </span>
                {j.stipend && (
                  <span className="flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-ink-muted">
                    <IndianRupee className="h-3 w-3" /> {j.stipend}
                  </span>
                )}
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{j.description}</p>

              <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
                <span>{j.seats} seats · {j.applicants} applied</span>
                {j.sharedChannels.length > 0 && (
                  <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {j.sharedChannels.length} channels</span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(j)}>Edit</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  variant={j.status === "Shared" ? "outline" : "primary"}
                  onClick={() => quickShare(j)}
                >
                  <Share2 className="h-3.5 w-3.5" /> {j.status === "Shared" ? "Shared" : "Share"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <JobDrawer
          job={editing === "new" ? newJob() : editing}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
