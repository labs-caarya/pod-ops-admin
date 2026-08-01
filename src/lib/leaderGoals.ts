import type { PodLeaderGoal } from "@/lib/types";

export function normalizeLeaderGoal(goal: Partial<PodLeaderGoal> & { id: string }): PodLeaderGoal {
  return {
    id: goal.id,
    collegeId: goal.collegeId ?? "",
    collegeName: goal.collegeName,
    assignedPodRole: goal.assignedPodRole ?? "Pod Leader",
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
