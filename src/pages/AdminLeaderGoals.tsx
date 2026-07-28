import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { deleteLeaderGoal, upsertLeaderGoal } from "@/lib/api";
import { adminQueryKeys, collegesQueryOptions, leaderGoalsQueryOptions } from "@/lib/adminQueries";
import {
  formatPodRole,
  POD_ROLE_OPTIONS,
  podRoleToApiValue,
  podRoleToLabel,
  type PodRoleLabel,
} from "@/lib/podRoles";
import type { PodLeaderGoal, PodLeaderGoalStatus } from "@/lib/types";
import { formatDate, makeId } from "@/lib/utils";
import { cn } from "@/lib/utils";

type GoalDraft = {
  title: string;
  description: string;
  assigneeName: string;
  podId: string;
  podRole: PodRoleLabel;
  status: PodLeaderGoalStatus;
  dueDate: string;
};

const DEFAULT_ROLE: PodRoleLabel = "Exec Lead";

const EMPTY_DRAFT: GoalDraft = {
  title: "",
  description: "",
  assigneeName: "",
  podId: "",
  podRole: DEFAULT_ROLE,
  status: "active",
  dueDate: "",
};

function podLabel(podId: string, podName?: string, pods: { id: string; name: string; crew: string }[] = []) {
  if (!podId) return podName || "All pods";
  const pod = pods.find((item) => item.id === podId);
  return pod ? `${pod.name} · ${pod.crew}` : podName || podId;
}

