import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { CONTENT_BUCKETS, CONTENT_PILLARS, MARKETING_TYPES, type ContentDirectoryOptions, type ContentItem, type ContentWriteInput } from "@/lib/content";

interface FormState {
  name: string;
  description: string;
  contentTypeId: string;
  platformIds: string[];
  topicClusterIds: string[];
  bucket: ContentItem["bucket"] | "";
  pillar: ContentItem["pillar"] | "";
  marketingType: ContentItem["marketingType"] | "";
  tags: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", contentTypeId: "", platformIds: [], topicClusterIds: [], bucket: "", pillar: "", marketingType: "", tags: "" };
const splitValues = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const toggleId = (ids: string[], id: string) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

export function ContentEditorDrawer({ open, onClose, item, options, optionsError, onSave, isSaving, saveError }: {
  open: boolean;
  onClose: () => void;
  item: ContentItem | null;
  options?: ContentDirectoryOptions;
  optionsError: string;
  onSave: (input: ContentWriteInput) => Promise<void>;
  isSaving: boolean;
  saveError: string;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(item ? {
      name: item.name,
      description: item.description,
      contentTypeId: item.contentTypeId || "",
      platformIds: item.platformIds || [],
      topicClusterIds: item.topicClusterIds || [],
      bucket: item.bucket,
      pillar: item.pillar,
      marketingType: item.marketingType,
      tags: item.tags.join(", "),
    } : EMPTY_FORM);
  }, [item, open]);

