import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { collegesQueryOptions, managedUsersQueryOptions } from "@/lib/adminQueries";
import type { AllowedUser } from "@/lib/api";
import type { ContentItem } from "@/lib/content";
import {
  assignContentWork,
  listContentAssignments,
  removeContentAssignment,
  type ContentWorkAssignment,
} from "@/lib/experienceApi";
import { formatPodRole } from "@/lib/podRoles";

function assignableRole(user: AllowedUser) {
  const text = [user.podRole, formatPodRole(user.podRole), user.primary_role]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  if (/\bmarketing\b/.test(text)) return "Marketing";
  if (/content writ/.test(text)) return "Content writing";
  if (/graphic design/.test(text)) return "Graphic design";
  if (/content creat/.test(text)) return "Content creation";
  return null;
}

const STATUS_LABEL: Record<ContentWorkAssignment["status"], string> = {
  offered: "Offered",
  picked_up: "Picked up",
  delivered: "Delivered",
  dropped: "Not delivered",
};

export function ContentAssignmentSheet({
  item,
  onClose,
}: {
  item: ContentItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"list" | "pods" | "people">("list");
  const [podIds, setPodIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const assignments = useQuery({
    queryKey: ["content-work", item?.id],
    queryFn: () => listContentAssignments(item!.id),
    enabled: Boolean(item),
  });
  const colleges = useQuery({ ...collegesQueryOptions(), enabled: Boolean(item) });
  const users = useQuery({ ...managedUsersQueryOptions(), enabled: Boolean(item) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["content-work", item?.id] });
  const assign = useMutation({
    mutationFn: () => assignContentWork(item!.id, userIds),
    onSuccess: () => {
      setStep("list");
      setPodIds([]);
      setUserIds([]);
      setError("");
      refresh();
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Could not assign this content."),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeContentAssignment(item!.id, userId),
    onSuccess: refresh,
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Could not remove this person."),
  });

  const podGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>();
    for (const college of (colleges.data ?? []).filter((college) => college.isPod)) {
      const crew = college.crew.trim() || "Unassigned crew";
      groups.set(crew, [...(groups.get(crew) ?? []), { id: college.id, name: college.name }]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [colleges.data]);

  const peopleByPod = useMemo(() => {
    const selected = new Set(podIds);
    const groups = new Map<string, { id: string; name: string; roleLabel: string }[]>();
    for (const user of users.data ?? []) {
      if (!user.id || !user.collegeId || !selected.has(user.collegeId) || user.isActive === false) continue;
      const roleLabel = assignableRole(user);
      if (!roleLabel) continue;
      const pod = user.collegeName || user.collegeId;
      groups.set(pod, [...(groups.get(pod) ?? []), { id: user.id, name: user.name || user.username || "Pod member", roleLabel }]);
    }
    return [...groups.entries()];
  }, [podIds, users.data]);

  function toggle(list: string[], id: string, set: (next: string[]) => void) {
    set(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  }

  return (
    <ResponsiveSheet
      open={Boolean(item)}
      onClose={onClose}
      title={item ? item.name : "Assign content"}
      subtitle="Who this content is assigned to"
    >
      {step === "list" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-muted">
            Assign this to marketing, content writing, graphic design, or content creation people in the pods you choose.
            They see it on their goals deck and pick a campaign and a due date before starting.
            Delivering on time earns 100 credits, delivering late earns 30, and picking it up then not delivering costs 100. Those amounts can be changed under Experience rules.
            Removing someone does not change credits already on their balance.
          </p>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          {assignments.isLoading ? <p className="text-sm text-ink-muted">Loading assignments…</p> : null}
          {(assignments.data ?? []).length === 0 && !assignments.isLoading ? (
            <p className="text-sm text-ink-muted">Nobody is assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {(assignments.data ?? []).map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{row.userName}</p>
                    <p className="text-xs text-ink-muted">{row.roleLabel} · {row.collegeName}{row.crew ? ` · ${row.crew}` : ""}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {STATUS_LABEL[row.status]}
                      {row.campaignTitle ? ` · ${row.campaignTitle}` : ""}
                      {row.dueDate ? ` · due ${row.dueDate}` : ""}
                    </p>
                  </div>
                  {row.status === "delivered" ? null : (
                    <Button size="sm" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(row.userId)}>Remove</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Button onClick={() => { setError(""); setStep("pods"); }}>Assign people</Button>
        </div>
      ) : null}

      {step === "pods" ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">Choose every pod this content should go to. Pods are grouped by CREW.</p>
          {colleges.isLoading ? <p className="text-sm text-ink-muted">Loading pods…</p> : null}
          {colleges.isError ? <p className="text-sm text-bad">{colleges.error instanceof Error ? colleges.error.message : "Pods could not be loaded."}</p> : null}
          {podGroups.map(([crew, pods]) => {
            const ids = pods.map((pod) => pod.id);
            const all = ids.every((id) => podIds.includes(id));
            return (
              <div key={crew}>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={all && ids.length > 0} onChange={() => setPodIds(all ? podIds.filter((id) => !ids.includes(id)) : [...new Set([...podIds, ...ids])])} />
                  {crew}
                </label>
                <ul className="space-y-1 pl-6">
                  {pods.map((pod) => (
                    <li key={pod.id}>
                      <label className="flex items-center gap-2 text-sm text-ink">
                        <input type="checkbox" checked={podIds.includes(pod.id)} onChange={() => toggle(podIds, pod.id, setPodIds)} />
                        {pod.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("list")}>Back</Button>
            <Button disabled={podIds.length === 0} onClick={() => { setUserIds([]); setStep("people"); }}>Show people</Button>
          </div>
        </div>
      ) : null}

      {step === "people" ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">Only people in the pods you selected, and only marketing, content writing, graphic design, or content creation roles.</p>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          {users.isLoading ? <p className="text-sm text-ink-muted">Loading people…</p> : null}
          {users.isError ? <p className="text-sm text-bad">{users.error instanceof Error ? users.error.message : "People could not be loaded."}</p> : null}
          {peopleByPod.length === 0 && !users.isLoading ? (
            <p className="text-sm text-ink-muted">None of the selected pods have someone in those roles yet.</p>
          ) : peopleByPod.map(([pod, rows]) => (
            <div key={pod}>
              <p className="mb-1 text-sm font-semibold text-ink">{pod}</p>
              <ul className="space-y-1">
                {rows.map((person) => (
                  <li key={person.id}>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={userIds.includes(person.id)} onChange={() => toggle(userIds, person.id, setUserIds)} />
                      {person.name} <span className="text-ink-muted">· {person.roleLabel}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("pods")}>Back</Button>
            <Button disabled={userIds.length === 0 || assign.isPending} onClick={() => assign.mutate()}>
              Assign {userIds.length || ""}
            </Button>
          </div>
        </div>
      ) : null}
    </ResponsiveSheet>
  );
}
