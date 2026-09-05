import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSearch, Loader2, RefreshCw, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { adminQueryKeys, atsCandidatesQueryOptions } from "@/lib/adminQueries";
import {
  getAtsProcessingJob,
  uploadAtsResume,
  type AtsCandidate,
  type AtsProcessingStatus,
  type AtsRosterType,
} from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<AtsProcessingStatus, string> = {
  manual: "Manual",
  uploaded: "Uploaded",
  queued: "Queued",
  extracting_text: "Extracting text",
  extracting_profile: "Extracting profile",
  validating: "Validating",
  normalizing: "Normalizing",
  generating_embeddings: "Generating embeddings",
  indexed: "Indexed",
  needs_review: "Needs review",
  failed: "Failed",
};

const STATUS_TONES: Record<AtsProcessingStatus, Tone> = {
  manual: "muted",
  uploaded: "info",
  queued: "amber",
  extracting_text: "amber",
  extracting_profile: "amber",
  validating: "amber",
  normalizing: "amber",
  generating_embeddings: "amber",
  indexed: "good",
  needs_review: "warn",
  failed: "bad",
};

function statusLabel(status: string) {
  return STATUS_LABELS[status as AtsProcessingStatus] || status;
}

function statusTone(status: string): Tone {
  return STATUS_TONES[status as AtsProcessingStatus] || "muted";
}

function formatExperience(months?: number) {
  const value = Number(months || 0);
  if (value <= 0) return "Experience not calculated";
  const years = Math.floor(value / 12);
  const remaining = value % 12;
  if (!years) return `${remaining} month${remaining === 1 ? "" : "s"}`;
  return remaining ? `${years} yr ${remaining} mo` : `${years} yr`;
}

