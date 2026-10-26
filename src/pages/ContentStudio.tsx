import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, FileText, Plus, Search, Tags, Trash2 } from "lucide-react";
import { ContentEditorDrawer } from "@/components/content/ContentEditorDrawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { CONTENT_BUCKETS, type ContentItem, type ContentWriteInput } from "@/lib/content";
import { createAdminContent, deleteAdminContent, updateAdminContent } from "@/lib/api";
import { adminContentQueryOptions, adminQueryKeys } from "@/lib/adminQueries";

export default function ContentStudio() {
  const queryClient = useQueryClient();
  const contentQuery = useQuery(adminContentQueryOptions());
  const content = contentQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ item, input }: { item: ContentItem | null; input: ContentWriteInput }) => item ? updateAdminContent(item.id, input) : createAdminContent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.content }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminContent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.content }),
  });

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return content.filter((item) => {
      if (bucket && item.bucket !== bucket) return false;
      if (!needle) return true;
      return [item.name, item.description, item.type, item.platform, item.bucket, item.pillar, item.marketingType, ...item.topicClusters, ...item.tags]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [bucket, content, query]);

  function openCreate() { setEditingItem(null); setEditorOpen(true); }
  function openEdit(item: ContentItem) { setEditingItem(item); setEditorOpen(true); }
  function remove(item: ContentItem) { if (window.confirm(`Delete “${item.name}”?`)) deleteMutation.mutate(item.id); }
  async function save(input: ContentWriteInput) { await saveMutation.mutateAsync({ item: editingItem, input }); }

  return (
    <div>
      <PageHeader icon={FileText} title="Content Studio" description="Plan and organize the social content pipeline across platforms, pillars, and marketing motions."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add content</Button>} />

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" /><input aria-label="Search content" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, platform, pillar, topic, or tag" className="min-h-10 w-full rounded-xl border border-line bg-surface-2 py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-ruby focus:ring-2 focus:ring-ruby/25" /></div>
          <select aria-label="Filter by content bucket" value={bucket} onChange={(event) => setBucket(event.target.value)} className="min-h-10 rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none focus:border-ruby sm:w-56"><option value="">All buckets</option>{CONTENT_BUCKETS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between"><p className="text-sm text-ink-muted">{rows.length} {rows.length === 1 ? "content item" : "content items"}</p></div>
      {contentQuery.isError ? <Card className="p-8 text-center"><p className="font-display font-bold text-ink">Content could not be loaded</p><p className="mt-1 text-sm text-ink-muted">{contentQuery.error instanceof Error ? contentQuery.error.message : "Try again."}</p><Button className="mt-4" variant="secondary" onClick={() => contentQuery.refetch()}>Try again</Button></Card> : rows.length === 0 ? <EmptyState icon={FileText} title={content.length ? "No matching content" : "Your content calendar starts here"} description={content.length ? "Try another search or bucket." : "Add the first item to begin organizing the content pipeline."} action={!content.length ? <Button onClick={openCreate}><Plus className="h-4 w-4" />Add content</Button> : undefined} /> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((item) => <Card key={item.id} className="flex min-w-0 flex-col p-4" hover>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-display text-base font-bold text-ink" title={item.name}>{item.name}</h2><p className="mt-1 text-xs text-ink-muted">{item.type} · {item.platform}</p></div><Badge tone="ruby">{item.bucket}</Badge></div>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs"><p className="truncate text-ink-muted"><span className="text-ink-faint">Pillar · </span>{item.pillar}</p><p className="truncate text-ink-muted"><span className="text-ink-faint">Marketing · </span>{item.marketingType}</p>{item.topicClusters.length ? <div className="flex flex-wrap gap-1.5">{item.topicClusters.map((topic) => <Badge key={topic} tone="info">{topic}</Badge>)}</div> : null}{item.tags.length ? <div className="flex flex-wrap gap-1.5">{item.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 text-ink-faint"><Tags className="h-3 w-3" />{tag}</span>)}</div> : null}</div>
          <div className="mt-4 flex gap-2"><Button className="flex-1" variant="secondary" size="sm" onClick={() => openEdit(item)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="danger" aria-label={`Delete ${item.name}`} title="Delete content" onClick={() => remove(item)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
        </Card>)}</div>}
      <ContentEditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} item={editingItem} onSave={save} isSaving={saveMutation.isPending} saveError={saveMutation.error instanceof Error ? saveMutation.error.message : ""} />
      {deleteMutation.isError ? <p className="mt-4 text-sm text-bad">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Could not delete content."}</p> : null}
    </div>
  );
}
