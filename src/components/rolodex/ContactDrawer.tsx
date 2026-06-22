import { useMemo, useState } from "react";
import { Trash2, Send, Sparkles, Link2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { contactStore, researchStore } from "@/lib/data/collections";
import { OUTREACH_STAGES, CHANNELS } from "@/lib/constants";
import { computeScore } from "@/lib/data/scoring";
import { classBand, makeId } from "@/lib/utils";
import type { Contact, OutreachStage } from "@/lib/types";

export function ContactDrawer({
  contact,
  isNew,
  onClose,
}: {
  contact: Contact;
  isNew: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Contact>(contact);
  const [noteText, setNoteText] = useState("");

  const set =
    <K extends keyof Contact>(key: K) =>
    (value: Contact[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const linkedResearch = useMemo(
    () => (form.researchId ? researchStore.get(form.researchId) : undefined),
    [form.researchId],
  );

  const save = () => {
    contactStore.upsert(form);
    onClose();
  };

  const remove = () => {
    if (!isNew) contactStore.remove(form.id);
    onClose();
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setForm((f) => ({
      ...f,
      notes: [{ id: makeId("n"), ts: new Date().toISOString(), text: noteText.trim() }, ...f.notes],
    }));
    setNoteText("");
  };

  const draft = () => {
    const name = form.contactName?.split(" ")[0] || "there";
    const angle = form.hypothesis || "partner with your team on a campus-led initiative";
    const msg = `Hi ${name}, I'm with the Caarya Nexus Pod at SRCC. We've been researching ${form.company} and see a real chance to ${angle}. We run student-led squads that can deliver this fast — could I share a short plan this week?`;
    setForm((f) => ({ ...f, nextAction: f.nextAction || "Send first outreach message" }));
    setNoteText(msg);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "Add contact" : form.company || "Contact"}
      subtitle={form.contactName ? `${form.contactName}${form.contactRole ? ` · ${form.contactRole}` : ""}` : undefined}
      width="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          {!isNew ? (
            <Button variant="danger" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save}>Save contact</Button>
          </div>
        </div>
      }
    >
      {linkedResearch && (
        <div className="mb-5 rounded-2xl border border-ruby/30 bg-ruby/5 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ruby-bright">
              <Link2 className="h-3.5 w-3.5" /> Linked HIVE research
            </span>
            <Badge tone="amber">{computeScore(linkedResearch.scores)} · {classBand(computeScore(linkedResearch.scores)).label}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-muted">{linkedResearch.offer || linkedResearch.gaps}</p>
        </div>
      )}

      <Section title="Company">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Company"><Input value={form.company} onChange={(e) => set("company")(e.target.value)} /></FieldRow>
          <FieldRow label="Sector"><Input value={form.sector} onChange={(e) => set("sector")(e.target.value)} /></FieldRow>
          <FieldRow label="Contact name"><Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} /></FieldRow>
          <FieldRow label="Role"><Input value={form.contactRole} onChange={(e) => set("contactRole")(e.target.value)} /></FieldRow>
          <FieldRow label="Email"><Input value={form.email} onChange={(e) => set("email")(e.target.value)} /></FieldRow>
          <FieldRow label="LinkedIn"><Input value={form.linkedin} onChange={(e) => set("linkedin")(e.target.value)} /></FieldRow>
        </div>
      </Section>

      <Section title="Outreach">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Stage">
            <Select value={form.stage} onChange={(e) => set("stage")(e.target.value as OutreachStage)}>
              {OUTREACH_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Channel">
            <Select value={form.channel} onChange={(e) => set("channel")(e.target.value)}>
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Next action"><Input value={form.nextAction} onChange={(e) => set("nextAction")(e.target.value)} /></FieldRow>
          <FieldRow label="Next action date"><Input type="date" value={form.nextActionDate} onChange={(e) => set("nextActionDate")(e.target.value)} /></FieldRow>
          <FieldRow label="Owner"><Input value={form.owner} onChange={(e) => set("owner")(e.target.value)} /></FieldRow>
        </div>
        <FieldRow label="Outreach hypothesis (the angle / gap)" className="mt-3">
          <Textarea value={form.hypothesis} onChange={(e) => set("hypothesis")(e.target.value)} />
        </FieldRow>
      </Section>

      <Section title="Activity log">
        <div className="flex items-start gap-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Log a call, reply, or draft an outreach note…"
            className="min-h-[64px]"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={draft}>
            <Sparkles className="h-3.5 w-3.5" /> Draft outreach
          </Button>
          <Button size="sm" onClick={addNote} disabled={!noteText.trim()}>
            <Send className="h-3.5 w-3.5" /> Add to log
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {form.notes.length === 0 && (
            <p className="text-sm text-ink-faint">No activity logged yet.</p>
          )}
          {form.notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-sm text-ink">{n.text}</p>
              <p className="mt-1 text-[11px] text-ink-faint">{new Date(n.ts).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </Section>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ruby-bright">{title}</h3>
      {children}
    </div>
  );
}
