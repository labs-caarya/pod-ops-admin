import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldRow } from "@/components/ui/Field";
import { PodMentionTextarea } from "@/components/moksha/PodMentionTextarea";
import { upsertLeaderGoal } from "@/lib/api";
import {
  adminQueryKeys,
  collegesQueryOptions,
  leaderGoalsQueryOptions,
  managedUsersQueryOptions,
} from "@/lib/adminQueries";
import { listPodColleges, listPodLeaderOptions, type PodLeaderOption } from "@/lib/podLeaders";
import {
  leaderMatchesGoal,
  resolveCollegeIdFromMentions,
  resolveLeaderKeyFromSlash,
  roleSlashToken,
  stripAllocationTokens,
} from "@/lib/podMentions";
import { formatPodRole } from "@/lib/podRoles";
import type { PodLeaderGoal } from "@/lib/types";
import { cn, makeId } from "@/lib/utils";

type RecentAssignment = {
  id: string;
  title: string;
  podName: string;
  leaderLabel: string;
  at: string;
};

export function MokshaTaskAssignPanel({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const collegesQuery = useQuery(collegesQueryOptions());
  const usersQuery = useQuery(managedUsersQueryOptions());
  const goalsQuery = useQuery(leaderGoalsQueryOptions());

  const [taskText, setTaskText] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [leaderKey, setLeaderKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentAssignment[]>([]);

  const pods = useMemo(
    () => listPodColleges(collegesQuery.data || []),
    [collegesQuery.data],
  );

  const resolvedCollegeId = collegeId || resolveCollegeIdFromMentions(taskText, pods);
  const selectedPod = pods.find((pod) => pod.id === resolvedCollegeId) ?? null;

  const leaders = useMemo(
    () => (resolvedCollegeId ? listPodLeaderOptions(usersQuery.data || [], resolvedCollegeId) : []),
    [resolvedCollegeId, usersQuery.data],
  );

  const resolvedLeaderKey = leaderKey || resolveLeaderKeyFromSlash(taskText, leaders);
  const selectedLeader = leaders.find((leader) => leader.key === resolvedLeaderKey) ?? null;

  const goals = goalsQuery.data ?? [];
  const loading = collegesQuery.isPending || usersQuery.isPending;

  function appendLeaderSlash(leader: PodLeaderOption) {
    setLeaderKey(leader.key);
    if (taskText.includes(roleSlashToken(leader).trim())) return;
    const prefix = taskText.trim().length ? `${taskText.trimEnd()} ` : "";
    setTaskText(`${prefix}${roleSlashToken(leader)}`);
  }

  async function assignTask() {
    const { title, description } = stripAllocationTokens(taskText, pods);
    if (!title) {
      setError("Describe what needs to be done (after @pod and /role tags).");
      return;
    }
    if (!resolvedCollegeId) {
      setError("Tag a pod with @ — type @ and pick a pod name.");
      return;
    }
    if (!selectedLeader) {
      setError("Tag a leader with / — e.g. /Exec Lead or /marketing.");
      return;
    }

    const pod = selectedPod;
    const assigneeName = selectedLeader.user.name?.trim() || selectedLeader.user.username?.trim() || "";

    setSaving(true);
    setError(null);
    try {
      const payload: PodLeaderGoal = {
        id: makeId("lg"),
        collegeId: resolvedCollegeId,
        collegeName: pod?.name,
        assignedPodRole: selectedLeader.role,
        assigneeName,
        title,
        description,
        status: "active",
      };
      const saved = await upsertLeaderGoal(payload);
      queryClient.setQueryData<PodLeaderGoal[]>(adminQueryKeys.leaderGoals, (current = []) => [saved, ...current]);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });

      setRecent((items) => [
        {
          id: saved.id,
          title: saved.title,
          podName: pod?.name || "Pod",
          leaderLabel: selectedLeader.label,
          at: new Date().toISOString(),
        },
        ...items.slice(0, 4),
      ]);
      setTaskText("");
      setCollegeId("");
      setLeaderKey("");
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Could not assign task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <p className="mb-3 shrink-0 text-sm text-ink-muted">
        Use <span className="font-medium text-ink">@pod</span> then <span className="font-medium text-ink">/role</span>, describe the work, and assign — same flow as comments.
      </p>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading pods…
        </div>
      ) : (
        <>
          {recent.length ? (
            <div className="mb-3 max-h-28 shrink-0 space-y-2 overflow-y-auto rounded-xl border border-line bg-surface-2/60 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Just assigned</p>
              {recent.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-ink-muted">
                      {item.podName} · {item.leaderLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-visible">
            <FieldRow label="Assignment">
              <PodMentionTextarea
                value={taskText}
                onChange={setTaskText}
                pods={pods}
                leaders={leaders}
                slashMode="leaders"
                disabled={saving}
                placeholder="e.g. @Pod Name /Exec Lead Submit today's HIVE brief and flag Priority leads…"
                onMentionPod={(pod) => {
                  setCollegeId(pod.id);
                  setLeaderKey("");
                }}
                onMentionLeader={(leader) => setLeaderKey(leader.key)}
              />
            </FieldRow>

            {!selectedPod ? (
              <Badge tone="amber">Start with @ to pick a pod</Badge>
            ) : !selectedLeader ? (
              <Badge tone="amber">Add /role to pick who gets this task</Badge>
            ) : (
              <Badge tone="good">
                Assigning to {selectedLeader.label} · {selectedPod.name}
              </Badge>
            )}

            {selectedPod ? (
              <div className="rounded-xl border border-line bg-surface-2/40 p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  Leaders on {selectedPod.name}
                </p>
                {leaders.length ? (
                  <ul className="space-y-2">
                    {leaders.map((leader) => {
                      const activeGoals = goals.filter(
                        (goal) => goal.status === "active" && leaderMatchesGoal(goal, leader),
                      );
                      const highlighted = leader.key === resolvedLeaderKey;
                      return (
                        <li key={leader.key}>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => appendLeaderSlash(leader)}
                            className={cn(
                              "focus-ring w-full rounded-lg border px-3 py-2 text-left transition-colors",
                              highlighted
                                ? "border-ruby/50 bg-ruby/10 ring-1 ring-ruby/25"
                                : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-ink">
                              <UserRound className="h-3.5 w-3.5 text-ink-muted" />
                              {leader.user.name || leader.user.username || "Unnamed"}
                              <span className="text-xs font-normal text-ink-muted">· {formatPodRole(leader.role)}</span>
                            </div>
                            {activeGoals.length ? (
                              <ul className="mt-1.5 space-y-1 border-t border-line/60 pt-1.5">
                                {activeGoals.slice(0, 3).map((goal) => (
                                  <li key={goal.id} className="text-xs text-ink-muted">
                                    Active: {goal.title}
                                  </li>
                                ))}
                                {activeGoals.length > 3 ? (
                                  <li className="text-xs text-ink-faint">+{activeGoals.length - 3} more active goals</li>
                                ) : null}
                              </ul>
                            ) : (
                              <p className="mt-1 text-xs text-ink-faint">No active goals assigned</p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-ink-muted">No leaders with roles on this pod.</p>
                )}
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-2 shrink-0 text-xs text-bad">{error}</p> : null}

          <Button
            type="button"
            className="mt-3 w-full shrink-0"
            disabled={saving || !taskText.trim() || !resolvedCollegeId || !selectedLeader}
            onClick={() => void assignTask()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Assign to leader
          </Button>
        </>
      )}
    </div>
  );
}