  const selectedType = options?.contentTypes.find((type) => type.id === form.contentTypeId);
  const selectedPlatforms = useMemo(() => options?.platforms.filter((platform) => form.platformIds.includes(platform.id)) ?? [], [form.platformIds, options]);
  const selectedTopics = useMemo(() => options?.taxonomy.flatMap((narrative) => narrative.pairs.flatMap((pair) => pair.topics)).filter((topic) => form.topicClusterIds.includes(topic.id)) ?? [], [form.topicClusterIds, options]);
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }));

  async function submit() {
    if (!form.name.trim() || !form.description.trim() || !form.contentTypeId || !form.platformIds.length || !form.topicClusterIds.length || !form.bucket || !form.pillar || !form.marketingType) {
      setError("Choose a content type, at least one platform and topic cluster, then complete the required details.");
      return;
    }
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        contentTypeId: form.contentTypeId,
        platformIds: form.platformIds,
        topicClusterIds: form.topicClusterIds,
        bucket: form.bucket,
        pillar: form.pillar,
        marketingType: form.marketingType,
        tags: splitValues(form.tags),
      });
      onClose();
    } catch { /* the mutation error is shown below */ }
  }

  return (
    <Drawer open={open} onClose={onClose} title={item ? "Edit content" : "Add content"} subtitle="Choose the editorial direction and distribution for this idea." width="max-w-2xl"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button><Button onClick={submit} disabled={isSaving || !options}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{item ? "Save changes" : "Create content"}</Button></div>}>
      <div className="space-y-5">
        {item?.directoryStatus === "needs_review" ? <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-ink">This legacy item needs directory selections before it can be saved again.</p> : null}
        {optionsError ? <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{optionsError}</p> : null}
        <FieldRow label="Content name"><Input autoFocus value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Five ways students can validate an idea" /></FieldRow>
        <FieldRow label="Content description"><Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="What does this piece cover?" /></FieldRow>
        <div><FieldRow label="Content type"><Select value={form.contentTypeId} onChange={(event) => setField("contentTypeId", event.target.value)}><option value="">Select a content type</option>{options?.contentTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</Select></FieldRow><p className="mt-1 text-xs text-ink-muted">{selectedType?.description || "Choose one format for this content."}</p></div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Platforms</legend>
          <p className="mb-3 text-xs text-ink-muted">Choose every channel where this idea can be distributed.</p>
          <div className="grid gap-2 sm:grid-cols-2">{options?.platforms.map((platform) => <label key={platform.id} className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${form.platformIds.includes(platform.id) ? "border-ruby bg-ruby/10" : "border-line bg-surface-2"}`}><input className="mt-1 accent-ruby" type="checkbox" checked={form.platformIds.includes(platform.id)} onChange={() => setField("platformIds", toggleId(form.platformIds, platform.id))}/><span><span className="block font-semibold text-ink">{platform.label}</span><span className="block text-xs text-ink-muted">{platform.audience}</span></span></label>)}</div>
          {selectedPlatforms.length ? <p className="mt-2 text-xs text-ink-muted">{selectedPlatforms.map((platform) => platform.description).join(" ")}</p> : null}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Topic clusters</legend>
          <p className="mb-3 text-xs text-ink-muted">Select the editorial angles this idea should explore.</p>
          <div className="space-y-2">{options?.taxonomy.map((narrative) => <details key={narrative.id} className="rounded-xl border border-line bg-surface-2" open={form.topicClusterIds.some((id) => narrative.pairs.some((pair) => pair.topics.some((topic) => topic.id === id)))}><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 font-semibold text-ink"><span>{narrative.label}</span><ChevronDown className="h-4 w-4 text-ink-muted" /></summary><div className="space-y-3 border-t border-line px-3 py-3">{narrative.pairs.map((pair) => <div key={pair.id}><p className="mb-2 text-xs text-ink-muted">{pair.combinedNarrative}</p><div className="grid gap-2 sm:grid-cols-2">{pair.topics.map((topic) => <label key={topic.id} className={`flex cursor-pointer gap-2 rounded-lg border px-2.5 py-2 text-sm ${form.topicClusterIds.includes(topic.id) ? "border-ruby bg-ruby/10" : "border-line"}`}><input className="mt-1 accent-ruby" type="checkbox" checked={form.topicClusterIds.includes(topic.id)} onChange={() => setField("topicClusterIds", toggleId(form.topicClusterIds, topic.id).slice(0, 20))}/><span><span className="block font-medium text-ink">{topic.cluster}</span><span className="block text-xs text-ink-muted">{topic.topic}</span></span></label>)}</div></div>)}</div></details>)}</div>
        </fieldset>
        {selectedTopics.length ? <div className="rounded-xl border border-info/30 bg-info/10 p-3"><p className="text-sm font-semibold text-ink">Editorial brief</p>{selectedTopics.map((topic) => <div key={topic.id} className="mt-2 text-sm text-ink-muted"><span className="font-medium text-ink">{topic.cluster}</span> — {topic.contentDirection}<br/><span className="text-xs">Pair narrative: {topic.combinedNarrative}</span></div>)}</div> : null}
        <FieldRow label="Content bucket"><Select value={form.bucket} onChange={(event) => setField("bucket", event.target.value as FormState["bucket"])}><option value="">Select a bucket</option>{CONTENT_BUCKETS.map((bucket) => <option key={bucket} value={bucket}>{bucket}</option>)}</Select></FieldRow>
        <FieldRow label="Content pillar"><Select value={form.pillar} onChange={(event) => setField("pillar", event.target.value as FormState["pillar"])}><option value="">Select a pillar</option>{CONTENT_PILLARS.map((pillar) => <option key={pillar} value={pillar}>{pillar}</option>)}</Select></FieldRow>
        <FieldRow label="Marketing type"><Select value={form.marketingType} onChange={(event) => setField("marketingType", event.target.value as FormState["marketingType"])}><option value="">Select a marketing type</option>{MARKETING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></FieldRow>
        <div><FieldRow label="Tags"><Input value={form.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="campus, founders, growth" /></FieldRow><p className="mt-1 text-xs text-ink-muted">Separate tags with commas.</p></div>
        {error || saveError ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error || saveError}</p> : null}
      </div>
    </Drawer>
  );
}
