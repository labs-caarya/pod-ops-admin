import { createCollection } from "@/lib/store";
import { researchStore } from "@/lib/data/collections";
import { makeId } from "@/lib/utils";
import { buildActivationTemplateSeed } from "./seed";
import { POD_ACTIVATION_CATEGORIES, CATEGORY_BY_ID } from "./categories";
import type {
  PodActivationArtifact,
  PodActivationItemStatus,
  PodActivationItemTemplate,
  PodActivationProgress,
  PodActivationSnapshot,
} from "./types";

export * from "./categories";
export * from "./types";
export * from "./seed";

export const podActivationTemplateStore = createCollection<PodActivationItemTemplate>(
  "podActivationTemplates",
  buildActivationTemplateSeed(),
);

export const podActivationProgressStore = createCollection<PodActivationProgress>("podActivationProgress");
export const podActivationArtifactStore = createCollection<PodActivationArtifact>("podActivationArtifacts");

function progressKey(podId: string, itemId: string) {
  return `${podId}::${itemId}`;
}

export function getItemStatus(
  template: PodActivationItemTemplate,
  podId: string,
  progress: PodActivationProgress[],
  templates: PodActivationItemTemplate[],
): PodActivationItemStatus {
  if (!template.published) return "locked";
  const record = progress.find((p) => p.podId === podId && p.itemId === template.id);
  if (record?.status === "complete") return "complete";
  if (template.unlocksItemId) {
    const prereq = templates.find((t) => t.id === template.unlocksItemId);
    if (prereq) {
      const prereqDone = progress.some(
        (p) => p.podId === podId && p.itemId === prereq.id && p.status === "complete",
      );
      if (!prereqDone) return "locked";
    }
  }
  const categoryItems = templates
    .filter((t) => t.categoryId === template.categoryId && t.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const index = categoryItems.findIndex((t) => t.id === template.id);
  if (index > 0) {
    const prev = categoryItems[index - 1];
    const prevDone = progress.some(
      (p) => p.podId === podId && p.itemId === prev.id && p.status === "complete",
    );
    if (!prevDone) return "locked";
  }
  return record?.status ?? "available";
}

export function buildActivationSnapshot(podId: string): PodActivationSnapshot {
  const templates = podActivationTemplateStore
    .all()
    .filter((t) => t.published)
    .sort((a, b) => {
      const catA = CATEGORY_BY_ID[a.categoryId]?.sortOrder ?? 0;
      const catB = CATEGORY_BY_ID[b.categoryId]?.sortOrder ?? 0;
      if (catA !== catB) return catA - catB;
      return a.sortOrder - b.sortOrder;
    });
  const progress = podActivationProgressStore.all().filter((p) => p.podId === podId);
  const artifacts = podActivationArtifactStore.all().filter((a) => a.podId === podId);

  const items = templates.map((template) => {
    const status = getItemStatus(template, podId, progress, templates);
    const artifact = artifacts.find((a) => a.itemId === template.id);
    return { ...template, status, artifact };
  });

  const complete = items.filter((i) => i.status === "complete").length;
  const total = items.length;

  const byCategory = POD_ACTIVATION_CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => i.categoryId === cat.id);
    return {
      categoryId: cat.id,
      title: cat.title,
      complete: catItems.filter((i) => i.status === "complete").length,
      total: catItems.length,
    };
  });

  return {
    total,
    complete,
    percent: total ? Math.round((complete / total) * 100) : 0,
    byCategory,
    items,
  };
}

export function markLearnComplete(podId: string, itemId: string, completedBy?: string) {
  const id = progressKey(podId, itemId);
  return podActivationProgressStore.upsert({
    id,
    podId,
    itemId,
    status: "complete",
    completedBy,
    completedAt: new Date().toISOString(),
  });
}

export function submitActivationArtifact(input: Omit<PodActivationArtifact, "id" | "createdAt" | "updatedAt">) {
  const existing = podActivationArtifactStore.all().find(
    (a) => a.podId === input.podId && a.itemId === input.itemId,
  );
  const artifact = podActivationArtifactStore.upsert({
    ...input,
    id: existing?.id ?? `paa_${input.itemId}`,
  });
  markLearnComplete(input.podId, input.itemId);

  if (input.payload?.targets && Array.isArray(input.payload.targets)) {
    const names = input.payload.targets as string[];
    const existingResearch = researchStore.all();
    for (const name of names) {
      if (existingResearch.some((r) => r.name.toLowerCase() === name.toLowerCase())) continue;
      researchStore.upsert({
        id: makeId("res"),
        name,
        kind: "Brand",
        searchTarget: "Industry Partner",
        industryStage: "Established Brand",
        sector: "TBD",
        city: "",
        website: "",
        founded: "",
        status: "Research",
        founderName: "",
        founderBackground: "",
        founderActive: true,
        instagramFollowers: "",
        linkedinFollowers: "",
        socialFeel: "",
        productClarity: 3,
        designQuality: "",
        gaps: "Added from Pod Activation — dream clientele.",
        teamSize: "",
        fundingStage: "",
        openRoles: "",
        strengths: "",
        scores: { gapMatch: 0, podFit: 0, businessHealth: 0, socialPresence: 0, peopleCulture: 0 },
      });
    }
  }

  return artifact;
}

export function allPodsActivationSummary(podIds: string[]) {
  return podIds.map((podId) => {
    const snap = buildActivationSnapshot(podId);
    return { podId, ...snap };
  });
}
