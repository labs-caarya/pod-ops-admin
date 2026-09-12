import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { createActivationKnowledgeResource, updateActivationKnowledgeResource } from "@/lib/api";
import { adminQueryKeys } from "@/lib/adminQueries";
import {
  LEARN_SECTIONS,
  getLearnSection,
  type ActivationAudienceType,
  type ActivationContentMode,
  type ActivationKnowledgeResourceInput,
  type ActivationMediaType,
  type ActivationProvider,
  type LearnSectionKey,
} from "@/lib/podActivation/activationLearning";
import { POD_ROLES, type PodRoleApi } from "@/lib/podRoles";
import type { KnowledgeResource } from "@/lib/knowledgeSpace/types";

interface FormState {
  title: string;
  description: string;
  sectionKey: LearnSectionKey | string;
  position: string;
  audienceType: ActivationAudienceType;
  roleIds: PodRoleApi[];
  required: boolean;
  published: boolean;
  contentMode: ActivationContentMode;
  mediaType: ActivationMediaType;
  url: string;
  content: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  sectionKey: LEARN_SECTIONS[0].key,
  position: "1",
  audienceType: "common",
  roleIds: [],
  required: true,
  published: true,
  contentMode: "external",
  mediaType: "text",
  url: "",
  content: "",
  tags: "",
};

