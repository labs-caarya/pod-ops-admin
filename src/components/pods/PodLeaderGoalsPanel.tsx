import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { deleteLeaderGoal, upsertLeaderGoal, type AllowedUser } from "@/lib/api";
import { adminQueryKeys } from "@/lib/adminQueries";
import {
  formatPodRole,
  normalizePodRole,
  podRoleToApiValue,
  podRoleToLabel,
  type PodRoleApi,
  type PodRoleLabel,
} from "@/lib/podRoles";
import type { PodLeaderGoal, PodLeaderGoalStatus } from "@/lib/types";
import { cn, formatDate, makeId, relativeDays } from "@/lib/utils";

type GoalDraft = {
  title: string;
  description: string;
  assigneeName: string;
  podRole: PodRoleLabel;
  status: PodLeaderGoalStatus;
  dueDate: string;
};

type LeaderWithGoals = {
  user: AllowedUser;
  role: PodRoleApi;
  goals: PodLeaderGoal[];
};

const EMPTY_DRAFT: GoalDraft = {
  title: "",
  description: "",
  assigneeName: "",
  podRole: "Exec Lead",
  status: "active",
  dueDate: "",
};

function useIsDesktopPanel() {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => setDesktop(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return desktop;
}

function isAdminUser(user: AllowedUser) {
  return user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));
}

function samePerson(left?: string, right?: string) {
  return Boolean(left?.trim() && right?.trim() && left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase());
}

function goalBelongsToLeader(goal: PodLeaderGoal, user: AllowedUser, role: PodRoleApi) {
  if (normalizePodRole(goal.assignedPodRole) !== role) return false;
  return !goal.assigneeName?.trim() || samePerson(goal.assigneeName, user.name || user.username);
}

function sortGoals(goals: PodLeaderGoal[]) {
  return [...goals].sort((left, right) => {
    if (left.status !== right.status) return left.status === "active" ? -1 : 1;
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return leftDue - rightDue || left.title.localeCompare(right.title);
  });
}