function candidateSearchText(candidate: AtsCandidate) {
  return [
    candidate.contact.name,
    candidate.contact.email,
    candidate.contact.phone,
    candidate.contact.location,
    candidate.currentRole,
    candidate.currentCompany,
    candidate.professionalSummary,
    ...(candidate.preferredRoles || []),
    ...(candidate.skills || []).flatMap((skill) => [skill.raw, skill.normalized, skill.category]),
    ...(candidate.experience || []).flatMap((item) => [item.title, item.company, item.summary]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function CandidateDrawer({ candidate, onClose }: { candidate: AtsCandidate; onClose: () => void }) {
  const skills = candidate.skills || [];
  const experience = candidate.experience || [];
  const education = candidate.education || [];
  const projects = candidate.projects || [];

  return (
    <Drawer
      open
      onClose={onClose}
      title={candidate.contact.name}
      subtitle={candidate.currentRole || candidate.professionalSummary || "ATS candidate"}
      width="max-w-2xl"
    >
      <div className="space-y-5">
        <section className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(candidate.processingStatus)}>{statusLabel(candidate.processingStatus)}</Badge>
            <Badge tone={candidate.is_roster ? "good" : "muted"}>
              {candidate.is_roster ? candidate.roster_type || "In roster" : "Not in roster"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p className="text-ink-muted">Email: <span className="text-ink">{candidate.contact.email || "-"}</span></p>
            <p className="text-ink-muted">Phone: <span className="text-ink">{candidate.contact.phone || "-"}</span></p>
            <p className="text-ink-muted">Location: <span className="text-ink">{candidate.contact.location || "-"}</span></p>
            <p className="text-ink-muted">Experience: <span className="text-ink">{formatExperience(candidate.totalExperienceMonths)}</span></p>
          </div>
        </section>

        {candidate.professionalSummary && (
          <section>
            <h3 className="font-semibold text-ink">Summary</h3>
            <p className="mt-1 text-sm text-ink-muted">{candidate.professionalSummary}</p>
          </section>
        )}

        <section>
          <h3 className="font-semibold text-ink">Skills</h3>
          {skills.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((skill, index) => (
                <Badge key={`${skill.raw}-${index}`} tone="info">
                  {skill.normalized || skill.raw}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">No skills registered yet.</p>
          )}
        </section>

        <section>
          <h3 className="font-semibold text-ink">Experience</h3>
          <div className="mt-2 space-y-3">
            {experience.length ? experience.map((item, index) => (
              <div key={`${item.company}-${index}`} className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="font-medium text-ink">{item.title || "Role"}{item.company ? ` at ${item.company}` : ""}</p>
                <p className="text-xs text-ink-faint">
                  {[item.startDate, item.isCurrent ? "Present" : item.endDate].filter(Boolean).join(" - ") || "Dates unavailable"}
                </p>
                {item.summary && <p className="mt-2 text-sm text-ink-muted">{item.summary}</p>}
              </div>
            )) : (
              <p className="text-sm text-ink-muted">No experience registered yet.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-ink">Education</h3>
          <div className="mt-2 space-y-2">
            {education.length ? education.map((item, index) => (
              <p key={`${item.institution}-${index}`} className="text-sm text-ink-muted">
                <span className="text-ink">{item.institution || "Institution"}</span>
                {item.degree ? ` · ${item.degree}` : ""}
                {item.field ? ` · ${item.field}` : ""}
              </p>
            )) : (
              <p className="text-sm text-ink-muted">No education registered yet.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-ink">Projects</h3>
          <div className="mt-2 space-y-2">
            {projects.length ? projects.map((project, index) => (
              <div key={`${project.name}-${index}`} className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="font-medium text-ink">{project.name || "Project"}</p>
                {project.description && <p className="mt-1 text-sm text-ink-muted">{project.description}</p>}
              </div>
            )) : (
              <p className="text-sm text-ink-muted">No projects registered yet.</p>
            )}
          </div>
        </section>
      </div>
    </Drawer>
  );
}

export default function AtsCandidates() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rosterFilter, setRosterFilter] = useState<"all" | AtsRosterType | "none">("all");
  const [selectedCandidate, setSelectedCandidate] = useState<AtsCandidate | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ tone: "good" | "bad" | "info"; text: string } | null>(null);
  const [lastProcessingId, setLastProcessingId] = useState<string | null>(null);
  const candidatesQuery = useQuery(atsCandidatesQueryOptions());
  const processingQuery = useQuery({
    queryKey: ["admin", "ats-processing", lastProcessingId],
    queryFn: () => getAtsProcessingJob(lastProcessingId || ""),
    enabled: Boolean(lastProcessingId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ["indexed", "needs_review", "failed"].includes(status) ? false : 5000;
    },
  });
  const uploadMutation = useMutation({
    mutationFn: uploadAtsResume,
    onSuccess: (result) => {
      setLastProcessingId(result.processingId);
      setUploadMessage({
        tone: result.duplicate ? "info" : "good",
        text: result.duplicate
          ? `${result.candidate.contact.name} was already registered from this resume.`
          : `${result.candidate.contact.name} was registered from the resume upload.`,
      });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.atsCandidates });
    },
    onError: (error) => {
      setUploadMessage({
        tone: "bad",
        text: error instanceof Error ? error.message : "Could not upload resume.",
      });
    },
  });
  const candidates = candidatesQuery.data || [];
  const loading = candidatesQuery.isPending;
  const refreshing = !loading && candidatesQuery.isFetching;

  const statusOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.processingStatus))).sort(),
    [candidates],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (statusFilter !== "all" && candidate.processingStatus !== statusFilter) return false;
      if (rosterFilter === "none" && candidate.is_roster) return false;
      if (rosterFilter !== "all" && rosterFilter !== "none" && candidate.roster_type !== rosterFilter) return false;
      if (!q) return true;
      return candidateSearchText(candidate).includes(q);
    });
  }, [candidates, rosterFilter, search, statusFilter]);

  const rosterCount = candidates.filter((candidate) => candidate.is_roster).length;
  const indexedCount = candidates.filter((candidate) => candidate.processingStatus === "indexed").length;
  const reviewCount = candidates.filter((candidate) => candidate.processingStatus === "needs_review" || candidate.processingStatus === "failed").length;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadMessage(null);
    uploadMutation.mutate(file);
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="ATS Candidates"
        description="Review resume-scanned candidates, processing status, skills, experience, and roster placement."
        icon={FileSearch}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload resume
            </Button>
            <Button variant="secondary" onClick={() => void candidatesQuery.refetch()} disabled={loading || refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      {uploadMessage && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            uploadMessage.tone === "good" && "border-good/30 bg-good/10 text-good",
            uploadMessage.tone === "info" && "border-info/30 bg-info/10 text-info",
            uploadMessage.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
          )}
        >
          {uploadMessage.text}
        </p>
      )}

      {lastProcessingId && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Latest resume processing</p>
            <p className="mt-1 text-xs text-ink-faint">Processing ID: {lastProcessingId}</p>
          </div>
          <div className="flex items-center gap-2">
            {processingQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-ruby-bright" />}
            <Badge tone={statusTone(processingQuery.data?.status || "queued")}>
              {statusLabel(processingQuery.data?.status || "queued")}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => void processingQuery.refetch()}>
              Refresh status
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-ink-muted">Registered candidates</p>
          <p className="mt-1 font-display text-2xl font-black text-ink">{candidates.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-muted">Indexed</p>
          <p className="mt-1 font-display text-2xl font-black text-good">{indexedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-muted">In roster / review</p>
          <p className="mt-1 font-display text-2xl font-black text-ruby-bright">{rosterCount} / {reviewCount}</p>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                placeholder="Search by name, email, skill, role, company, or location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full sm:w-56">
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
            <Select value={rosterFilter} onChange={(event) => setRosterFilter(event.target.value as typeof rosterFilter)} className="w-full sm:w-52">
              <option value="all">All roster states</option>
              <option value="none">Not in roster</option>
              <option value="Castle">Castle</option>
              <option value="Internship">Internship</option>
              <option value="Observership">Observership</option>
            </Select>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <EmptyState
                icon={FileSearch}
                title={candidates.length === 0 ? "No ATS candidates yet" : "No candidates match"}
                description={
                  candidates.length === 0
                    ? "Resume-scanned candidates will appear here once the backend ATS scanner registers them."
                    : "Try changing the search, status, or roster filter."
                }
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-base">
                  <tr className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                    <th className="border-b border-line px-5 py-3 font-medium">Candidate</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Role / experience</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Skills</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Roster</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Status</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((candidate) => (
                    <tr key={candidate.id} className="align-top text-ink-muted">
                      <td className="border-b border-line px-5 py-4">
                        <button type="button" onClick={() => setSelectedCandidate(candidate)} className="text-left">
                          <p className="font-semibold text-ink hover:text-ruby-bright">{candidate.contact.name}</p>
                          <p className="mt-1 text-xs text-ink-faint">{candidate.contact.email || candidate.contact.phone || "-"}</p>
                        </button>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <p className="text-ink">{candidate.currentRole || "Role not set"}</p>
                        <p className="mt-1 text-xs text-ink-faint">{formatExperience(candidate.totalExperienceMonths)}</p>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {(candidate.skills || []).slice(0, 3).map((skill, index) => (
                            <Badge key={`${candidate.id}-${skill.raw}-${index}`} tone="muted" className="text-[10px]">
                              {skill.normalized || skill.raw}
                            </Badge>
                          ))}
                          {(candidate.skills || []).length > 3 && (
                            <span className="text-xs text-ink-faint">+{(candidate.skills || []).length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <Badge tone={candidate.is_roster ? "good" : "muted"}>
                          {candidate.is_roster ? candidate.roster_type || "In roster" : "Not in roster"}
                        </Badge>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <Badge tone={statusTone(candidate.processingStatus)}>
                          {statusLabel(candidate.processingStatus)}
                        </Badge>
                      </td>
                      <td className="border-b border-line px-5 py-4 text-ink-faint">
                        {formatDate(candidate.updatedAt || candidate.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {candidatesQuery.isError && (
        <p className={cn("rounded-xl border px-3 py-2 text-sm", "border-bad/30 bg-bad/10 text-bad")}>
          {candidatesQuery.error instanceof Error ? candidatesQuery.error.message : "Could not load ATS candidates."}
        </p>
      )}

      {selectedCandidate && (
        <CandidateDrawer candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}
