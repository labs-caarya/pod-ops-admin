import type { ClubStage } from "@/lib/api";

export function clubStageTone(stage: ClubStage) {
  if (stage === "Strategic" || stage === "Active") return "good" as const;
  if (stage === "Engaged") return "amber" as const;
  return "muted" as const;
}
