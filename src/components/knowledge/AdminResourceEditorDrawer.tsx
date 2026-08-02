import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { createKnowledgeResource, updateKnowledgeResource } from "@/lib/api";
import { adminQueryKeys } from "@/lib/adminQueries";
import type {
  KnowledgeResource,
  KnowledgeResourceCategory,
  KnowledgeResourceDomain,
  KnowledgeResourceOptions,
  KnowledgeResourceWriteInput,
  KnowledgeResourceWriteType,
} from "@/lib/knowledgeSpace/types";

interface FormState {
  title: string;
  description: string;
  url: string;
  type: KnowledgeResourceWriteType;
  category: KnowledgeResourceCategory;
  domain: KnowledgeResourceDomain | "";
  tags: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  url: "",
  type: "docs",
  category: "caarya-curated",
  domain: "",
  tags: "",
};

export function AdminResourceEditorDrawer({
  open,
  onClose,
  resource,
  options,
}: {
  open: boolean;
  onClose: () => void;
  resource: KnowledgeResource | null;
  options: KnowledgeResourceOptions;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(resource
      ? {
          title: resource.title,
          description: resource.description,
          url: resource.url,
          type: resource.type === "html" ? "html" : "docs",
          category: resource.category === "community" ? "community" : "caarya-curated",
          domain: resource.domain as KnowledgeResourceDomain,
          tags: resource.tags.join(", "),
        }
      : EMPTY_FORM);
  }, [open, resource]);

  const saveMutation = useMutation({
    mutationFn: async (input: KnowledgeResourceWriteInput) => resource
      ? updateKnowledgeResource(resource.id, input)
      : createKnowledgeResource(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.knowledgeResources });
      onClose();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Could not save the resource."),
  });

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    setError("");
    if (!form.title.trim() || !form.description.trim() || !form.url.trim() || !form.domain) {
      setError("Complete all required fields.");
      return;
    }
    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      type: form.type,
      category: form.category,
      domain: form.domain,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={resource ? "Edit knowledge resource" : "Create knowledge resource"}
      subtitle="Creator attribution is recorded automatically from the admin session."
      footer={<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button><Button type="button" onClick={submit} disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save resource</Button></div>}
    >
      <div className="space-y-4">
        <FieldRow label="Title"><Input value={form.title} onChange={(event) => setField("title", event.target.value)} /></FieldRow>
        <FieldRow label="Description"><Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} /></FieldRow>
        <FieldRow label="URL"><Input type="url" placeholder="https://example.com/resource" value={form.url} onChange={(event) => setField("url", event.target.value)} /></FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Type"><Select value={form.type} onChange={(event) => setField("type", event.target.value as KnowledgeResourceWriteType)}>{options.types.map((type) => <option key={type} value={type}>{type === "docs" ? "Docs" : "HTML"}</option>)}</Select></FieldRow>
          <FieldRow label="Category"><Select value={form.category} onChange={(event) => setField("category", event.target.value as KnowledgeResourceCategory)}><option value="caarya-curated">Caarya Curated</option><option value="community">Community Guide</option></Select></FieldRow>
        </div>
        <FieldRow label="Domain"><Select value={form.domain} onChange={(event) => setField("domain", event.target.value as KnowledgeResourceDomain)}><option value="">Select a domain</option>{options.domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}</Select></FieldRow>
        <FieldRow label="Tags (comma separated)"><Input placeholder="research, startups, checklist" value={form.tags} onChange={(event) => setField("tags", event.target.value)} /></FieldRow>
        {error ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p> : null}
      </div>
    </Drawer>
  );
}
