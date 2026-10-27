import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { EVENT_TYPES, type AdminEvent, type AdminEventWriteInput } from "@/lib/events";

interface FormState { name: string; description: string; eventType: AdminEvent["eventType"] | ""; tags: string; guidelines: string; guidelinesUrl: string; }
const EMPTY_FORM: FormState = { name: "", description: "", eventType: "", tags: "", guidelines: "", guidelinesUrl: "" };
const splitTags = (value: string) => value.split(",").map((tag) => tag.trim()).filter(Boolean);

export function EventEditorDrawer({ open, onClose, event, onSave, isSaving, saveError }: { open: boolean; onClose: () => void; event: AdminEvent | null; onSave: (input: AdminEventWriteInput) => Promise<void>; isSaving: boolean; saveError: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setError(""); setForm(event ? { name: event.name, description: event.description, eventType: event.eventType, tags: event.tags.join(", "), guidelines: event.guidelines, guidelinesUrl: event.guidelinesUrl } : EMPTY_FORM); }, [event, open]);
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    if (!form.name.trim() || !form.description.trim() || !form.eventType) { setError("Complete all required fields."); return; }
    try { await onSave({ name: form.name.trim(), description: form.description.trim(), eventType: form.eventType, tags: splitTags(form.tags), guidelines: form.guidelines.trim(), guidelinesUrl: form.guidelinesUrl.trim() }); onClose(); } catch { /* Mutation error is displayed below. */ }
  }
  return <Drawer open={open} onClose={onClose} title={event ? "Edit event" : "Add event"} subtitle="Use commas to add more than one tag." width="max-w-2xl" footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button><Button onClick={submit} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{event ? "Save changes" : "Create event"}</Button></div>}><div className="space-y-4"><FieldRow label="Event name"><Input autoFocus value={form.name} onChange={(input) => setField("name", input.target.value)} placeholder="e.g. Campus Innovation Sprint" /></FieldRow><FieldRow label="Event description"><Textarea value={form.description} onChange={(input) => setField("description", input.target.value)} placeholder="What will attendees experience?" /></FieldRow><FieldRow label="Event type"><Select value={form.eventType} onChange={(input) => setField("eventType", input.target.value as FormState["eventType"])}><option value="">Select an event type</option>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></FieldRow><FieldRow label="Tags"><Input value={form.tags} onChange={(input) => setField("tags", input.target.value)} placeholder="campus, startups, leadership" /></FieldRow><FieldRow label="Guidelines"><Textarea value={form.guidelines} onChange={(input) => setField("guidelines", input.target.value)} placeholder="What should attendees prepare or know?" /></FieldRow><FieldRow label="Guidelines URL"><Input type="url" value={form.guidelinesUrl} onChange={(input) => setField("guidelinesUrl", input.target.value)} placeholder="https://example.com/event-guidelines" /></FieldRow>{error || saveError ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error || saveError}</p> : null}</div></Drawer>;
}
