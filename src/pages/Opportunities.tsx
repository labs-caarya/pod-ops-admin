import { useMemo, useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  IndianRupee,
  Users2,
  Share2,
  Megaphone,
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
import { JOB_STATUS_TONE } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { JobOpportunity } from "@/lib/types";
import { JobDrawer } from "@/components/jobs/JobDrawer";

export default function Opportunities() {
  const jobs = useCollection(jobStore);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<JobOpportunity | "new" | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    });
  }, [jobs, search, statusFilter]);

  const stats = useMemo(
    () => ({
      live: jobs.filter((j) => j.status === "Open" || j.status === "Shared").length,
      seats: jobs.reduce((a, j) => a + j.seats, 0),
      applicants: jobs.reduce((a, j) => a + j.applicants, 0),
    }),
    [jobs],
  );

  const newJob = (): JobOpportunity => ({
    id: makeId("job"),
    title: "",
    company: "",
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

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="Opportunity Canvas"
        description="Pump in jobs, internships and gigs, then share them with fellow students across your channels."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> New opportunity
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Live opportunities" value={stats.live} icon={Megaphone} tone="amber" />
        <StatCard label="Total seats" value={stats.seats} icon={Users2} tone="ruby" />
        <StatCard label="Applicants" value={stats.applicants} icon={Share2} tone="good" />
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
          description="Post an internship, gig or project to share with your students."
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
