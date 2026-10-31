import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { adminQueryKeys, partnershipsQueryOptions, researchProfilesQueryOptions } from "@/lib/adminQueries";
import { archiveOpportunity, createOpportunity, updateOpportunity } from "@/lib/api";
import type { JobOpportunity, JobStatus, JobType, OpportunitySource } from "@/lib/types";

const TYPES: JobType[] = ["Internship", "Freelance", "Part-time", "Full-time", "Project"];
const STATUSES: JobStatus[] = ["Draft", "Open", "Shared", "Filled", "Closed"];
const MODES: JobOpportunity["workMode"][] = ["Remote", "Hybrid", "On-site"];
const SOURCES: OpportunitySource[] = ["partner", "researched"];
const SHARE_CHANNELS = ["Pod Board", "WhatsApp · SRCC", "Instagram", "LinkedIn", "College Notice Board"];

export function JobDrawer({ job, isNew, onClose }: { job: JobOpportunity; isNew: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: partners = [] } = useQuery(partnershipsQueryOptions());
  const { data: research = [] } = useQuery(researchProfilesQueryOptions());
  const [form, setForm] = useState<JobOpportunity>({ ...job, source: job.source ?? (job.partnerId ? "partner" : "researched") });
  const industryPartners = useMemo(() => partners.filter((partner) => partner.type === "Industry"), [partners]);
  const set = <K extends keyof JobOpportunity>(key: K) => (value: JobOpportunity[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setSource = (source: OpportunitySource) => setForm((current) => ({ ...current, source, partnerId: source === "partner" ? current.partnerId : undefined, partnershipId: source === "partner" ? current.partnershipId : undefined, researchId: source === "researched" ? current.researchId : undefined, researchProfileId: source === "researched" ? current.researchProfileId : undefined, companyId: undefined, company: "" }));
  const toggleChannel = (channel: string) => setForm((current) => { const has = current.sharedChannels.includes(channel); const sharedChannels = has ? current.sharedChannels.filter((item) => item !== channel) : [...current.sharedChannels, channel]; return { ...current, sharedChannels, status: sharedChannels.length && current.status === "Open" ? "Shared" : current.status }; });
  const saveMutation = useMutation({
    mutationFn: () => {
      if (form.source === "partner" && !(form.partnershipId || form.partnerId)) throw new Error("Choose an industry partner first.");
      if (form.source === "researched" && !(form.researchProfileId || form.researchId)) throw new Error("Choose a HIVE research profile first.");
      if (!form.companyId) throw new Error("The selected source is missing its company link.");
      const input = { ...form, skills: Array.isArray(form.skills) ? form.skills : [] };
      return isNew ? createOpportunity(input) : updateOpportunity(form.id, input);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.opportunities }); onClose(); },
  });
  const archiveMutation = useMutation({ mutationFn: () => archiveOpportunity(form.id), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: adminQueryKeys.opportunities }), queryClient.invalidateQueries({ queryKey: adminQueryKeys.placementOffers })]); onClose(); } });

  return <Drawer open onClose={onClose} title={isNew ? "New opportunity" : form.title || "Opportunity"} subtitle={form.company} width="max-w-xl" footer={<div className="flex items-center justify-between">{!isNew ? <Button variant="danger" size="sm" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}><Trash2 className="h-4 w-4" /> Archive</Button> : <span />}<div className="flex items-center gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save"}</Button></div></div>}>
    {saveMutation.error && <p className="mb-4 text-sm text-bad">{saveMutation.error.message}</p>}
    <div className="grid grid-cols-2 gap-3">
      <FieldRow label="Title" className="col-span-2"><Input value={form.title} onChange={(event) => set("title")(event.target.value)} /></FieldRow>
      <FieldRow label="Company"><Input value={form.company} readOnly className="bg-surface-2 text-ink-muted" placeholder="Choose a source below" /></FieldRow>
      <FieldRow label="Source"><Select value={form.source} onChange={(event) => setSource(event.target.value as OpportunitySource)}>{SOURCES.map((source) => <option key={source} value={source}>{source === "partner" ? "Partner (direct)" : "Researched (indirect)"}</option>)}</Select></FieldRow>
      {form.source === "partner" ? <FieldRow label="Industry partner" className="col-span-2"><Select value={form.partnershipId || form.partnerId || ""} onChange={(event) => { const partnershipId = event.target.value || undefined; const partner = industryPartners.find((item) => item.id === partnershipId); setForm((current) => ({ ...current, partnershipId, partnerId: partnershipId, companyId: partner?.companyId, company: partner?.name || "" })); }}><option value="">Select partner…</option>{industryPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</Select></FieldRow> : <FieldRow label="HIVE research profile" className="col-span-2"><Select value={form.researchProfileId || form.researchId || ""} onChange={(event) => { const researchId = event.target.value || undefined; const profile = research.find((item) => item.id === researchId); setForm((current) => ({ ...current, researchId, researchProfileId: researchId, companyId: profile?.companyId, company: profile?.name || "" })); }}><option value="">Select research…</option>{research.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.sector}</option>)}</Select></FieldRow>}
      <FieldRow label="Type"><Select value={form.type} onChange={(event) => set("type")(event.target.value as JobType)}>{TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></FieldRow>
      <FieldRow label="Status"><Select value={form.status} onChange={(event) => set("status")(event.target.value as JobStatus)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</Select></FieldRow>
      <FieldRow label="Work mode"><Select value={form.workMode} onChange={(event) => set("workMode")(event.target.value as JobOpportunity["workMode"])}>{MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</Select></FieldRow>
      <FieldRow label="Location"><Input value={form.location} onChange={(event) => set("location")(event.target.value)} /></FieldRow>
      <FieldRow label="Stipend"><Input value={form.stipend} onChange={(event) => set("stipend")(event.target.value)} /></FieldRow>
      <FieldRow label="Seats"><Input type="number" value={form.seats} onChange={(event) => set("seats")(Number(event.target.value))} /></FieldRow>
      <FieldRow label="Skills (comma-separated)" className="col-span-2"><Input value={form.skills.join(", ")} onChange={(event) => set("skills")(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></FieldRow>
      <FieldRow label="Description" className="col-span-2"><Textarea value={form.description} onChange={(event) => set("description")(event.target.value)} /></FieldRow>
    </div>
    <div className="mt-5"><p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ruby-bright"><Share2 className="h-3.5 w-3.5" /> Share with students</p><div className="flex flex-wrap gap-2">{SHARE_CHANNELS.map((channel) => { const active = form.sharedChannels.includes(channel); return <button key={channel} type="button" onClick={() => toggleChannel(channel)} className={active ? "rounded-full border border-ruby/40 bg-ruby/15 px-3 py-1 text-xs font-medium text-ruby-bright" : "rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-muted hover:border-line-strong"}>{channel}</button>; })}</div></div>
  </Drawer>;
}
