import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LayoutGrid, List, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input } from "@/components/ui/Field";
import { adminQueryKeys, managedPodsQueryOptions } from "@/lib/adminQueries";
import {
  createManagedPod,
  deleteManagedPod,
  updateManagedPod,
  type ManagedPod,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type PodDraft = {
  collegeName: string;
  podLeader: string;
  podTalentManager: string;
  podOutreachManager: string;
  podResearcher: string;
  podPartnerManager: string;
};

const EMPTY_DRAFT: PodDraft = {
  collegeName: "",
  podLeader: "",
  podTalentManager: "",
  podOutreachManager: "",
  podResearcher: "",
  podPartnerManager: "",
};

export default function AdminPodRegistry() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingPodId, setEditingPodId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PodDraft>(EMPTY_DRAFT);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const podsQuery = useQuery(managedPodsQueryOptions());
  const pods = podsQuery.data || [];
  const loading = podsQuery.isPending;
  const refreshing = !loading && podsQuery.isFetching;

  const derivedPodName = useMemo(() => {
    const college = draft.collegeName.trim();
    if (!college) return "Pod name will be generated from the college";
    return `${college.split(/\s+/)[0]} Pod`;
  }, [draft.collegeName]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingPodId(null);
    setDraft(EMPTY_DRAFT);
    setMessage(null);
  }

  function openEditDrawer(pod: ManagedPod) {
    setDrawerMode("edit");
    setEditingPodId(pod.id);
    setDraft({
      collegeName: pod.collegeName,
      podLeader: pod.podLeader,
      podTalentManager: pod.podTalentManager,
      podOutreachManager: pod.podOutreachManager,
      podResearcher: pod.podResearcher,
      podPartnerManager: pod.podPartnerManager,
    });
    setMessage(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerMode(null);
    setEditingPodId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (drawerMode === "create") {
        const created = await createManagedPod(draft);
        queryClient.setQueryData<ManagedPod[]>(adminQueryKeys.managedPods, (current = []) => [...current, created]);
        setMessage({ text: `Created ${created.name}.`, tone: "good" });
      } else if (drawerMode === "edit" && editingPodId) {
        const updated = await updateManagedPod(editingPodId, draft);
        queryClient.setQueryData<ManagedPod[]>(
          adminQueryKeys.managedPods,
          (current = []) => current.map((pod) => (pod.id === editingPodId ? updated : pod)),
        );
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.managedUsers });
        setMessage({ text: `Updated ${updated.name}.`, tone: "good" });
      }
      setDrawerMode(null);
      setEditingPodId(null);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not save pod.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pod: ManagedPod) {
    const confirmed = window.confirm(`Delete ${pod.name}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteManagedPod(pod.id);
      queryClient.setQueryData<ManagedPod[]>(
        adminQueryKeys.managedPods,
        (current = []) => current.filter((item) => item.id !== pod.id),
      );
      setMessage({ text: `Deleted ${pod.name}.`, tone: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete pod.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Pod Registry"
        description="Create and maintain the shared pod list that powers login, user assignment, and the demo admin registry."
        icon={Building2}
        actions={
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            Register pod
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Registered pods</p>
              <p className="text-sm text-ink-muted">{pods.length} pod{pods.length === 1 ? "" : "s"} available for assignment and login</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                    viewMode === "cards"
                      ? "bg-ruby/15 text-ruby-bright"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                  aria-pressed={viewMode === "cards"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                    viewMode === "table"
                      ? "bg-ruby/15 text-ruby-bright"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                  aria-pressed={viewMode === "table"}
                >
                  <List className="h-3.5 w-3.5" />
                  Table
                </button>
              </div>
              <Button variant="secondary" onClick={() => void podsQuery.refetch()} disabled={loading || refreshing || saving}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : (
            viewMode === "table" ? (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-base">
                    <tr className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                      <th className="border-b border-line px-5 py-3 font-medium">Pod</th>
                      <th className="border-b border-line px-5 py-3 font-medium">College</th>
                      <th className="border-b border-line px-5 py-3 font-medium">Lead</th>
                      <th className="border-b border-line px-5 py-3 font-medium">Clubs</th>
                      <th className="border-b border-line px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pods.map((pod) => (
                      <tr key={pod.id} className="align-top text-ink-muted">
                        <td className="border-b border-line px-5 py-4">
                          <p className="font-semibold text-ink">{pod.name}</p>
                        </td>
                        <td className="border-b border-line px-5 py-4 text-ink">{pod.collegeName}</td>
                        <td className="border-b border-line px-5 py-4 text-ink">{pod.podLeader}</td>
                        <td className="border-b border-line px-5 py-4 text-ink-faint">{pod.clubs.length}</td>
                        <td className="border-b border-line px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEditDrawer(pod)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => void handleDelete(pod)} disabled={saving}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pods.map((pod) => (
                  <div key={pod.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-ink">{pod.name}</p>
                      <p className="text-sm text-ink-muted">{pod.collegeName}</p>
                      <p className="text-sm text-ink-faint">
                        {pod.clubs.length} clubs linked · Lead {pod.podLeader}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditDrawer(pod)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void handleDelete(pod)} disabled={saving}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {message && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            message.tone === "good" && "border-good/30 bg-good/10 text-good",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </p>
      )}

      {!message && podsQuery.isError && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {podsQuery.error instanceof Error ? podsQuery.error.message : "Could not load pods."}
        </p>
      )}

      <Drawer
        open={Boolean(drawerMode)}
        onClose={closeDrawer}
        title={drawerMode === "edit" ? "Edit pod" : "Register pod"}
        subtitle="Clubs are intentionally left empty on creation for now and can be added later."
        width="max-w-lg"
        panelClassName="bg-[color-mix(in_srgb,var(--color-base-2)_78%,transparent)] backdrop-blur-2xl"
        bodyClassName="flex items-center"
        footerClassName="bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)] backdrop-blur-xl"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="pod-form" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : drawerMode === "edit" ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {drawerMode === "edit" ? "Save changes" : "Register pod"}
            </Button>
          </div>
        }
      >
        <div className="w-full rounded-2xl border border-line/70 bg-base/30 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="mb-5">
            <p className="font-display text-lg font-bold text-ink">{derivedPodName}</p>
            <p className="mt-1 text-sm text-ink-muted">{draft.collegeName || "Enter a college name to generate the pod display name."}</p>
          </div>

          <form id="pod-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <FieldRow label="College name">
              <Input
                value={draft.collegeName}
                onChange={(e) => setDraft((current) => ({ ...current, collegeName: e.target.value }))}
                placeholder="e.g. GITAM Vishakhapatnam"
              />
            </FieldRow>
            <FieldRow label="Pod Leader">
              <Input
                value={draft.podLeader}
                onChange={(e) => setDraft((current) => ({ ...current, podLeader: e.target.value }))}
                placeholder="Lead owner"
              />
            </FieldRow>
            <FieldRow label="Pod Talent Manager">
              <Input
                value={draft.podTalentManager}
                onChange={(e) => setDraft((current) => ({ ...current, podTalentManager: e.target.value }))}
                placeholder="Talent owner"
              />
            </FieldRow>
            <FieldRow label="Pod Outreach Manager">
              <Input
                value={draft.podOutreachManager}
                onChange={(e) => setDraft((current) => ({ ...current, podOutreachManager: e.target.value }))}
                placeholder="Outreach owner"
              />
            </FieldRow>
            <FieldRow label="Pod Researcher">
              <Input
                value={draft.podResearcher}
                onChange={(e) => setDraft((current) => ({ ...current, podResearcher: e.target.value }))}
                placeholder="Research owner"
              />
            </FieldRow>
            <FieldRow label="Pod Partner Manager">
              <Input
                value={draft.podPartnerManager}
                onChange={(e) => setDraft((current) => ({ ...current, podPartnerManager: e.target.value }))}
                placeholder="Partner owner"
              />
            </FieldRow>
          </form>
        </div>
      </Drawer>
    </div>
  );
}
