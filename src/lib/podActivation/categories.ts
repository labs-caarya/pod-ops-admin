export const POD_ACTIVATION_CATEGORIES = [
  { id: "understand-the-why", title: "Understand the why", sortOrder: 1 },
  { id: "understand-the-what", title: "Understand the what", sortOrder: 2 },
  { id: "set-your-vision", title: "Set your vision", sortOrder: 3 },
  { id: "construct-your-workflows", title: "Construct your workflows", sortOrder: 4 },
  { id: "design-your-culture", title: "Design your culture", sortOrder: 5 },
  { id: "manifest-your-dream-clientele", title: "Manifest your dream clientele", sortOrder: 6 },
  { id: "architect-your-all-star-roster", title: "Architect your all-star roster", sortOrder: 7 },
  { id: "build-your-content-funnel", title: "Build your content funnel", sortOrder: 8 },
  { id: "design-your-campaign", title: "Design your campaign", sortOrder: 9 },
  { id: "build-your-network", title: "Build your network", sortOrder: 10 },
] as const;

export type PodActivationCategoryId = (typeof POD_ACTIVATION_CATEGORIES)[number]["id"];

export const CATEGORY_BY_ID = Object.fromEntries(
  POD_ACTIVATION_CATEGORIES.map((c) => [c.id, c]),
) as Record<PodActivationCategoryId, (typeof POD_ACTIVATION_CATEGORIES)[number]>;
