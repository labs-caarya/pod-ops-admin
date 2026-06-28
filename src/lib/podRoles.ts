export const POD_ROLE_OPTIONS = [
  "Pod Leader",
  "Pod Talent Manager",
  "Pod Outreach Manager",
  "Pod Researcher",
  "Pod Partner Manager",
] as const;

export type PodRole = (typeof POD_ROLE_OPTIONS)[number];
