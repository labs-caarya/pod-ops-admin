import type { PodGoal } from "@/lib/types";
import { pct } from "@/lib/constants";
import { POD } from "@/lib/data/collections";

export interface LevelObjective {
  goal: PodGoal;
  progress: number;
  complete: boolean;
}

export interface LevelUpSnapshot {
  currentLevel: number;
  nextLevel: number;
  /** Average % completion across all level-up objectives (0–100). */
  overallProgress: number;
  /** Objectives fully met (100%+ of target). */
  objectivesComplete: number;
  objectivesTotal: number;
  objectives: LevelObjective[];
  /** True when every objective is complete — pod can level up. */
  readyToLevelUp: boolean;
}

export function getLevelUpSnapshot(goals: PodGoal[]): LevelUpSnapshot {
  const objectives = goals.map((goal) => {
    const progress = Math.min(100, pct(goal.current, goal.target));
    return { goal, progress, complete: progress >= 100 };
  });

  const objectivesTotal = objectives.length;
  const objectivesComplete = objectives.filter((o) => o.complete).length;
  const overallProgress =
    objectivesTotal === 0
      ? 0
      : Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectivesTotal);

  return {
    currentLevel: POD.level,
    nextLevel: POD.level + 1,
    overallProgress,
    objectivesComplete,
    objectivesTotal,
    objectives,
    readyToLevelUp: objectivesTotal > 0 && objectivesComplete === objectivesTotal,
  };
}

export function formatGoalAmount(goal: PodGoal, value: number): string {
  if (goal.unit === "₹") return `₹${(value / 1000).toFixed(0)}k`;
  return `${value} ${goal.unit}`;
}
