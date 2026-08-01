import { createCollection } from "@/lib/store";
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

export function getItemStatus(
  template: PodActivationItemTemplate,
  collegeId: string,
  progress: PodActivationProgress[],
  templates: PodActivationItemTemplate[],
): PodActivationItemStatus {
  if (!template.published) return "locked";
  const record = progress.find((p) => p.collegeId === collegeId && p.itemId === template.id);
  if (record?.status === "complete") return "complete";
  if (template.unlocksItemId) {
    const prereq = templates.find((t) => t.id === template.unlocksItemId);
    if (prereq) {
      const prereqDone = progress.some(
        (p) => p.collegeId === collegeId && p.itemId === prereq.id && p.status === "complete",
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
      (p) => p.collegeId === collegeId && p.itemId === prev.id && p.status === "complete",
    );
    if (!prevDone) return "locked";
  }
  return record?.status ?? "available";
}

export function buildActivationSnapshot(
  collegeId: string,
  progressOverride?: PodActivationProgress[],
  artifactsOverride?: PodActivationArtifact[],
): PodActivationSnapshot {
  const templates = podActivationTemplateStore
    .all()
    .filter((t) => t.published)
    .sort((a, b) => {
      const catA = CATEGORY_BY_ID[a.categoryId]?.sortOrder ?? 0;
      const catB = CATEGORY_BY_ID[b.categoryId]?.sortOrder ?? 0;
      if (catA !== catB) return catA - catB;
      return a.sortOrder - b.sortOrder;
    });
  const progress = (progressOverride ?? []).filter((p) => p.collegeId === collegeId);
  const artifacts = (artifactsOverride ?? []).filter((a) => a.collegeId === collegeId);

  const items = templates.map((template) => {
    const status = getItemStatus(template, collegeId, progress, templates);
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

export function allPodsActivationSummary(
  collegeIds: string[],
  progress: PodActivationProgress[] = [],
  artifacts: PodActivationArtifact[] = [],
) {
  return collegeIds.map((collegeId) => {
    const snap = buildActivationSnapshot(collegeId, progress, artifacts);
    return { collegeId, ...snap };
  });
}
