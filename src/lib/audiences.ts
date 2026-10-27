export const AUDIENCE_BUCKETS = ["Students", "Partners"] as const;

export interface Audience {
  id: string;
  segment: string;
  description: string;
  bucket: typeof AUDIENCE_BUCKETS[number];
  createdAt?: string;
  updatedAt?: string;
}

export type AudienceWriteInput = Omit<Audience, "id" | "createdAt" | "updatedAt">;
