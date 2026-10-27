import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { AUDIENCE_BUCKETS, type Audience, type AudienceWriteInput } from "@/lib/audiences";

interface FormState {
  segment: string;
  description: string;
  bucket: Audience["bucket"] | "";
}

const EMPTY_FORM: FormState = { segment: "", description: "", bucket: "" };

export function AudienceEditorDrawer({ open, onClose, audience, onSave, isSaving, saveError }: { open: boolean; onClose: () => void; audience: Audience | null; onSave: (input: AudienceWriteInput) => Promise<void>; isSaving: boolean; saveError: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(audience ? { segment: audience.segment, description: audience.description, bucket: audience.bucket } : EMPTY_FORM);
  }, [audience, open]);

  async function submit() {
    if (!form.segment.trim() || !form.description.trim() || !form.bucket) {
      setError("Complete all required fields.");
      return;
    }
    try {
      await onSave({ segment: form.segment.trim(), description: form.description.trim(), bucket: form.bucket });
      onClose();
    } catch {
      // The mutation error is displayed below.
    }
  }

  return <Drawer open={open} onClose={onClose} title={audience ? "Edit audience" : "Add audience"} subtitle="Define the people this content and communication is meant for." width="max-w-xl" footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button><Button onClick={submit} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{audience ? "Save changes" : "Create audience"}</Button></div>}><div className="space-y-4"><FieldRow label="Segment"><Input autoFocus value={form.segment} onChange={(event) => setForm((current) => ({ ...current, segment: event.target.value }))} placeholder="e.g. First-year student founders" /></FieldRow><FieldRow label="Description"><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Who belongs to this audience, and what matters to them?" /></FieldRow><FieldRow label="Bucket"><Select value={form.bucket} onChange={(event) => setForm((current) => ({ ...current, bucket: event.target.value as FormState["bucket"] }))}><option value="">Select a bucket</option>{AUDIENCE_BUCKETS.map((bucket) => <option key={bucket} value={bucket}>{bucket}</option>)}</Select></FieldRow>{error || saveError ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error || saveError}</p> : null}</div></Drawer>;
}
