import type { PodLeaderGoal } from "@/lib/types";

export function normalizeLeaderGoal(goal: Partial<PodLeaderGoal> & { id: string }): PodLeaderGoal {
  return {
    id: goal.id,
    podId: goal.podId ?? "",
    podName: goal.podName,
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
