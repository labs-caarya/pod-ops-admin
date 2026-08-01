import type { PodActivationCategoryId } from "./categories";

export type PodActivationItemType = "learn" | "do";

export type PodActivationArtifactSchema =
  | "freeform_doc"
  | "pod_why"
  | "thirty_day_plan"
  | "pod_goals"
  | "workflows"
  | "culture_charter"
  | "research_targets"
  | "role_map"
  | "content_funnel"
  | "campaign_plan"
  | "outreach_pitches";

export type PodActivationItemStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "complete";

export interface PodActivationItemTemplate {
  id: string;
  categoryId: PodActivationCategoryId;
  sortOrder: number;
  type: PodActivationItemType;
  title: string;
  description: string;
  materialUrl?: string;
  materialType?: "docs" | "pdf" | "html" | "video" | "in-app";
  unlocksItemId?: string;
  artifactSchema?: PodActivationArtifactSchema;
  shareWithCommunityDefault?: boolean;
  published: boolean;
  updatedAt?: string;
}

export interface PodActivationProgress {
  id: string;
  collegeId: string;
  itemId: string;
  status: PodActivationItemStatus;
  completedAt?: string;
  completedBy?: string;
}

export interface PodActivationArtifact {
  id: string;
  collegeId: string;
  itemId: string;
  categoryId: PodActivationCategoryId;
  title: string;
  summary?: string;
  payload: Record<string, unknown>;
  shareWithCommunity: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PodActivationSnapshot {
  total: number;
  complete: number;
  percent: number;
  byCategory: {
    categoryId: PodActivationCategoryId;
    title: string;
    complete: number;
    total: number;
  }[];
  items: (PodActivationItemTemplate & {
    status: PodActivationItemStatus;
    artifact?: PodActivationArtifact;
  })[];
}
