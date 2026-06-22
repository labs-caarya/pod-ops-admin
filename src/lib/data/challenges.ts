import type { Challenge, ChallengeStatus } from "@/lib/types";
import { makeId } from "@/lib/utils";

const STATUS_ORDER: ChallengeStatus[] = [
  "Mapped",
  "Investigating",
  "Root cause found",
  "Action plan",
  "Resolved",
];

export function rcaProgress(challenge: Challenge): number {
  const filledWhys = challenge.whys.filter((w) => w.answer.trim()).length;
  const hasRoot = challenge.rootCause.trim() ? 1 : 0;
  const max = Math.max(challenge.whys.length, 5) + 1;
  return Math.round(((filledWhys + hasRoot) / max) * 100);
}

export function actionProgress(challenge: Challenge): number {
  if (challenge.actions.length === 0) return 0;
  const done = challenge.actions.filter((a) => a.done).length;
  return Math.round((done / challenge.actions.length) * 100);
}

export function suggestStatus(challenge: Challenge): ChallengeStatus {
  if (challenge.status === "Resolved") return "Resolved";
  const actionsDone = challenge.actions.length > 0 && challenge.actions.every((a) => a.done);
  if (actionsDone && challenge.rootCause.trim()) return "Resolved";
  if (challenge.actions.some((a) => a.label.trim()) && challenge.rootCause.trim()) return "Action plan";
  if (challenge.rootCause.trim()) return "Root cause found";
  if (challenge.whys.some((w) => w.answer.trim())) return "Investigating";
  return "Mapped";
}

export function statusIndex(status: ChallengeStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function vaultStats(challenges: Challenge[]) {
  return {
    total: challenges.length,
    open: challenges.filter((c) => c.status !== "Resolved").length,
    investigating: challenges.filter((c) => c.status === "Investigating" || c.status === "Root cause found").length,
    actionPlan: challenges.filter((c) => c.status === "Action plan").length,
    resolved: challenges.filter((c) => c.status === "Resolved").length,
    critical: challenges.filter((c) => c.severity === "Critical" || c.severity === "High").length,
  };
}

export const DEFAULT_WHYS_COUNT = 5;

export function emptyWhys(count = DEFAULT_WHYS_COUNT): Challenge["whys"] {
  return Array.from({ length: count }, () => ({
    id: makeId("why"),
    answer: "",
  }));
}
