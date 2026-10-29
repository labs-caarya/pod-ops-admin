export const CONTENT_BUCKETS = [
  "Educational",
  "Advisory",
  "Tips and tricks",
  "Informational",
  "Entertainment",
  "Infotainment",
  "Festive",
  "Meme",
  "Motivational",
  "Inspirational",
  "Success story",
] as const;

export const CONTENT_PILLARS = [
  "Indian innovation (The Future Series)",
  "TiSA (Venture Democratization)",
  "We Are Caarya (Community Vibe)",
  "The Student Professional (Student Growth)",
] as const;

export const MARKETING_TYPES = [
  "Content marketing",
  "Partnership marketing",
  "Promotional marketing",
  "Event/moment marketing",
  "Experience marketing",
  "Nano-influencer marketing",
] as const;

export interface ContentItem {
  id: string;
  name: string;
  description: string;
  type: string;
  platform: string;
  contentTypeId: string | null;
  platformIds: string[];
  topicClusterIds: string[];
  directoryStatus: "ready" | "needs_review";
  bucket: typeof CONTENT_BUCKETS[number];
  topicClusters: string[];
  pillar: typeof CONTENT_PILLARS[number];
  marketingType: typeof MARKETING_TYPES[number];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentDirectoryType { id: string; label: string; description: string; }
export interface ContentDirectoryPlatform { id: string; label: string; description: string; audience: string; }
export interface ContentDirectoryTopic { id: string; topic: string; cluster: string; contentDirection: string; narrativeId: string; narrative: string; pairId: string; combinedNarrative: string; }
export interface ContentDirectoryNarrative { id: string; label: string; pairs: { id: string; combinedNarrative: string; topics: ContentDirectoryTopic[] }[]; }
export interface ContentDirectoryOptions { contentTypes: ContentDirectoryType[]; platforms: ContentDirectoryPlatform[]; taxonomy: ContentDirectoryNarrative[]; }

export interface ContentWriteInput {
  name: string;
  description: string;
  contentTypeId: string;
  platformIds: string[];
  topicClusterIds: string[];
  bucket: ContentItem["bucket"];
  pillar: ContentItem["pillar"];
  marketingType: ContentItem["marketingType"];
  tags: string[];
}
