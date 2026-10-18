import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { deleteLeaderGoal, upsertLeaderGoal, type AllowedUser, type College } from "@/lib/api";
import {
  adminQueryKeys,
  collegesQueryOptions,
  leaderGoalsQueryOptions,
  managedUsersQueryOptions,
} from "@/lib/adminQueries";
import {
  formatPodRole,
  normalizePodRole,
  POD_ROLE_OPTIONS,
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
  collegeId: string;
  podRole: PodRoleLabel;
  status: PodLeaderGoalStatus;
  dueDate: string;
};

type LeaderWithGoals = {
  user: AllowedUser;
  role: PodRoleApi;
  goals: PodLeaderGoal[];
};

type PodGoalOverview = {
  college: College;
  leaders: LeaderWithGoals[];
  goals: PodLeaderGoal[];
  unassignedLeaders: LeaderWithGoals[];
  activeGoalCount: number;
  completedGoalCount: number;
  coverage: number;
  unmatchedGoals: PodLeaderGoal[];
};

const DEFAULT_ROLE: PodRoleLabel = "Exec Lead";

const EMPTY_DRAFT: GoalDraft = {
  title: "",
  description: "",
  assigneeName: "",
  collegeId: "",
  podRole: DEFAULT_ROLE,
  status: "active",
  dueDate: "",
};

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