export default function AdminLeaderGoals() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(EMPTY_DRAFT);
  const [podFilter, setPodFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | PodLeaderGoalStatus>("");
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const goalsQuery = useQuery(leaderGoalsQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const goals = goalsQuery.data || [];
  const pods = collegesQuery.data || [];
  const loading = goalsQuery.isPending || collegesQuery.isPending;
  const refreshing = !loading && (goalsQuery.isFetching || collegesQuery.isFetching);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (podFilter && goal.podId !== podFilter) return false;
      if (roleFilter && goal.assignedPodRole !== roleFilter) return false;
      if (statusFilter && goal.status !== statusFilter) return false;
      return true;
    });
  }, [goals, podFilter, roleFilter, statusFilter]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingGoalId(null);
    setDraft(EMPTY_DRAFT);
    setMessage(null);
  }

  function openEditDrawer(goal: PodLeaderGoal) {
    setDrawerMode("edit");
    setEditingGoalId(goal.id);
    setDraft({
      title: goal.title,
      description: goal.description || "",
      assigneeName: goal.assigneeName || "",
      podId: goal.podId || "",
      podRole: podRoleToLabel(goal.assignedPodRole),
      status: goal.status,
      dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : "",
    });
    setMessage(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerMode(null);
    setEditingGoalId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setMessage({ text: "Title is required.", tone: "bad" });
      return;
    }

    setSaving(true);
    try {
      const selectedPod = pods.find((pod) => pod.id === draft.podId);
      const payload: PodLeaderGoal = {
        id: editingGoalId || makeId("lg"),
        podId: draft.podId,
        podName: draft.podId ? selectedPod?.name : "All pods",
        assignedPodRole: podRoleToApiValue(draft.podRole),
        assigneeName: draft.assigneeName.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        status: draft.status,
        dueDate: draft.dueDate || undefined,
      };
      const saved = await upsertLeaderGoal(payload);
      queryClient.setQueryData<PodLeaderGoal[]>(adminQueryKeys.leaderGoals, (current = []) => {
        const idx = current.findIndex((item) => item.id === saved.id);
        if (idx >= 0) {
          const next = [...current];
          next[idx] = saved;
          return next;
        }
        return [saved, ...current];
      });
      setMessage({ text: drawerMode === "create" ? "Goal created." : "Goal updated.", tone: "good" });
      closeDrawer();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not save goal.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goal: PodLeaderGoal) {
    const confirmed = window.confirm(`Delete "${goal.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteLeaderGoal(goal.id);
      queryClient.setQueryData<PodLeaderGoal[]>(
        adminQueryKeys.leaderGoals,
        (current = []) => current.filter((item) => item.id !== goal.id),
      );
      setMessage({ text: "Goal deleted.", tone: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete goal.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Leader goals"
        description="Assign focus goals to pod leadership roles. Active goals appear on each leader's dashboard under Currently working on."
        icon={ClipboardList}
        actions={
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            Add goal
          </Button>
        }
      />

      {message && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.tone === "good" && "border-good/30 bg-good/10 text-good",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </div>
      )}

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Assigned goals</p>
              <p className="text-sm text-ink-muted">
                {loading && !goals.length
                  ? "Loading goals…"
                  : `${filteredGoals.length} goal${filteredGoals.length === 1 ? "" : "s"} shown`}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void Promise.all([goalsQuery.refetch(), collegesQuery.refetch()])}
              disabled={loading || refreshing || saving}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <Select value={podFilter} onChange={(e) => setPodFilter(e.target.value)} className="w-full sm:w-56">
              <option value="">All pods</option>
              {pods.map((pod) => (
                <option key={pod.id} value={pod.id}>
                  {pod.name} · {pod.crew}
                </option>
              ))}
            </Select>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-56">
              <option value="">All roles</option>
              {POD_ROLE_OPTIONS.map((role) => (
                <option key={role} value={podRoleToApiValue(role)}>
                  {role}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | PodLeaderGoalStatus)}
              className="w-full sm:w-40"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </Select>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading && !goals.length ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-ruby-bright" />
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-ink">No leader goals yet</p>
                <p className="mt-1 text-sm text-ink-muted">Create a goal and assign it to a pod leadership role.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {filteredGoals.map((goal) => (
                    <Card key={goal.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-ink">{goal.title}</p>
                          {goal.description && (
                            <p className="mt-1 text-sm text-ink-muted">{goal.description}</p>
                          )}
                        </div>
                        <Badge tone={goal.status === "active" ? "amber" : "good"} className="shrink-0">
                          {goal.status === "active" ? "Active" : "Done"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-ink-faint">Assignee</span>
                          <div className="text-right">
                            <p className="font-medium text-ink">{goal.assigneeName || "—"}</p>
                            <Badge tone="ruby" className="mt-1">{formatPodRole(goal.assignedPodRole)}</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-ink-faint">Pod</span>
                          <span className="text-right text-ink-muted">
                            {podLabel(goal.podId, goal.podName, pods)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-ink-faint">Due</span>
                          <span className="text-ink-muted">
                            {goal.dueDate ? formatDate(goal.dueDate) : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditDrawer(goal)} disabled={saving}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => void handleDelete(goal)} disabled={saving}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <table className="hidden w-full min-w-[760px] text-left text-sm md:table">
                <thead className="sticky top-0 bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
                  <tr className="border-b border-line">
                    <th className="px-5 py-3 font-medium">Goal</th>
                    <th className="px-5 py-3 font-medium">Assignee</th>
                    <th className="px-5 py-3 font-medium">Pod</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr key={goal.id} className="border-b border-line/70 hover:bg-surface-2/60">
                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-ink">{goal.title}</p>
                        {goal.description && (
                          <p className="mt-1 max-w-md text-xs text-ink-muted">{goal.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-ink">{goal.assigneeName || "—"}</p>
                        <Badge tone="ruby" className="mt-1">{formatPodRole(goal.assignedPodRole)}</Badge>
                      </td>
                      <td className="px-5 py-4 align-top text-ink-muted">
                        {podLabel(goal.podId, goal.podName, pods)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge tone={goal.status === "active" ? "amber" : "good"}>
                          {goal.status === "active" ? "Active" : "Done"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top text-ink-muted">
                        {goal.dueDate ? formatDate(goal.dueDate) : "—"}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditDrawer(goal)} disabled={saving}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => void handleDelete(goal)} disabled={saving}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </Card>

      <Drawer
        open={drawerMode !== null}
        onClose={closeDrawer}
        title={drawerMode === "create" ? "Add leader goal" : "Edit leader goal"}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <FieldRow label="Title">
            <Input
              value={draft.title}
              onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
              placeholder="What should this leader focus on?"
              required
            />
          </FieldRow>
          <FieldRow label="Assignee name">
            <Input
              value={draft.assigneeName}
              onChange={(e) => setDraft((current) => ({ ...current, assigneeName: e.target.value }))}
              placeholder="Who is responsible for this goal?"
            />
          </FieldRow>
          <FieldRow label="Description">
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
              placeholder="Optional context or success criteria"
            />
          </FieldRow>
          <FieldRow label="Pod">
            <Select
              value={draft.podId}
              onChange={(e) => setDraft((current) => ({ ...current, podId: e.target.value }))}
            >
              <option value="">All pods</option>
              {pods.map((pod) => (
                <option key={pod.id} value={pod.id}>
                  {pod.name} · {pod.crew}
                </option>
              ))}
            </Select>
          </FieldRow>
          <FieldRow label="Leadership role">
            <Select
              value={draft.podRole}
              onChange={(e) => setDraft((current) => ({ ...current, podRole: e.target.value as PodRoleLabel }))}
            >
              {POD_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </FieldRow>
          <FieldRow label="Status">
            <Select
              value={draft.status}
              onChange={(e) =>
                setDraft((current) => ({ ...current, status: e.target.value as PodLeaderGoalStatus }))
              }
            >
              <option value="active">Active</option>
              <option value="done">Done</option>
            </Select>
          </FieldRow>
          <FieldRow label="Due date">
            <Input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((current) => ({ ...current, dueDate: e.target.value }))}
            />
          </FieldRow>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {drawerMode === "create" ? "Create goal" : "Save changes"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
