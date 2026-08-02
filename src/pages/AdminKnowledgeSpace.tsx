import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Loader2, Package, Plus, RefreshCw, Users } from "lucide-react";
import { AdminKnowledgeResourceCard } from "@/components/knowledge/AdminKnowledgeResourceCard";
import { AdminResourceEditorDrawer } from "@/components/knowledge/AdminResourceEditorDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  adminQueryKeys,
  knowledgeResourceOptionsQueryOptions,
  knowledgeResourcesQueryOptions,
  podActivationQueryOptions,
} from "@/lib/adminQueries";
import { deleteKnowledgeResource } from "@/lib/api";
import {
  groupKnowledgeResourcesByDomain,
  KNOWLEDGE_RESOURCE_DOMAINS,
  type KnowledgeResource,
  type KnowledgeResourceCategory,
} from "@/lib/knowledgeSpace/types";
import { POD_ACTIVATION_CATEGORIES } from "@/lib/podActivation/categories";
import { cn } from "@/lib/utils";

type AdminKnowledgeTab = KnowledgeResourceCategory | "pod";

const TABS: { key: AdminKnowledgeTab; label: string; icon: typeof BookOpen }[] = [
  { key: "caarya-curated", label: "Caarya Curated", icon: BookOpen },
  { key: "community", label: "Community Guides", icon: Users },
  { key: "pod", label: "Pod Contributions", icon: Package },
];

