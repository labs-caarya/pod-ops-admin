import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { CONTENT_BUCKETS, CONTENT_PILLARS, MARKETING_TYPES, type ContentItem, type ContentWriteInput } from "@/lib/content";

interface FormState {
  name: string;
  description: string;
  type: string;
  platform: string;
  bucket: ContentItem["bucket"] | "";
  topicClusters: string;
  pillar: ContentItem["pillar"] | "";
  marketingType: ContentItem["marketingType"] | "";
  tags: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", type: "", platform: "", bucket: "", topicClusters: "", pillar: "", marketingType: "", tags: "" };

const splitValues = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ContentEditorDrawer({ open, onClose, item, onSave, isSaving, saveError }: { open: boolean; onClose: () => void; item: ContentItem | null; onSave: (input: ContentWriteInput) => Promise<void>; isSaving: boolean; saveError: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(item ? {
      name: item.name, description: item.description, type: item.type, platform: item.platform,
      bucket: item.bucket, topicClusters: item.topicClusters.join(", "), pillar: item.pillar,
      marketingType: item.marketingType, tags: item.tags.join(", "),
    } : EMPTY_FORM);
  }, [item, open]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }));

  async function submit() {
    if (!form.name.trim() || !form.description.trim() || !form.type.trim() || !form.platform.trim() || !form.bucket || !form.pillar || !form.marketingType) {
      setError("Complete all required fields.");
      return;
    }
    try {
      await onSave({
      name: form.name.trim(), description: form.description.trim(), type: form.type.trim(), platform: form.platform.trim(),
      bucket: form.bucket, topicClusters: splitValues(form.topicClusters), pillar: form.pillar, marketingType: form.marketingType, tags: splitValues(form.tags),
      });
      onClose();
    } catch {
      // The mutation error is displayed below.
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title={item ? "Edit content" : "Add content"} subtitle="Use commas to add more than one topic cluster or tag." width="max-w-2xl"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button><Button onClick={submit} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{item ? "Save changes" : "Create content"}</Button></div>}>
      <div className="space-y-4">
        <FieldRow label="Content name"><Input autoFocus value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Five ways students can validate an idea" /></FieldRow>
        <FieldRow label="Content description"><Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="What does this piece cover?" /></FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Content type"><Input value={form.type} onChange={(event) => setField("type", event.target.value)} placeholder="Reel, post, tweet…" /></FieldRow>
          <FieldRow label="Content platform"><Input value={form.platform} onChange={(event) => setField("platform", event.target.value)} placeholder="Instagram, Facebook…" /></FieldRow>
        </div>
        <FieldRow label="Content bucket"><Select value={form.bucket} onChange={(event) => setField("bucket", event.target.value as FormState["bucket"])}><option value="">Select a bucket</option>{CONTENT_BUCKETS.map((bucket) => <option key={bucket} value={bucket}>{bucket}</option>)}</Select></FieldRow>
        <FieldRow label="Topic clusters"><Input value={form.topicClusters} onChange={(event) => setField("topicClusters", event.target.value)} placeholder="Student growth, innovation" /></FieldRow>
        <FieldRow label="Content pillar"><Select value={form.pillar} onChange={(event) => setField("pillar", event.target.value as FormState["pillar"])}><option value="">Select a pillar</option>{CONTENT_PILLARS.map((pillar) => <option key={pillar} value={pillar}>{pillar}</option>)}</Select></FieldRow>
        <FieldRow label="Marketing type"><Select value={form.marketingType} onChange={(event) => setField("marketingType", event.target.value as FormState["marketingType"])}><option value="">Select a marketing type</option>{MARKETING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></FieldRow>
        <FieldRow label="Tags"><Input value={form.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="campus, founders, growth" /></FieldRow>
        {error || saveError ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error || saveError}</p> : null}
      </div>
    </Drawer>
  );
}
