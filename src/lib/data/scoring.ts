import type { ResearchScores } from "../types";

export const SCORING_CRITERIA: {
  key: keyof ResearchScores;
  label: string;
  weight: number;
  hint: string;
}[] = [
  { key: "gapMatch", label: "Services Gap Match", weight: 6, hint: "How well a pod can fill their gaps" },
  { key: "podFit", label: "Caarya Pod Fit", weight: 5, hint: "Fit for student-led delivery" },
  { key: "businessHealth", label: "Business Health", weight: 4, hint: "Revenue, funding, momentum" },
  { key: "socialPresence", label: "Social & Digital Presence", weight: 3, hint: "Reach and engagement" },
  { key: "peopleCulture", label: "People & Culture", weight: 2, hint: "Team quality and openness" },
];

const MAX_RAW = SCORING_CRITERIA.reduce((sum, c) => sum + c.weight * 5, 0);

export function computeScore(scores: ResearchScores): number {
  const raw = SCORING_CRITERIA.reduce((sum, c) => sum + c.weight * (scores[c.key] || 0), 0);
  return Math.round((raw / MAX_RAW) * 100);
}