export default function AdminKnowledgeSpace() {
  const queryClient = useQueryClient();
  const resourcesQuery = useQuery(knowledgeResourcesQueryOptions());
  const optionsQuery = useQuery(knowledgeResourceOptionsQueryOptions());
  const activationQuery = useQuery(podActivationQueryOptions());
  const [activeTab, setActiveTab] = useState<AdminKnowledgeTab>("caarya-curated");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.knowledgeResources }),
  });

  const podResources = useMemo<KnowledgeResource[]>(() => (
    activationQuery.data?.artifacts.map((artifact) => {
      const categoryTitle = POD_ACTIVATION_CATEGORIES.find((category) => category.id === artifact.categoryId)?.title ?? "Activation";
      const body = typeof artifact.payload.body === "string" ? artifact.payload.body : "";
      return {
        id: `pod-${artifact.id}`,
        title: artifact.title,
        description: artifact.summary || body.slice(0, 160) || "Pod activation contribution",
        url: `/pod-activation/${artifact.collegeId}`,
        type: "in-app",
        category: "pod",
        domain: categoryTitle,
        tags: ["pod-activation", artifact.categoryId],
        curatedByName: artifact.collegeId,
        createdByCollegeId: artifact.collegeId,
        source: "pod-activation",
        canEdit: false,
        canDelete: false,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      };
    }) ?? []
  ), [activationQuery.data?.artifacts]);

  const allResources = useMemo(() => [...(resourcesQuery.data ?? []), ...podResources], [podResources, resourcesQuery.data]);
  const counts = useMemo(() => {
    const result: Record<AdminKnowledgeTab, number> = { "caarya-curated": 0, community: 0, pod: 0 };
    for (const resource of allResources) result[resource.category] += 1;
    return result;
  }, [allResources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allResources.filter((resource) => {
      if (resource.category !== activeTab) return false;
      if (domainFilter && resource.domain !== domainFilter) return false;
      if (typeFilter && resource.type !== typeFilter) return false;
      if (!normalizedSearch) return true;
      return [resource.title, resource.description, resource.domain, resource.curatedByName, resource.createdByName, resource.createdByCollegeName, resource.createdByRole, ...resource.tags]
        .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    });
  }, [activeTab, allResources, domainFilter, search, typeFilter]);

  const groupedResources = useMemo(() => groupKnowledgeResourcesByDomain(filteredResources), [filteredResources]);
  const activeQuery = activeTab === "pod" ? activationQuery : resourcesQuery;

  function openCreate() {
    setEditingResource(null);
    setEditorOpen(true);
  }

  function openEdit(resource: KnowledgeResource) {
    setEditingResource(resource);
    setEditorOpen(true);
  }

  function archiveResource(resource: KnowledgeResource) {
    if (window.confirm(`Archive “${resource.title}”?`)) deleteMutation.mutate(resource.id);
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Space"
        description="Publish Caarya resources, moderate community guides, and inspect pod contributions across the network."
        icon={BookOpen}
        actions={<Button onClick={openCreate} disabled={!optionsQuery.data?.permissions.canCreateCurated}><Plus className="h-4 w-4" />Create resource</Button>}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={cn("flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors", activeTab === tab.key ? "border-ruby text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
            <tab.icon className="h-4 w-4" />{tab.label}<span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", activeTab === tab.key ? "bg-ruby/15 text-ruby-bright" : "bg-surface-3 text-ink-faint")}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {activeTab === "pod" ? <Card className="mb-4 border-dashed p-4 text-sm text-ink-muted">Pod Contributions are sourced from Pod Activation and are read-only here.</Card> : null}

      <Card className="mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(150px,200px))]">
          <label className="grid gap-1.5"><span className="text-xs font-medium text-ink-muted">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, curator, college, role, or tag" className="min-h-[40px] rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-sm text-ink outline-none focus:border-ruby" /></label>
          <label className="grid gap-1.5"><span className="text-xs font-medium text-ink-muted">Domain</span><select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="min-h-[40px] rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-sm text-ink outline-none focus:border-ruby"><option value="">All domains</option>{KNOWLEDGE_RESOURCE_DOMAINS.map((domain) => <option key={domain} value={domain}>{domain}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-xs font-medium text-ink-muted">Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-h-[40px] rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-sm text-ink outline-none focus:border-ruby"><option value="">All types</option><option value="docs">Docs</option><option value="html">HTML</option><option value="pdf">PDF</option><option value="in-app">In-app</option></select></label>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{filteredResources.length} {filteredResources.length === 1 ? "resource" : "resources"}</p>
        <Button size="sm" variant="ghost" onClick={() => activeQuery.refetch()} disabled={activeQuery.isFetching}><RefreshCw className={cn("h-4 w-4", activeQuery.isFetching && "animate-spin")} />Refresh</Button>
      </div>

      {activeQuery.isLoading ? (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" />Loading resources…</Card>
      ) : activeQuery.isError ? (
        <Card className="p-8 text-center"><AlertCircle className="mx-auto h-6 w-6 text-bad" /><p className="mt-3 font-display font-bold text-ink">Knowledge Space could not be loaded</p><p className="mt-1 text-sm text-ink-muted">{activeQuery.error instanceof Error ? activeQuery.error.message : "Try again."}</p><Button className="mt-4" variant="secondary" onClick={() => activeQuery.refetch()}>Try again</Button></Card>
      ) : groupedResources.length ? (
        <div className="space-y-6">
          {groupedResources.map(({ domain, items }) => <section key={domain}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-xs font-bold uppercase tracking-widest text-ink-muted">{domain}</h2><span className="text-xs text-ink-faint">{items.length}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((resource) => <AdminKnowledgeResourceCard key={resource.id} resource={resource} onEdit={resource.canEdit ? () => openEdit(resource) : undefined} onDelete={resource.canDelete ? () => archiveResource(resource) : undefined} />)}</div></section>)}
        </div>
      ) : <Card className="p-10 text-center"><p className="font-display font-bold text-ink">No matching resources</p><p className="mt-1 text-sm text-ink-muted">Try another tab or filter.</p></Card>}

      {optionsQuery.data ? <AdminResourceEditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} resource={editingResource} options={optionsQuery.data} /> : null}
      {deleteMutation.isError ? <p className="mt-4 text-sm text-bad">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Could not archive the resource."}</p> : null}
    </div>
  );
}
