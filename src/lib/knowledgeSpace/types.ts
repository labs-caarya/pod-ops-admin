export const KNOWLEDGE_RESOURCE_DOMAINS = [
  "Business Strategy",
  "Business Development",
  "Engineering and Technology",
  "Product Strategy and Management",
  "Talent Development",
  "Startup Research",
  "Marketing",
  "Founder Outreach",
] as const;

export type KnowledgeResourceType = "docs" | "html" | "pdf" | "in-app";
export type KnowledgeResourceWriteType = "docs" | "html";
export type KnowledgeResourceCategory = "caarya-curated" | "community";
export type KnowledgeResourceDomain = (typeof KNOWLEDGE_RESOURCE_DOMAINS)[number];

export interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: KnowledgeResourceType;
  category: KnowledgeResourceCategory | "pod";
  domain: string;
  tags: string[];
  curatedByName: string;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdByCollegeId?: string | null;
  createdByCollegeName?: string | null;
  createdByRole?: string;
  source?: "seed" | "admin" | "member" | "pod-activation";
  canEdit: boolean;
  canDelete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeResourceOptions {
  types: KnowledgeResourceWriteType[];
  displayTypes: KnowledgeResourceType[];
  domains: KnowledgeResourceDomain[];
  categories: KnowledgeResourceCategory[];
  permissions: {
    canCreateCommunity: boolean;
    canCreateCurated: boolean;
  };
}

export interface KnowledgeResourceWriteInput {
  title: string;
  description: string;
  url: string;
  type: KnowledgeResourceWriteType;
  category: KnowledgeResourceCategory;
  domain: KnowledgeResourceDomain;
  tags: string[];
}

export function groupKnowledgeResourcesByDomain(resources: KnowledgeResource[]) {
  const groups = new Map<string, KnowledgeResource[]>();
  for (const resource of resources) {
    const domain = resource.domain.trim() || "General";
    groups.set(domain, [...(groups.get(domain) ?? []), resource]);
  }
  return Array.from(groups.entries())
    .sort(([left], [right]) => {
      const leftIndex = KNOWLEDGE_RESOURCE_DOMAINS.indexOf(left as KnowledgeResourceDomain);
      const rightIndex = KNOWLEDGE_RESOURCE_DOMAINS.indexOf(right as KnowledgeResourceDomain);
      if (leftIndex !== rightIndex) return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      return left.localeCompare(right);
    })
    .map(([domain, items]) => ({ domain, items: [...items].sort((a, b) => a.title.localeCompare(b.title)) }));
}
