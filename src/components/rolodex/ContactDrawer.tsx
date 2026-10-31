import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Send, Sparkles, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { adminQueryKeys, relationshipCompaniesQueryOptions, researchProfilesQueryOptions } from "@/lib/adminQueries";
import { addRolodexActivity, archiveRolodexContact, createRelationshipCompany, createRolodexContact, updateRelationshipCompany, updateRolodexContact } from "@/lib/api";
import { CHANNELS, OUTREACH_STAGES } from "@/lib/constants";
import { computeScore } from "@/lib/data/scoring";
import type { Contact, OutreachStage } from "@/lib/types";
import { classBand, makeId } from "@/lib/utils";

export function ContactDrawer({ contact, isNew, onClose }: { contact: Contact; isNew: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: research = [] } = useQuery(researchProfilesQueryOptions());
  const { data: companies = [] } = useQuery(relationshipCompaniesQueryOptions());
  const [form, setForm] = useState<Contact>(contact);
  const [noteText, setNoteText] = useState("");
  const [pendingNotes, setPendingNotes] = useState<string[]>([]);
  const linkedResearch = useMemo(() => research.find((item) => item.id === (form.researchProfileId || form.researchId)), [form.researchId, form.researchProfileId, research]);
  const set = <K extends keyof Contact>(key: K) => (value: Contact[K]) => setForm((current) => ({ ...current, [key]: value }));
  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.company.trim();
      if (!name) throw new Error("Company name is required.");
      const companyInput = { name, industry: form.sector.trim() || undefined };
      const existing = form.companyId ? companies.find((company) => company.id === form.companyId) : companies.find((company) => company.name.trim().toLowerCase() === name.toLowerCase());
      const company = existing ? await updateRelationshipCompany(existing.id, companyInput) : await createRelationshipCompany(companyInput);
      const payload = { ...form, companyId: company.id, researchProfileId: form.researchProfileId || form.researchId || "" };
      const saved = isNew ? await createRolodexContact(payload) : await updateRolodexContact(form.id, payload);
      await Promise.all(pendingNotes.map((text) => addRolodexActivity(saved.id, text)));
      return saved;
    },
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: adminQueryKeys.rolodexContacts }), queryClient.invalidateQueries({ queryKey: adminQueryKeys.relationshipCompanies })]); onClose(); },
  });
  const archiveMutation = useMutation({ mutationFn: () => archiveRolodexContact(form.id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.rolodexContacts }); onClose(); } });
  const addNote = () => {
    const text = noteText.trim(); if (!text) return;
    setForm((current) => ({ ...current, notes: [{ id: makeId("note"), ts: new Date().toISOString(), text }, ...current.notes] }));
    setPendingNotes((current) => [...current, text]); setNoteText("");
  };
  const draft = () => { const firstName = form.contactName.split(" ")[0] || "there"; const angle = form.hypothesis || "partner with your team on a campus-led initiative"; setForm((current) => ({ ...current, nextAction: current.nextAction || "Send first outreach message" })); setNoteText(`Hi ${firstName}, I'm with the Caarya Nexus Pod at SRCC. We've been researching ${form.company} and see a real chance to ${angle}. We run student-led squads that can deliver this fast — could I share a short plan this week?`); };

  return <Drawer open onClose={onClose} title={isNew ? "Add contact" : form.company || "Contact"} subtitle={form.contactName ? `${form.contactName}${form.contactRole ? ` · ${form.contactRole}` : ""}` : undefined} width="max-w-xl" footer={<div className="flex items-center justify-between">{!isNew ? <Button variant="danger" size="sm" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}><Trash2 className="h-4 w-4" /> Archive</Button> : <span />}<div className="flex items-center gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save contact"}</Button></div></div>}>
    {linkedResearch && <div className="mb-5 rounded-2xl border border-ruby/30 bg-ruby/5 p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-semibold text-ruby-bright"><Link2 className="h-3.5 w-3.5" /> Linked HIVE research</span><Badge tone="amber">{computeScore(linkedResearch.scores)} · {classBand(computeScore(linkedResearch.scores)).label}</Badge></div><p className="mt-2 text-sm text-ink-muted">{linkedResearch.offer || linkedResearch.gaps}</p></div>}
    {saveMutation.error && <p className="mb-4 text-sm text-bad">{saveMutation.error.message}</p>}
    <Section title="Company"><div className="grid grid-cols-2 gap-3"><FieldRow label="Company"><Input value={form.company} onChange={(e) => set("company")(e.target.value)} /></FieldRow><FieldRow label="Sector"><Input value={form.sector} onChange={(e) => set("sector")(e.target.value)} /></FieldRow><FieldRow label="Contact name"><Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} /></FieldRow><FieldRow label="Role"><Input value={form.contactRole} onChange={(e) => set("contactRole")(e.target.value)} /></FieldRow><FieldRow label="Email"><Input value={form.email} onChange={(e) => set("email")(e.target.value)} /></FieldRow><FieldRow label="LinkedIn"><Input value={form.linkedin} onChange={(e) => set("linkedin")(e.target.value)} /></FieldRow></div></Section>
    <Section title="Outreach"><div className="grid grid-cols-2 gap-3"><FieldRow label="Stage"><Select value={form.stage} onChange={(e) => set("stage")(e.target.value as OutreachStage)}>{OUTREACH_STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</Select></FieldRow><FieldRow label="Channel"><Select value={form.channel} onChange={(e) => set("channel")(e.target.value)}>{CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</Select></FieldRow><FieldRow label="Next action"><Input value={form.nextAction} onChange={(e) => set("nextAction")(e.target.value)} /></FieldRow><FieldRow label="Next action date"><Input type="date" value={form.nextActionDate} onChange={(e) => set("nextActionDate")(e.target.value)} /></FieldRow><FieldRow label="Owner"><Input value={form.owner} onChange={(e) => set("owner")(e.target.value)} /></FieldRow></div><FieldRow label="Outreach hypothesis (the angle / gap)" className="mt-3"><Textarea value={form.hypothesis} onChange={(e) => set("hypothesis")(e.target.value)} /></FieldRow></Section>
    <Section title="Activity log"><Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Log a call, reply, or draft an outreach note…" className="min-h-[64px]" /><div className="mt-2 flex items-center gap-2"><Button size="sm" variant="secondary" onClick={draft}><Sparkles className="h-3.5 w-3.5" /> Draft outreach</Button><Button size="sm" onClick={addNote} disabled={!noteText.trim()}><Send className="h-3.5 w-3.5" /> Add to log</Button></div><div className="mt-4 space-y-2">{form.notes.length === 0 && <p className="text-sm text-ink-faint">No activity logged yet.</p>}{form.notes.map((note) => <div key={note.id} className="rounded-xl border border-line bg-surface-2 p-3"><p className="text-sm text-ink">{note.text}</p><p className="mt-1 text-[11px] text-ink-faint">{new Date(note.ts).toLocaleString("en-IN")}</p></div>)}</div></Section>
  </Drawer>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mb-6"><h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ruby-bright">{title}</h3>{children}</div>; }