export default function AdminLeaderGoals() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(EMPTY_DRAFT);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const goalsQuery = useQuery(leaderGoalsQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const usersQuery = useQuery(managedUsersQueryOptions());
  const goals = goalsQuery.data || [];
  const users = usersQuery.data || [];
  const colleges = useMemo(() => (collegesQuery.data || []).filter((college) => college.isPod), [collegesQuery.data]);
  const loading = goalsQuery.isPending || collegesQuery.isPending || usersQuery.isPending;
  const refreshing = !loading && (goalsQuery.isFetching || collegesQuery.isFetching || usersQuery.isFetching);

  const podOverviews = useMemo<PodGoalOverview[]>(() => {
    return colleges
      .map((college) => {
        const podGoals = sortGoals(goals.filter((goal) => goal.collegeId === college.id));
        const podUsers = users
          .filter((user) => user.isActive !== false && !isAdminUser(user) && user.collegeId === college.id)
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
        const assignedGoalIds = new Set(podUsers.flatMap((leader) => leader.goals.map((goal) => goal.id)));
        const unassignedLeaders = podUsers.filter((leader) => !leader.goals.some((goal) => goal.status === "active"));
        const activeGoalCount = podGoals.filter((goal) => goal.status === "active").length;
        const completedGoalCount = podGoals.filter((goal) => goal.status === "done").length;
        return {
          college,
          leaders: podUsers,
          goals: podGoals,
          unassignedLeaders,
          activeGoalCount,
          completedGoalCount,
          coverage: podUsers.length ? Math.round(((podUsers.length - unassignedLeaders.length) / podUsers.length) * 100) : 0,
          unmatchedGoals: podGoals.filter((goal) => !assignedGoalIds.has(goal.id)),
        };
      })
      .sort((left, right) =>
        right.unassignedLeaders.length - left.unassignedLeaders.length
        || right.activeGoalCount - left.activeGoalCount
        || left.college.name.localeCompare(right.college.name),
      );
  }, [colleges, goals, users]);

  const selectedPod = selectedPodId ? podOverviews.find((pod) => pod.college.id === selectedPodId) : null;
  const leadersWithoutGoals = podOverviews.reduce((sum, pod) => sum + pod.unassignedLeaders.length, 0);
  const podsNeedingGoals = podOverviews.filter((pod) => pod.unassignedLeaders.length > 0).length;
  const activeGoals = goals.filter((goal) => goal.status === "active").length;

  function openCreateDrawer(prefill?: { collegeId?: string; leader?: LeaderWithGoals }) {
    setDrawerMode("create");
    setEditingGoalId(null);
    setDraft({
      ...EMPTY_DRAFT,
      collegeId: prefill?.collegeId || selectedPod?.college.id || "",
      assigneeName: prefill?.leader?.user.name || prefill?.leader?.user.username || "",
      podRole: prefill?.leader ? podRoleToLabel(prefill.leader.role) : DEFAULT_ROLE,
    });
    setMessage(null);
  }

  function openEditDrawer(goal: PodLeaderGoal) {
    setDrawerMode("edit");
    setEditingGoalId(goal.id);
    setDraft({
      title: goal.title,
      description: goal.description || "",
      assigneeName: goal.assigneeName || "",
      collegeId: goal.collegeId || "",
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

  function updateDraftAssignment(collegeId: string, podRole: PodRoleLabel) {
    const role = podRoleToApiValue(podRole);
    const leader = users.find(
      (user) => user.isActive !== false && user.collegeId === collegeId && normalizePodRole(user.podRole) === role,
    );
    setDraft((current) => ({ ...current, collegeId, podRole, assigneeName: leader?.name || leader?.username || "" }));
  }

  async function refreshAll() {
    await Promise.all([goalsQuery.refetch(), collegesQuery.refetch(), usersQuery.refetch()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setMessage({ text: "Title is required.", tone: "bad" });
      return;
    }
    if (!draft.collegeId) {
      setMessage({ text: "Pod is required.", tone: "bad" });
      return;
    }

    setSaving(true);
    try {
      const selectedCollege = colleges.find((college) => college.id === draft.collegeId);
      const payload: PodLeaderGoal = {
        id: editingGoalId || makeId("lg"),
        collegeId: draft.collegeId,
        collegeName: selectedCollege?.name,
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
      setMessage({ text: drawerMode === "create" ? "Goal assigned." : "Goal updated.", tone: "good" });
      closeDrawer();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not save goal.", tone: "bad" });
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
      setMessage({ text: "Goal deleted.", tone: "good" });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not delete goal.", tone: "bad" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-3 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Leader goals"
        description="See what every pod is focused on, spot leaders without goals, and assign their next priority."
        icon={ClipboardList}
        className="mb-0 shrink-0"
        actionsClassName="w-auto justify-end"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Refresh leader goals" title="Refresh leader goals" onClick={() => void refreshAll()} disabled={loading || refreshing || saving}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button size="icon" className="sm:hidden" aria-label="Assign goal" title="Assign goal" onClick={() => openCreateDrawer()}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button className="hidden sm:inline-flex" onClick={() => openCreateDrawer()}>
              <Plus className="h-4 w-4" /> Assign goal
            </Button>
          </div>
        }
      />

      {message ? (
        <div className={cn(
          "shrink-0 rounded-lg border px-3 py-2 text-sm",
          message.tone === "good" && "border-good/30 bg-good/10 text-good",
          message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
          message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
        )}>
          {message.text}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && !podOverviews.length ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-ruby-bright" />
          </div>
        ) : selectedPod ? (
          <PodDetail
            pod={selectedPod}
            saving={saving}
            onBack={() => setSelectedPodId(null)}
            onAssign={(leader) => openCreateDrawer({ collegeId: selectedPod.college.id, leader })}
            onEdit={openEditDrawer}
            onDelete={(goal) => void handleDelete(goal)}
          />
        ) : (
          <AllPodsOverview
            pods={podOverviews}
            podsNeedingGoals={podsNeedingGoals}
            leadersWithoutGoals={leadersWithoutGoals}
            activeGoals={activeGoals}
            onOpenPod={setSelectedPodId}
            onAssign={(pod, leader) => openCreateDrawer({ collegeId: pod.college.id, leader })}
          />
        )}
      </div>

      <Drawer open={drawerMode !== null} onClose={closeDrawer} title={drawerMode === "create" ? "Assign a leader goal" : "Edit leader goal"}>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <FieldRow label="Goal">
            <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="What should this leader move forward?" required />
          </FieldRow>
          <FieldRow label="Pod">
            <Select value={draft.collegeId} onChange={(event) => updateDraftAssignment(event.target.value, draft.podRole)} required>
              <option value="">Select pod</option>
              {colleges.map((college) => <option key={college.id} value={college.id}>{college.name} · {college.crew}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Leadership role">
            <Select value={draft.podRole} onChange={(event) => updateDraftAssignment(draft.collegeId, event.target.value as PodRoleLabel)}>
              {POD_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Leader">
            <Input value={draft.assigneeName} onChange={(event) => setDraft((current) => ({ ...current, assigneeName: event.target.value }))} placeholder="Leader name" />
          </FieldRow>
          <FieldRow label="What does success look like?">
            <Textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context or success criteria" />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Status">
              <Select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PodLeaderGoalStatus }))}>
                <option value="active">Active</option>
                <option value="done">Done</option>
              </Select>
            </FieldRow>
            <FieldRow label="Due date">
              <Input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} />
            </FieldRow>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDrawer} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {drawerMode === "create" ? "Assign goal" : "Save changes"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function AllPodsOverview({
  pods,
  podsNeedingGoals,
  leadersWithoutGoals,
  activeGoals,
  onOpenPod,
  onAssign,
}: {
  pods: PodGoalOverview[];
  podsNeedingGoals: number;
  leadersWithoutGoals: number;
  activeGoals: number;
  onOpenPod: (podId: string) => void;
  onAssign: (pod: PodGoalOverview, leader: LeaderWithGoals) => void;
}) {
  return (
    <section aria-labelledby="all-pods-heading">
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line py-3">
        <SummaryMetric label="Pods needing goals" value={podsNeedingGoals} tone={podsNeedingGoals ? "attention" : "good"} />
        <SummaryMetric label="Leaders unassigned" value={leadersWithoutGoals} tone={leadersWithoutGoals ? "attention" : "good"} />
        <SummaryMetric label="Active goals" value={activeGoals} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="all-pods-heading" className="font-display text-lg font-bold text-ink">All pods</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Pods with unassigned leaders are shown first.</p>
        </div>
        <span className="text-xs text-ink-faint">{pods.length} pods</span>
      </div>
      {pods.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pods.map((pod) => {
            const nextLeader = pod.unassignedLeaders[0];
            return (
              <article key={pod.college.id} className="overflow-hidden rounded-xl border border-line bg-surface-1 transition-colors hover:border-line-strong">
                <button type="button" onClick={() => onOpenPod(pod.college.id)} className="focus-ring block w-full p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold leading-snug text-ink">{pod.college.name}</h3>
                      <p className="mt-1 text-xs text-ink-faint">{pod.college.crew || "Unassigned crew"}</p>
                    </div>
                    <Badge tone={pod.unassignedLeaders.length ? "bad" : pod.leaders.length ? "good" : "muted"} className="shrink-0">
                      {pod.unassignedLeaders.length ? `${pod.unassignedLeaders.length} need goals` : pod.leaders.length ? "All covered" : "No leaders"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <PodMetric value={pod.leaders.length} label="Leaders" />
                    <PodMetric value={pod.activeGoalCount} label="Active" />
                    <PodMetric value={pod.completedGoalCount} label="Done" />
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-faint">
                      <span>Goal coverage</span><span>{pod.coverage}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className={cn("h-full rounded-full", pod.coverage === 100 ? "bg-good" : "bg-ruby-bright")} style={{ width: `${pod.coverage}%` }} />
                    </div>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ruby-bright">See this pod <ChevronRight className="h-3.5 w-3.5" /></span>
                </button>
                {nextLeader ? (
                  <button type="button" onClick={() => onAssign(pod, nextLeader)} className="focus-ring flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-xs font-semibold text-amber-bright hover:bg-surface-2">
                    <span className="truncate">Assign {nextLeader.user.name || nextLeader.user.username || formatPodRole(nextLeader.role)}</span>
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <p className="font-semibold text-ink">No pods available</p>
          <p className="mt-1 text-sm text-ink-muted">Registered pods will appear here.</p>
        </div>
      )}
    </section>
  );
}

function PodDetail({
  pod,
  saving,
  onBack,
  onAssign,
  onEdit,
  onDelete,
}: {
  pod: PodGoalOverview;
  saving: boolean;
  onBack: () => void;
  onAssign: (leader: LeaderWithGoals) => void;
  onEdit: (goal: PodLeaderGoal) => void;
  onDelete: (goal: PodLeaderGoal) => void;
}) {
  const sortedLeaders = [...pod.leaders].sort((left, right) => {
    const leftAssigned = left.goals.some((goal) => goal.status === "active");
    const rightAssigned = right.goals.some((goal) => goal.status === "active");
    return Number(leftAssigned) - Number(rightAssigned) || formatPodRole(left.role).localeCompare(formatPodRole(right.role));
  });

  return (
    <section aria-labelledby="pod-goals-heading">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-base/95 px-1 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to all pods" title="Back to all pods" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ruby-bright">Now viewing one pod</p>
            <h2 id="pod-goals-heading" className="truncate font-display text-xl font-black text-ink">{pod.college.name}</h2>
            <p className="text-xs text-ink-faint">{pod.college.crew || "Unassigned crew"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line py-3">
        <SummaryMetric label="Leaders" value={pod.leaders.length} />
        <SummaryMetric label="Need goals" value={pod.unassignedLeaders.length} tone={pod.unassignedLeaders.length ? "attention" : "good"} />
        <SummaryMetric label="Active goals" value={pod.activeGoalCount} />
      </div>

      <div className="mt-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Leaders and their goals</h3>
            <p className="mt-0.5 text-sm text-ink-muted">Unassigned leaders are prioritised first.</p>
          </div>
          <span className="text-xs text-ink-faint">{pod.goals.length} total goals</span>
        </div>
        <div className="space-y-2.5">
          {sortedLeaders.map((leader) => {
            const active = leader.goals.filter((goal) => goal.status === "active");
            return (
              <div key={leader.user.id || `${pod.college.id}-${leader.role}-${leader.user.name}`} className={cn("rounded-xl border bg-surface-1", active.length ? "border-line" : "border-amber-bright/40")}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", active.length ? "bg-ruby/10 text-ruby-bright" : "bg-amber/10 text-amber-bright")}>
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{leader.user.name || leader.user.username || "Unnamed leader"}</p>
                      <p className="text-xs text-ink-faint">{formatPodRole(leader.role)}</p>
                    </div>
                  </div>
                  {active.length ? (
                    <Badge tone="good">{active.length} active</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onAssign(leader)}><Plus className="h-3.5 w-3.5" /> Assign goal</Button>
                  )}
                </div>
                {leader.goals.length ? (
                  <div className="divide-y divide-line border-t border-line">
                    {leader.goals.map((goal) => <GoalRow key={goal.id} goal={goal} saving={saving} onEdit={onEdit} onDelete={onDelete} />)}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-amber-bright">
                    <CircleAlert className="h-3.5 w-3.5" /> No goal assigned yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!pod.leaders.length ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
            <UsersRound className="mx-auto h-5 w-5 text-ink-faint" />
            <p className="mt-2 text-sm font-semibold text-ink">No active leaders in this pod</p>
            <p className="mt-1 text-sm text-ink-muted">Add leadership accounts before assigning member-specific goals.</p>
          </div>
        ) : null}
        {pod.unmatchedGoals.length ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">Other pod assignments</p>
            <div className="divide-y divide-line rounded-xl border border-line bg-surface-1">
              {pod.unmatchedGoals.map((goal) => <GoalRow key={goal.id} goal={goal} saving={saving} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function GoalRow({ goal, saving, onEdit, onDelete }: { goal: PodLeaderGoal; saving: boolean; onEdit: (goal: PodLeaderGoal) => void; onDelete: (goal: PodLeaderGoal) => void }) {
  const daysUntilDue = relativeDays(goal.dueDate);
  const overdue = goal.status === "active" && daysUntilDue !== null && daysUntilDue < 0;
  return (
    <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", goal.status === "done" ? "bg-good/10 text-good" : overdue ? "bg-bad/10 text-bad" : "bg-surface-3 text-ink-muted")}>
        {goal.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{goal.title}</p>
          <Badge tone={goal.status === "done" ? "good" : overdue ? "bad" : "amber"}>{goal.status === "done" ? "Done" : overdue ? "Overdue" : "Active"}</Badge>
        </div>
        {goal.description ? <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{goal.description}</p> : null}
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-faint"><CalendarClock className="h-3 w-3" /> {goal.dueDate ? formatDate(goal.dueDate) : "No due date"}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${goal.title}`} title="Edit goal" onClick={() => onEdit(goal)} disabled={saving}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-bad" aria-label={`Delete ${goal.title}`} title="Delete goal" onClick={() => onDelete(goal)} disabled={saving}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "attention" | "good" }) {
  return (
    <div className="min-w-0 px-2 text-center sm:px-4">
      <p className={cn("font-display text-xl font-black sm:text-2xl", tone === "attention" ? "text-amber-bright" : tone === "good" ? "text-good" : "text-ink")}>{value}</p>
      <p className="mt-0.5 whitespace-nowrap text-[clamp(0.48rem,2.1vw,0.75rem)] uppercase tracking-[0.04em] text-ink-faint sm:tracking-[0.08em]">{label}</p>
    </div>
  );
}

function PodMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-lg font-black text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">{label}</p>
    </div>
  );
}
