export const EVENT_TYPES = ["Discover", "Build", "Lead", "Learn", "Network", "Follow your passion"] as const;

export interface AdminEvent {
  id: string;
  name: string;
  description: string;
  eventType: typeof EVENT_TYPES[number];
  tags: string[];
  guidelinesUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminEventWriteInput = Omit<AdminEvent, "id" | "createdAt" | "updatedAt">;
