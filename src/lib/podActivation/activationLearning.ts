import type { PodRoleApi } from "@/lib/podRoles";

export const RESOURCE_SCOPES = {
  ACTIVATION: 0,
  ADMIN: 1,
  COMMUNITY: 2,
} as const;

export type ResourceScope = (typeof RESOURCE_SCOPES)[keyof typeof RESOURCE_SCOPES];
export type ActivationStage = "learn" | "build" | "execute";
export type ActivationAudienceType = "common" | "role";
export type ActivationContentMode = "inline-text" | "external";
export type ActivationMediaType = "text" | "audio" | "video";
export type ActivationProvider = "inline-text" | "youtube" | "spotify" | "google-docs" | "notion" | "loom" | "vimeo" | "external";
export type ActivationPresentationMode = "inline-text" | "iframe" | "external-link";

export interface LearnSectionConfig {
  key: string;
  title: string;
  description: string;
  rank: number;
}

export const LEARN_SECTIONS = [
  {
    key: "caarya-gap",
    title: "The Gap Caarya Pods Fill",
    description: "Industry-academia disconnect, quality gap, and why the pod model exists.",
    rank: 100,
  },
  {
    key: "caarya-goal",
    title: "Caarya's Goal",
    description: "Venture democratisation and the larger ambition behind pods.",
    rank: 200,
  },
  {
    key: "why-pods-exist",
    title: "Why Pods Exist",
    description: "The practical reason pods exist inside the Caarya ecosystem.",
    rank: 300,
  },
  {
    key: "what-pods-are-not",
    title: "What Pods Are Not",
    description: "Clear boundaries: not an internship, not a college club.",
    rank: 400,
  },
  {
    key: "what-pods-are",
    title: "What Pods Are",
    description: "Career accelerator plus venture incubator, explained simply.",
    rank: 500,
  },
  {
    key: "pod-role-system",
    title: "Roles In A Pod",
    description: "All pod roles as interconnected cogs that cannot operate independently.",
    rank: 600,
  },
  {
    key: "active-pod-stories",
    title: "Stories From Active Pods",
    description: "Role stories, tips, ways of working, and skills needed from active pods.",
    rank: 700,
  },
  {
    key: "knowledge-foundations",
    title: "Skill Repository",
    description: "Knowledge foundations: SL levels, OKRs, SMART goals, BPM, SOPs, templates, and marketing types.",
    rank: 800,
  },
] as const satisfies readonly LearnSectionConfig[];

export type LearnSectionKey = (typeof LEARN_SECTIONS)[number]["key"];

export interface ActivationPresentation {
  mode: ActivationPresentationMode;
  provider: ActivationProvider;
  url: string;
  embedUrl?: string;
  content?: string;
}

export interface ActivationResourceMetadata {
  stage: ActivationStage;
  sectionKey: LearnSectionKey | string;
  audienceType: ActivationAudienceType;
  roleIds: PodRoleApi[];
  rank: number;
  required: boolean;
  contentMode: ActivationContentMode;
  mediaType: ActivationMediaType;
  provider: ActivationProvider;
  published: boolean;
  presentation?: ActivationPresentation;
}

export interface ActivationKnowledgeResourceInput {
  title: string;
  description: string;
  url: string;
  type: "docs" | "html";
  tags: string[];
  content: string;
  activation: {
    stage: ActivationStage;
    sectionKey: LearnSectionKey | string;
    audienceType: ActivationAudienceType;
    roleIds: PodRoleApi[];
    rank: number;
    required: boolean;
    contentMode: ActivationContentMode;
    mediaType: ActivationMediaType;
    provider: ActivationProvider;
    published: boolean;
  };
}

export function getLearnSection(sectionKey: string | undefined) {
  return LEARN_SECTIONS.find((section) => section.key === sectionKey);
}
