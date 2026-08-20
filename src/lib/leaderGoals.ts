import type { PodLeaderGoal } from "@/lib/types";
import { normalizePodRole } from "@/lib/podRoles";

export function normalizeLeaderGoal(goal: Partial<PodLeaderGoal> & { id: string }): PodLeaderGoal {
  return {
    id: goal.id,
    collegeId: goal.collegeId ?? "",
    collegeName: goal.collegeName,
    assignedPodRole: normalizePodRole(goal.assignedPodRole) ?? "exec",
    assigneeName: goal.assigneeName ?? "",
    icon: goal.icon ?? "target",
    title: goal.title ?? "",
    description: goal.description ?? "",
    status: goal.status ?? "active",
    dueDate: goal.dueDate,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}
