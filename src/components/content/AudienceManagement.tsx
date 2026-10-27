import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { AudienceEditorDrawer } from "@/components/content/AudienceEditorDrawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";
import { AUDIENCE_BUCKETS, type Audience, type AudienceWriteInput } from "@/lib/audiences";
import { createAdminAudience, deleteAdminAudience, updateAdminAudience } from "@/lib/api";
import { adminAudiencesQueryOptions, adminQueryKeys } from "@/lib/adminQueries";

export function AudienceManagement() {
  const queryClient = useQueryClient();
  const audiencesQuery = useQuery(adminAudiencesQueryOptions());
  const audiences = audiencesQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const deferredQuery = useDeferredValue(query);
  const saveMutation = useMutation({
    mutationFn: ({ audience, input }: { audience: Audience | null; input: AudienceWriteInput }) => audience ? updateAdminAudience(audience.id, input) : createAdminAudience(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.audiences }),
  });
  const deleteMutation = useMutation({ mutationFn: deleteAdminAudience, onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.audiences }) });
  const rows = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return audiences.filter((audience) => (!bucket || audience.bucket === bucket) && (!needle || [audience.segment, audience.description, audience.bucket].some((value) => value.toLowerCase().includes(needle))));
  }, [audiences, bucket, deferredQuery]);
  const openCreate = () => { setEditingAudience(null); setEditorOpen(true); };
  const openEdit = (audience: Audience) => { setEditingAudience(audience); setEditorOpen(true); };
  const remove = (audience: Audience) => { if (window.confirm(`Delete “${audience.segment}”?`)) deleteMutation.mutate(audience.id); };

  return <div>
    <div className="mb-4 flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4" />Add audience</Button></div>
    <Card className="mb-5 p-3 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" /><input aria-label="Search audiences" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search segment or description" className="min-h-10 w-full rounded-xl border border-line bg-surface-2 py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-ruby focus:ring-2 focus:ring-ruby/25" /></div><select aria-label="Filter by audience bucket" value={bucket} onChange={(event) => setBucket(event.target.value)} className="min-h-10 rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none focus:border-ruby sm:w-56"><option value="">All buckets</option>{AUDIENCE_BUCKETS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></Card>
    <p className="mb-3 text-sm text-ink-muted">{rows.length} {rows.length === 1 ? "audience" : "audiences"}</p>
    {audiencesQuery.isError ? <Card className="p-8 text-center"><p className="font-display font-bold text-ink">Audiences could not be loaded</p><p className="mt-1 text-sm text-ink-muted">{audiencesQuery.error instanceof Error ? audiencesQuery.error.message : "Try again."}</p><Button className="mt-4" variant="secondary" onClick={() => audiencesQuery.refetch()}>Try again</Button></Card> : rows.length === 0 ? <EmptyState icon={UsersRound} title={audiences.length ? "No matching audiences" : "Start defining your audiences"} description={audiences.length ? "Try another search or bucket." : "Create a segment for students or partners."} action={!audiences.length ? <Button onClick={openCreate}><Plus className="h-4 w-4" />Add audience</Button> : undefined} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((audience) => <Card key={audience.id} className="flex min-w-0 flex-col p-4" hover><div className="flex items-start justify-between gap-3"><h2 className="min-w-0 truncate font-display text-base font-bold text-ink" title={audience.segment}>{audience.segment}</h2><Badge tone={audience.bucket === "Students" ? "info" : "ruby"}>{audience.bucket}</Badge></div><p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{audience.description}</p><div className="mt-4 flex gap-2"><Button className="flex-1" variant="secondary" size="sm" onClick={() => openEdit(audience)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="danger" aria-label={`Delete ${audience.segment}`} title="Delete audience" onClick={() => remove(audience)}><Trash2 className="h-3.5 w-3.5" /></Button></div></Card>)}</div>}
    <AudienceEditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} audience={editingAudience} onSave={async (input) => { await saveMutation.mutateAsync({ audience: editingAudience, input }); }} isSaving={saveMutation.isPending} saveError={saveMutation.error instanceof Error ? saveMutation.error.message : ""} />
    {deleteMutation.isError ? <p className="mt-4 text-sm text-bad">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Could not delete audience."}</p> : null}
  </div>;
}
