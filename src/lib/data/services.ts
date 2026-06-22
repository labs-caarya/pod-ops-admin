import type { PodServiceId, TalentMember, TalentRole } from "@/lib/types";

export interface PodServiceLeaf {
  id: PodServiceId;
  label: string;
}

export interface PodServiceGroup {
  id: string;
  label: string;
  services: PodServiceLeaf[];
}

/** Pod-deliverable services — strength = # mapped students opted in per service. */
export const POD_SERVICE_GROUPS: PodServiceGroup[] = [
  {
    id: "talent_placement",
    label: "Talent Placement",
    services: [{ id: "talent_placement", label: "Talent Placement" }],
  },
  {
    id: "innovation_consulting",
    label: "Innovation Consulting",
    services: [{ id: "innovation_consulting", label: "Innovation Consulting" }],
  },
  {
    id: "brand_engagement",
    label: "Brand Engagement",
    services: [
      { id: "event_orchestration", label: "Event Orchestration" },
      { id: "testing_360", label: "360° Testing" },
      { id: "focus_groups", label: "Focus Groups" },
      { id: "market_research", label: "Market Research" },
    ],
  },
  {
    id: "brand_promotion",
    label: "Brand Promotion",
    services: [{ id: "nano_influencer_marketing", label: "Nano-Influencer Marketing" }],
  },
];

export const ALL_POD_SERVICES: PodServiceLeaf[] = POD_SERVICE_GROUPS.flatMap((g) => g.services);

export const TALENT_ROLES: TalentRole[] = [
  "Developer",
  "Designer",
  "Video Editor",
  "Nano-Influencer",
  "Researcher",
  "Event Ops",
  "Content Creator",
  "Data Analyst",
  "Partnerships",
];

const ROLE_FROM_SKILL: Record<string, TalentRole> = {
  partnerships: "Partnerships",
  content: "Content Creator",
  ugc: "Content Creator",
  design: "Designer",
  figma: "Designer",
  research: "Researcher",
  survey: "Researcher",
  event: "Event Ops",
  logistics: "Event Ops",
  data: "Data Analyst",
  sql: "Data Analyst",
  python: "Developer",
  developer: "Developer",
  video: "Video Editor",
  reels: "Nano-Influencer",
  influencer: "Nano-Influencer",
};

function inferRole(member: Partial<TalentMember>): TalentRole {
  const hay = `${member.primarySkill ?? ""} ${(member.skills ?? []).join(" ")}`.toLowerCase();
  for (const [key, role] of Object.entries(ROLE_FROM_SKILL)) {
    if (hay.includes(key)) return role;
  }
  return "Content Creator";
}

function inferServices(member: Partial<TalentMember>): PodServiceId[] {
  if (member.serviceOfferings?.length) return member.serviceOfferings;
  const role = member.talentRole ?? inferRole(member);
  const skills = `${member.primarySkill ?? ""} ${(member.skills ?? []).join(" ")}`.toLowerCase();
  const offerings = new Set<PodServiceId>();

  if (member.status === "Placed" || skills.includes("placement")) {
    offerings.add("talent_placement");
  }
  if (skills.includes("strategy") || skills.includes("consult")) {
    offerings.add("innovation_consulting");
  }
  if (role === "Event Ops" || skills.includes("event") || skills.includes("on-ground")) {
    offerings.add("event_orchestration");
  }
  if (skills.includes("survey") || skills.includes("research") || role === "Researcher") {
    offerings.add("market_research");
    offerings.add("focus_groups");
  }
  if (skills.includes("test") || skills.includes("qa")) {
    offerings.add("testing_360");
  }
  if (role === "Nano-Influencer" || role === "Content Creator" || skills.includes("reels") || skills.includes("ugc")) {
    offerings.add("nano_influencer_marketing");
  }
  if (role === "Partnerships" || skills.includes("outreach") || skills.includes("sales")) {
    offerings.add("talent_placement");
    offerings.add("innovation_consulting");
  }
  if (offerings.size === 0) offerings.add("talent_placement");

  return [...offerings];
}

export function normalizeTalent(member: TalentMember): TalentMember {
  return {
    ...member,
    talentRole: member.talentRole ?? inferRole(member),
    serviceOfferings: inferServices(member),
  };
}

export interface ServiceStrengthRow {
  id: PodServiceId;
  label: string;
  category: string;
  count: number;
}

export function getServiceStrength(talent: TalentMember[]): ServiceStrengthRow[] {
  const normalized = talent.map(normalizeTalent);
  return ALL_POD_SERVICES.map((svc) => {
    const group = POD_SERVICE_GROUPS.find((g) => g.services.some((s) => s.id === svc.id))!;
    return {
      id: svc.id,
      label: svc.label,
      category: group.label,
      count: normalized.filter((m) => m.serviceOfferings.includes(svc.id)).length,
    };
  });
}

export interface TalentDistributionRow {
  role: TalentRole;
  count: number;
}

export function getTalentDistribution(talent: TalentMember[]): TalentDistributionRow[] {
  const normalized = talent.map(normalizeTalent);
  return TALENT_ROLES.map((role) => ({
    role,
    count: normalized.filter((m) => m.talentRole === role).length,
  })).filter((r) => r.count > 0);
}

export function getCategoryStrength(talent: TalentMember[]): { label: string; count: number }[] {
  const rows = getServiceStrength(talent);
  return POD_SERVICE_GROUPS.map((group) => {
    const ids = new Set(group.services.map((s) => s.id));
    const count = rows.filter((r) => ids.has(r.id)).reduce((sum, r) => sum + r.count, 0);
    return { label: group.label, count };
  });
}

export function serviceLabel(id: PodServiceId): string {
  return ALL_POD_SERVICES.find((s) => s.id === id)?.label ?? id;
}