export function PodLeaderGoalsPanel({
  podId,
  podName,
  goals,
  roster,
  loading,
}: {
  podId: string;
  podName: string;
  goals: PodLeaderGoal[];
  roster: AllowedUser[];
  loading?: boolean;
}) {
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktopPanel();
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formLeader, setFormLeader] = useState<LeaderWithGoals | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "good" | "bad" } | null>(null);

  const podGoals = useMemo(() => sortGoals(goals), [goals]);

  const leaders = useMemo(() => {
    return roster
      .filter((user) => !isAdminUser(user))
      .map((user) => {
        const role = normalizePodRole(user.podRole);
        if (!role) return null;
        return {
          user,
          role,
          goals: podGoals.filter((goal) => goalBelongsToLeader(goal, user, role)),
        };
      })
      .filter(Boolean) as LeaderWithGoals[];
  }, [podGoals, roster]);

  const assignedGoalIds = useMemo(
    () => new Set(leaders.flatMap((leader) => leader.goals.map((goal) => goal.id))),
    [leaders],
  );

  const unmatchedGoals = useMemo(
    () => podGoals.filter((goal) => !assignedGoalIds.has(goal.id)),
    [assignedGoalIds, podGoals],
  );

  const sortedLeaders = useMemo(() => {
    return [...leaders].sort((left, right) => {
      const leftAssigned = left.goals.some((goal) => goal.status === "active");
      const rightAssigned = right.goals.some((goal) => goal.status === "active");
      return Number(leftAssigned) - Number(rightAssigned) || formatPodRole(left.role).localeCompare(formatPodRole(right.role));
    });
  }, [leaders]);

  const needsGoals = leaders.filter((leader) => !leader.goals.some((goal) => goal.status === "active")).length;

  function openAssignForLeader(leader: LeaderWithGoals) {
    setFormMode("create");
    setEditingGoalId(null);
    setFormLeader(leader);
    setDraft({
      ...EMPTY_DRAFT,
      assigneeName: leader.user.name || leader.user.username || "",
      podRole: podRoleToLabel(leader.role),
    });
    setFormError(null);
    setFormOpen(true);
  }

  function openEditGoal(goal: PodLeaderGoal, leader?: LeaderWithGoals | null) {
    setFormMode("edit");
    setEditingGoalId(goal.id);
    setFormLeader(leader ?? null);
    setDraft({
      title: goal.title,
      description: goal.description || "",
      assigneeName: goal.assigneeName || "",
      podRole: podRoleToLabel(goal.assignedPodRole),
      status: goal.status,
      dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : "",
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setFormMode(null);
    setEditingGoalId(null);
    setFormLeader(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  }

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };
    document.addEventListener("keydown", onKey);
    if (!isDesktop) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!isDesktop) document.body.style.overflow = "";
    };
  }, [formOpen, isDesktop]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload: PodLeaderGoal = {
        id: editingGoalId || makeId("lg"),
        collegeId: podId,
        collegeName: podName,
        assignedPodRole: podRoleToApiValue(draft.podRole),
        assigneeName: draft.assigneeName.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        status: draft.status,
        dueDate: draft.dueDate || undefined,
      };
      const saved = await upsertLeaderGoal(payload);
      queryClient.setQueryData<PodLeaderGoal[]>(adminQueryKeys.leaderGoals, (current = []) => {
        const index = current.findIndex((item) => item.id === saved.id);
        if (index < 0) return [saved, ...current];
        const next = [...current];
        next[index] = saved;
        return next;
      });
      setToast({ text: formMode === "create" ? "Sprint goal assigned." : "Sprint goal updated.", tone: "good" });
      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goal: PodLeaderGoal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;
    setSaving(true);
    try {
      await deleteLeaderGoal(goal.id);
      queryClient.setQueryData<PodLeaderGoal[]>(
        adminQueryKeys.leaderGoals,
        (current = []) => current.filter((item) => item.id !== goal.id),
      );
      setToast({ text: "Sprint goal deleted.", tone: "good" });
    } catch (error) {
      setToast({ text: error instanceof Error ? error.message : "Could not delete goal.", tone: "bad" });
    } finally {
      setSaving(false);
    }
  }

  const formTitle = formMode === "edit" ? "Edit sprint goal" : "Assign sprint goal";
  const formSubtitle = formLeader
    ? `${formLeader.user.name || formLeader.user.username || "Leader"} · ${formatPodRole(formLeader.role)}`
    : draft.assigneeName
      ? `${draft.assigneeName} · ${draft.podRole}`
      : undefined;

  const formBody = (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      {formError ? (
        <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{formError}</p>
      ) : null}
      <FieldRow label="Sprint goal">
        <Input
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          placeholder="What should they deliver this sprint?"
          required
          autoFocus
        />
      </FieldRow>
      <FieldRow label="Success criteria">
        <Textarea
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          placeholder="Optional"
          rows={3}
        />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Status">
          <Select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PodLeaderGoalStatus }))}>
            <option value="active">Active</option>
            <option value="done">Done</option>
          </Select>
        </FieldRow>
        <FieldRow label="Due">
          <Input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} />
        </FieldRow>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={closeForm} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {formMode === "create" ? "Assign" : "Save"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <Card className="relative p-4 sm:p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Leader Sprint Goals</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {loading
              ? "Loading…"
              : leaders.length
                ? `${leaders.length} leader${leaders.length === 1 ? "" : "s"}${needsGoals ? ` · ${needsGoals} need a sprint goal` : ""}`
                : "No leadership accounts linked to this pod yet."}
          </p>
        </div>

        {toast ? (
          <div
            className={cn(
              "mt-3 rounded-lg border px-3 py-2 text-sm",
              toast.tone === "good" && "border-good/30 bg-good/10 text-good",
              toast.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            )}
          >
            {toast.text}
          </div>
        ) : null}

        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading sprint goals…</p> : null}

        {!loading && leaders.length ? (
          <ul className="mt-4 space-y-2">
            {sortedLeaders.map((leader) => {
              const activeGoals = leader.goals.filter((goal) => goal.status === "active");
              const hasActive = activeGoals.length > 0;
              return (
                <li
                  key={leader.user.id || `${podId}-${leader.role}-${leader.user.name}`}
                  className={cn("overflow-hidden rounded-xl border bg-surface-2", hasActive ? "border-line" : "border-amber-bright/30")}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", hasActive ? "bg-ruby/10 text-ruby-bright" : "bg-surface-3 text-ink-muted")}>
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{leader.user.name || leader.user.username || "Unnamed leader"}</p>
                      <p className="text-xs text-ink-faint">{formatPodRole(leader.role)}</p>
                    </div>
                    {!hasActive ? (
                      <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => openAssignForLeader(leader)} disabled={saving}>
                        Assign sprint goal
                      </Button>
                    ) : null}
                  </div>
                  {leader.goals.length ? (
                    <div className="divide-y divide-line border-t border-line">
                      {leader.goals.map((goal) => (
                        <GoalRow
                          key={goal.id}
                          goal={goal}
                          saving={saving}
                          onEdit={() => openEditGoal(goal, leader)}
                          onDelete={(item) => void handleDelete(item)}
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && !leaders.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center">
            <UsersRound className="mx-auto h-5 w-5 text-ink-faint" />
            <p className="mt-2 text-sm text-ink-muted">Add leadership accounts to assign sprint goals by person.</p>
          </div>
        ) : null}

        {!loading && unmatchedGoals.length ? (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Unmatched</p>
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface-2">
              {unmatchedGoals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  saving={saving}
                  onEdit={() => openEditGoal(goal)}
                  onDelete={(item) => void handleDelete(item)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {formOpen && isDesktop ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] p-4">
            <div className="absolute inset-0 rounded-[inherit] bg-black/45 backdrop-blur-[2px]" onClick={closeForm} aria-hidden="true" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={formTitle}
              className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-base-2 p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-ink">{formTitle}</h3>
                  {formSubtitle ? <p className="mt-0.5 truncate text-xs text-ink-muted">{formSubtitle}</p> : null}
                </div>
                <button type="button" aria-label="Close" onClick={closeForm} className="focus-ring rounded-lg p-1 text-ink-muted hover:bg-surface-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {formBody}
            </div>
          </div>
        ) : null}
      </Card>

      {formOpen && !isDesktop
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end">
              <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={closeForm} aria-hidden="true" />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={formTitle}
                className="relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-line bg-base-2 shadow-2xl animate-[slideup_0.22s_ease]"
                style={{ animationFillMode: "both" }}
              >
                <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-ink">{formTitle}</h3>
                    {formSubtitle ? <p className="mt-0.5 truncate text-xs text-ink-muted">{formSubtitle}</p> : null}
                  </div>
                  <button type="button" aria-label="Close" onClick={closeForm} className="focus-ring rounded-lg p-1 text-ink-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto px-4 py-4">{formBody}</div>
              </div>
              <style>{`@keyframes slideup { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function GoalRow({
  goal,
  saving,
  onEdit,
  onDelete,
}: {
  goal: PodLeaderGoal;
  saving: boolean;
  onEdit: () => void;
  onDelete: (goal: PodLeaderGoal) => void;
}) {
  const daysUntilDue = relativeDays(goal.dueDate);
  const overdue = goal.status === "active" && daysUntilDue !== null && daysUntilDue < 0;
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 sm:px-4">
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", goal.status === "done" ? "text-good" : overdue ? "text-bad" : "text-ink-faint")}>
        {goal.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-ink">{goal.title}</p>
          <Badge tone={goal.status === "done" ? "good" : overdue ? "bad" : "amber"} className="text-[10px]">
            {goal.status === "done" ? "Done" : overdue ? "Overdue" : "Active"}
          </Badge>
        </div>
        {goal.dueDate ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
            <CalendarClock className="h-3 w-3" /> {formatDate(goal.dueDate)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${goal.title}`} onClick={onEdit} disabled={saving}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-bad" aria-label={`Delete ${goal.title}`} onClick={() => onDelete(goal)} disabled={saving}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
