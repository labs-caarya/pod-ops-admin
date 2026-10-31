import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow } from "@/components/ui/Field";
import { archivePartnership, createPartnership, type PartnerWriteInput, updatePartnership } from "@/lib/api";
import { adminQueryKeys } from "@/lib/adminQueries";
import type { Partner, PartnerKind, PartnerStage, PartnerType } from "@/lib/types";

const TYPES: PartnerType[] = ["Academic", "Campus Company", "Industry"];
const KINDS: PartnerKind[] = ["Club", "Council", "College", "Company", "Incubator", "Community", "Student Startup"];
const STAGES: PartnerStage[] = ["Prospect", "Engaged", "Active", "Strategic"];

function toWriteInput(partner: Partner): PartnerWriteInput {
  return {
    type: partner.type,
    kind: partner.kind,
    stage: partner.stage,
    owner: partner.owner,
    memberCount: Number(partner.memberCount) || 0,
    description: partner.description,
    sponsorshipEnabled: partner.sponsorshipEnabled,
    sponsorshipAssets: partner.sponsorshipAssets,
    tags: partner.tags,
    organisation: {
      name: partner.name.trim(),
      organizationType: partner.type,
      industry: partner.kind,
      city: partner.city,
      contactName: partner.contactName,
      contactRole: partner.contactRole,
      contactEmail: partner.email,
      contactPhone: partner.phone,
      notes: partner.description,
    },
  };
}

export function PartnerDrawer({ partner, isNew, onClose }: { partner: Partner; isNew: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partner>(partner);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(partner);
    setError("");
  }, [partner]);

  const set = <K extends keyof Partner>(key: K) => (value: Partner[K]) => setForm((current) => ({ ...current, [key]: value }));
  const saveMutation = useMutation({
    mutationFn: () => isNew ? createPartnership(toWriteInput(form)) : updatePartnership(form.id, toWriteInput(form)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.partnerships }); onClose(); },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Could not save this partner."),
  });
  const archiveMutation = useMutation({
    mutationFn: () => archivePartnership(form.id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.partnerships }); onClose(); },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Could not archive this partner."),
  });

  function save() {
    setError("");
    if (!form.name.trim()) return setError("Add the organisation name before saving.");
    saveMutation.mutate();
  }
  function remove() {
    setError("");
    if (window.confirm(`Archive “${form.name}”? It will no longer appear in active partners.`)) archiveMutation.mutate();
  }
  const busy = saveMutation.isPending || archiveMutation.isPending;
  const canArchive = form.canArchive !== false;

  return <Drawer open onClose={onClose} title={isNew ? "Add partner" : form.name} subtitle={`${form.type} · ${form.kind}`} width="max-w-xl" footer={<div className="flex items-center justify-between">{!isNew && canArchive ? <Button variant="danger" size="sm" onClick={remove} disabled={busy}>{archiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Archive</Button> : <span />}<div className="flex items-center gap-2"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={save} disabled={busy}>{saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button></div></div>}>
    <div className="grid grid-cols-2 gap-3">
      <FieldRow label="Name" className="col-span-2"><Input value={form.name} onChange={(event) => set("name")(event.target.value)} /></FieldRow>
      <FieldRow label="Type"><Select value={form.type} onChange={(event) => { const type = event.target.value as PartnerType; setForm((current) => ({ ...current, type, kind: type === "Academic" ? "Club" : type === "Campus Company" ? "Student Startup" : "Company", sponsorshipEnabled: type === "Academic" ? current.sponsorshipEnabled : false })); }}>{TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></FieldRow>
      <FieldRow label="Kind"><Select value={form.kind} onChange={(event) => set("kind")(event.target.value as PartnerKind)}>{KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</Select></FieldRow>
      <FieldRow label="Stage"><Select value={form.stage} onChange={(event) => set("stage")(event.target.value as PartnerStage)}>{STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</Select></FieldRow>
      <FieldRow label="City"><Input value={form.city} onChange={(event) => set("city")(event.target.value)} /></FieldRow>
      <FieldRow label="Members"><Input type="number" min="0" value={form.memberCount} onChange={(event) => set("memberCount")(Number(event.target.value) || 0)} /></FieldRow>
      <FieldRow label="Owner"><Input value={form.owner} onChange={(event) => set("owner")(event.target.value)} /></FieldRow>
      <FieldRow label="Contact name"><Input value={form.contactName} onChange={(event) => set("contactName")(event.target.value)} /></FieldRow>
      <FieldRow label="Contact role"><Input value={form.contactRole} onChange={(event) => set("contactRole")(event.target.value)} /></FieldRow>
      <FieldRow label="Email"><Input type="email" value={form.email} onChange={(event) => set("email")(event.target.value)} /></FieldRow>
      <FieldRow label="Phone"><Input value={form.phone} onChange={(event) => set("phone")(event.target.value)} /></FieldRow>
      <FieldRow label="Description" className="col-span-2"><Textarea value={form.description} onChange={(event) => set("description")(event.target.value)} /></FieldRow>
    </div>
    {form.type === "Academic" ? <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.sponsorshipEnabled} onChange={(event) => set("sponsorshipEnabled")(event.target.checked)} className="h-4 w-4 accent-[#e11d48]" />Enable the sponsorship leverage dashboard for this academic partner</label> : null}
    {error ? <p className="mt-4 text-sm text-bad" role="alert">{error}</p> : null}
  </Drawer>;
}
