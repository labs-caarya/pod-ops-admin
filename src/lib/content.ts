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
  bucket: typeof CONTENT_BUCKETS[number];
  topicClusters: string[];
  pillar: typeof CONTENT_PILLARS[number];
  marketingType: typeof MARKETING_TYPES[number];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ContentWriteInput = Omit<ContentItem, "id" | "createdAt" | "updatedAt">;
