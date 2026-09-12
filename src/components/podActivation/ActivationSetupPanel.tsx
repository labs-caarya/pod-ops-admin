import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpenCheck, Loader2, Plus, RefreshCw } from "lucide-react";
import { ActivationResourceCard } from "@/components/podActivation/ActivationResourceCard";
import { ActivationResourceEditorDrawer } from "@/components/podActivation/ActivationResourceEditorDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { adminQueryKeys, activationKnowledgeResourcesQueryOptions } from "@/lib/adminQueries";
import { deleteKnowledgeResource } from "@/lib/api";
import { LEARN_SECTIONS, getLearnSection } from "@/lib/podActivation/activationLearning";
import { POD_ROLES, type PodRoleApi } from "@/lib/podRoles";
import type { KnowledgeResource } from "@/lib/knowledgeSpace/types";
import { cn } from "@/lib/utils";

export function ActivationSetupPanel() {
  const queryClient = useQueryClient();
  const resourcesQuery = useQuery(activationKnowledgeResourcesQueryOptions());
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);

  const archiveMutation = useMutation({ mutationFn: deleteKnowledgeResource, onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.activationKnowledgeResources }) });
  const resources = resourcesQuery.data ?? [];

  const filteredResources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const activation = resource.activation;
      if (!activation) return false;
      if (sectionFilter && activation.sectionKey !== sectionFilter) return false;
      if (statusFilter === "published" && !activation.published) return false;
      if (statusFilter === "draft" && activation.published) return false;
      if (roleFilter === "common" && activation.audienceType !== "common") return false;
      if (roleFilter && roleFilter !== "common" && !activation.roleIds.includes(roleFilter as PodRoleApi)) return false;
      if (!needle) return true;
      return [resource.title, resource.description, resource.content, resource.url, ...resource.tags].some((value) => String(value || "").toLowerCase().includes(needle));
    }).sort((left, right) => (left.activation?.rank ?? 0) - (right.activation?.rank ?? 0) || left.title.localeCompare(right.title));
  }, [resources, roleFilter, search, sectionFilter, statusFilter]);

  const groupedResources = useMemo(() => {
    const groups = new Map<string, KnowledgeResource[]>();
    for (const resource of filteredResources) {
      const key = resource.activation?.sectionKey || "other";
      groups.set(key, [...(groups.get(key) ?? []), resource]);
    }
    return Array.from(groups.entries()).sort(([left], [right]) => (getLearnSection(left)?.rank ?? 9999) - (getLearnSection(right)?.rank ?? 9999));
  }, [filteredResources]);

  const hasActiveFilters = Boolean(search.trim() || sectionFilter || roleFilter || statusFilter);
  const publishedCount = resources.filter((resource) => resource.activation?.published).length;
  const roleBasedCount = resources.filter((resource) => resource.activation?.audienceType === "role").length;

  function clearFilters() { setSearch(""); setSectionFilter(""); setRoleFilter(""); setStatusFilter(""); }
  function openCreate() { setEditingResource(null); setEditorOpen(true); }
  function openEdit(resource: KnowledgeResource) { setEditingResource(resource); setEditorOpen(true); }
  function archiveResource(resource: KnowledgeResource) { if (window.confirm('Archive “' + resource.title + '” from Activation Setup?')) archiveMutation.mutate(resource.id); }

  const filters = <><FieldRow label="Search"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, description, tag, or URL" /></FieldRow><FieldRow label="Learn section"><Select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}><option value="">All sections</option>{LEARN_SECTIONS.map((section) => <option key={section.key} value={section.key}>{section.title}</option>)}</Select></FieldRow><FieldRow label="Audience"><Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All audiences</option><option value="common">Common</option>{POD_ROLES.map((role) => <option key={role.apiValue} value={role.apiValue}>{role.label}</option>)}</Select></FieldRow><FieldRow label="Status"><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></Select></FieldRow></>;

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-ruby" /><h2 className="font-display text-lg font-bold text-ink">Activation Setup · Learn</h2></div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-muted">Manage Stage 1 resources from Pod Activation. They are stored with activation scope in the backend, but admins do not create them through Knowledge Space.</p>
          </div>
          <div className="flex items-center gap-2"><Button type="button" variant="ghost" size="icon" onClick={() => resourcesQuery.refetch()} disabled={resourcesQuery.isFetching} aria-label="Refresh activation resources"><RefreshCw className={cn("h-4 w-4", resourcesQuery.isFetching && "animate-spin")} /></Button><Button type="button" onClick={openCreate}><Plus className="h-4 w-4" />Add resource</Button></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-line bg-surface px-3 py-2"><p className="text-xs text-ink-faint">Total resources</p><p className="font-display text-xl font-black text-ink">{resources.length}</p></div><div className="rounded-lg border border-line bg-surface px-3 py-2"><p className="text-xs text-ink-faint">Published</p><p className="font-display text-xl font-black text-ink">{publishedCount}</p></div><div className="rounded-lg border border-line bg-surface px-3 py-2"><p className="text-xs text-ink-faint">Role-based</p><p className="font-display text-xl font-black text-ink">{roleBasedCount}</p></div></div>
      </Card>

      <Card className="hidden shrink-0 p-4 lg:block"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(150px,220px))]">{filters}</div></Card>
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-ink-muted">{filteredResources.length} {filteredResources.length === 1 ? "resource" : "resources"}</p><MobileFilterDrawer open={filterDrawerOpen} onOpen={() => setFilterDrawerOpen(true)} onClose={() => setFilterDrawerOpen(false)} active={hasActiveFilters} title="Activation setup filters" triggerLabel="Open activation setup filters" onClear={clearFilters}>{filters}</MobileFilterDrawer></div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {resourcesQuery.isLoading ? <Card className="flex items-center justify-center gap-2 p-10 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" />Loading activation resources...</Card> : resourcesQuery.isError ? <Card className="p-8 text-center"><AlertCircle className="mx-auto h-6 w-6 text-bad" /><p className="mt-3 font-display font-bold text-ink">Activation setup could not be loaded</p><p className="mt-1 text-sm text-ink-muted">{resourcesQuery.error instanceof Error ? resourcesQuery.error.message : "Try again."}</p><Button className="mt-4" variant="secondary" onClick={() => resourcesQuery.refetch()}>Try again</Button></Card> : groupedResources.length ? <div className="space-y-6">{groupedResources.map(([sectionKey, items]) => { const section = getLearnSection(sectionKey); return <section key={sectionKey}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">{section?.title || sectionKey}</h3>{section?.description ? <p className="mt-1 text-xs text-ink-faint">{section.description}</p> : null}</div><span className="text-xs text-ink-faint">{items.length}</span></div><div className="grid gap-3 xl:grid-cols-2">{items.map((resource, index) => <ActivationResourceCard key={resource.id} resource={resource} positionLabel={(index + 1) + " of " + items.length} onEdit={() => openEdit(resource)} onArchive={() => archiveResource(resource)} />)}</div></section>; })}</div> : <Card className="p-10 text-center"><p className="font-display font-bold text-ink">No activation resources yet</p><p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">Use the Add resource button in the setup header to create the first Learn resource for Stage 1 activation.</p></Card>}
      </div>

      <ActivationResourceEditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} resource={editingResource} resources={resources} />
      {archiveMutation.isError ? <p className="text-sm text-bad">{archiveMutation.error instanceof Error ? archiveMutation.error.message : "Could not archive activation resource."}</p> : null}
    </section>
  );
}