function inferProvider(url: string, contentMode: ActivationContentMode): ActivationProvider {
  if (contentMode === "inline-text") return "inline-text";
  const normalized = url.toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  if (normalized.includes("spotify.com")) return "spotify";
  if (normalized.includes("docs.google.com")) return "google-docs";
  if (normalized.includes("notion.site") || normalized.includes("notion.so")) return "notion";
  if (normalized.includes("loom.com")) return "loom";
  if (normalized.includes("vimeo.com")) return "vimeo";
  return "external";
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function sortByRank(resources: KnowledgeResource[]) {
  return [...resources].sort((left, right) => (left.activation?.rank ?? 0) - (right.activation?.rank ?? 0) || left.title.localeCompare(right.title));
}

function sectionItems(resources: KnowledgeResource[], sectionKey: string) {
  return sortByRank(resources.filter((item) => item.activation?.sectionKey === sectionKey));
}

function ordinal(value: number) {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? "st" : value % 10 === 2 && value % 100 !== 12 ? "nd" : value % 10 === 3 && value % 100 !== 13 ? "rd" : "th";
  return value + suffix;
}

function buildInitialForm(resource: KnowledgeResource | null, resources: KnowledgeResource[]): FormState {
  if (!resource?.activation) {
    const firstSection = LEARN_SECTIONS[0].key;
    return { ...EMPTY_FORM, position: String(sectionItems(resources, firstSection).length + 1) };
  }
  const items = sectionItems(resources, resource.activation.sectionKey);
  const index = Math.max(0, items.findIndex((item) => item.id === resource.id));
  return {
    title: resource.title,
    description: resource.description,
    sectionKey: resource.activation.sectionKey,
    position: String(index + 1),
    audienceType: resource.activation.audienceType,
    roleIds: resource.activation.roleIds,
    required: resource.activation.required,
    published: resource.activation.published,
    contentMode: resource.activation.contentMode,
    mediaType: resource.activation.mediaType,
    url: resource.url || "",
    content: resource.content || "",
    tags: resource.tags.join(", "),
  };
}

export function ActivationResourceEditorDrawer({
  open,
  onClose,
  resource,
  resources,
}: {
  open: boolean;
  onClose: () => void;
  resource: KnowledgeResource | null;
  resources: KnowledgeResource[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(buildInitialForm(resource, resources));
  }, [open, resource, resources]);

  const selectedSection = useMemo(() => getLearnSection(form.sectionKey), [form.sectionKey]);
  const positionOptions = useMemo(() => {
    const itemCount = sectionItems(resources, form.sectionKey).filter((item) => item.id !== resource?.id).length;
    return Array.from({ length: itemCount + 1 }, (_, index) => index + 1);
  }, [form.sectionKey, resource?.id, resources]);

  const saveMutation = useMutation({
    mutationFn: async (input: ActivationKnowledgeResourceInput) => resource ? updateActivationKnowledgeResource(resource.id, input) : createActivationKnowledgeResource(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.activationKnowledgeResources });
      onClose();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Could not save activation resource."),
  });

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "sectionKey") {
        const count = sectionItems(resources, String(value)).filter((item) => item.id !== resource?.id).length;
        next.position = String(count + 1);
      }
      if (field === "audienceType" && value === "common") next.roleIds = [];
      return next;
    });
  }

  function toggleRole(roleId: PodRoleApi) {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId) ? current.roleIds.filter((item) => item !== roleId) : [...current.roleIds, roleId],
    }));
  }

  function submit() {
    setError("");
    const title = form.title.trim();
    const description = form.description.trim();
    const url = normalizeExternalUrl(form.url);
    const content = form.content.trim();
    const position = Math.max(1, Number(form.position || 1));
    const baseRank = selectedSection?.rank ?? 0;
    const rank = baseRank + position * 10;

    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }
    if (form.contentMode === "external" && !url) {
      setError("Add a URL or switch the resource to simple text.");
      return;
    }
    if (form.contentMode === "inline-text" && !content) {
      setError("Simple text resources need content.");
      return;
    }
    if (form.audienceType === "role" && form.roleIds.length === 0) {
      setError("Choose at least one role for a role-based resource.");
      return;
    }

    saveMutation.mutate({
      title,
      description,
      url,
      type: "docs",
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      content,
      activation: {
        stage: "learn",
        sectionKey: form.sectionKey,
        audienceType: form.audienceType,
        roleIds: form.audienceType === "role" ? form.roleIds : [],
        rank,
        required: form.required,
        contentMode: form.contentMode,
        mediaType: form.mediaType,
        provider: inferProvider(url, form.contentMode),
        published: form.published,
      },
    });
  }

  return (
    <Drawer open={open} onClose={onClose} title={resource ? "Edit activation resource" : "Add activation resource"} subtitle="This appears in Activation Setup and is stored as an activation-scoped knowledge resource." width="max-w-2xl" footer={<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button><Button type="button" onClick={submit} disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save resource</Button></div>}>
      <div className="space-y-4">
        <FieldRow label="Title"><Input value={form.title} onChange={(event) => setField("title", event.target.value)} /></FieldRow>
        <FieldRow label="Description"><Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} /></FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Learn section"><Select value={form.sectionKey} onChange={(event) => setField("sectionKey", event.target.value)}>{LEARN_SECTIONS.map((section) => <option key={section.key} value={section.key}>{section.title}</option>)}</Select></FieldRow>
          <FieldRow label="Position in section"><Select value={form.position} onChange={(event) => setField("position", event.target.value)}>{positionOptions.map((position) => <option key={position} value={position}>{ordinal(position)} position</option>)}</Select></FieldRow>
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><FieldRow label="Audience"><Select value={form.audienceType} onChange={(event) => setField("audienceType", event.target.value as ActivationAudienceType)}><option value="common">Common for all roles</option><option value="role">Role-based</option></Select></FieldRow><FieldRow label="Media type"><Select value={form.mediaType} onChange={(event) => setField("mediaType", event.target.value as ActivationMediaType)}><option value="text">Text</option><option value="audio">Audio</option><option value="video">Video</option></Select></FieldRow></div>
        {form.audienceType === "role" ? <div><span className="mb-2 block text-xs font-medium text-ink-muted">Roles</span><div className="grid gap-2 sm:grid-cols-2">{POD_ROLES.map((role) => <label key={role.apiValue} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted"><input type="checkbox" checked={form.roleIds.includes(role.apiValue)} onChange={() => toggleRole(role.apiValue)} />{role.label}</label>)}</div></div> : null}
        <div className="grid gap-4 sm:grid-cols-2"><FieldRow label="Content mode"><Select value={form.contentMode} onChange={(event) => setField("contentMode", event.target.value as ActivationContentMode)}><option value="external">External link / embed</option><option value="inline-text">Simple text</option></Select></FieldRow><FieldRow label="Status"><Select value={form.published ? "published" : "draft"} onChange={(event) => setField("published", event.target.value === "published")}><option value="published">Published</option><option value="draft">Draft</option></Select></FieldRow></div>
        {form.contentMode === "external" ? <FieldRow label="URL"><Input type="url" placeholder="YouTube, Google Doc, Notion, Spotify, Loom, Vimeo, or external URL" value={form.url} onChange={(event) => setField("url", event.target.value)} /></FieldRow> : <FieldRow label="Simple text"><Textarea className="min-h-[160px]" value={form.content} onChange={(event) => setField("content", event.target.value)} /></FieldRow>}
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted"><input type="checkbox" checked={form.required} onChange={(event) => setField("required", event.target.checked)} />Required for Learn completion</label>
        <FieldRow label="Tags (comma separated)"><Input placeholder="pods, onboarding, role-training" value={form.tags} onChange={(event) => setField("tags", event.target.value)} /></FieldRow>
        {error ? <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p> : null}
      </div>
    </Drawer>
  );
}
