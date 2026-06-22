import type { Partner, PodServiceId, SponsorshipAsset, TalentMember } from "@/lib/types";
import {
  getCategoryStrength,
  getServiceStrength,
  getTalentDistribution,
  normalizeTalent,
} from "./services";

/** How each Caarya service is pitched to an industry sponsor. */
export const INDUSTRY_SERVICE_PITCH: Record<PodServiceId, string> = {
  talent_placement: "Student ambassadors and campus crews placed on your campaigns.",
  innovation_consulting: "Workshops, ideation sprints and startup-style problem-solving with students.",
  event_orchestration: "On-ground activations, college events and promoter networks.",
  testing_360: "Product trials, mystery shopping and real student feedback loops.",
  focus_groups: "Moderated student panels for positioning, packaging and messaging.",
  market_research: "Surveys, data collection and insight reports from campus audiences.",
  nano_influencer_marketing: "UGC, reels and nano-influencer distribution in college networks.",
};

const ASSET_SERVICE_HINTS: Record<PodServiceId, RegExp> = {
  talent_placement: /ambassador|crew|talent|placement/i,
  innovation_consulting: /workshop|case|competition|bootcamp|session/i,
  event_orchestration: /on-ground|event|conclave|activation|sampling|stage/i,
  testing_360: /test|trial|sampling/i,
  focus_groups: /panel|focus|discussion/i,
  market_research: /research|survey|newsletter|email|data/i,
  nano_influencer_marketing: /social|ugc|content|branding|influencer|instagram/i,
};

export interface LeverageDeliverable {
  serviceId: PodServiceId;
  label: string;
  category: string;
  pitch: string;
  talentCount: number;
  linkedAssets: string[];
}

export interface LeverageSnapshot {
  totalLeverage: number;
  committed: number;
  availableLeverage: number;
  totalAudience: number;
  assetCount: number;
  mappedTalent: number;
  availableTalent: number;
  activeServices: number;
  roleCount: number;
  deliverables: LeverageDeliverable[];
  categoryStrength: { label: string; count: number }[];
  pitchHeadline: string;
  pitchSummary: string;
}

function assetMatchesService(asset: SponsorshipAsset, serviceId: PodServiceId): boolean {
  const hay = `${asset.label} ${asset.format}`;
  return ASSET_SERVICE_HINTS[serviceId].test(hay);
}

export function getLeverageDeliverables(
  partner: Partner,
  talent: TalentMember[],
): LeverageDeliverable[] {
  const normalized = talent.map(normalizeTalent);
  const strength = getServiceStrength(normalized);

  return strength
    .filter((row) => row.count > 0)
    .map((row) => ({
      serviceId: row.id,
      label: row.label,
      category: row.category,
      pitch: INDUSTRY_SERVICE_PITCH[row.id],
      talentCount: row.count,
      linkedAssets: partner.sponsorshipAssets
        .filter((a) => assetMatchesService(a, row.id))
        .map((a) => a.label),
    }));
}

export function buildLeverageSnapshot(partner: Partner, talent: TalentMember[]): LeverageSnapshot {
  const normalized = talent.map(normalizeTalent);
  const totalLeverage = partner.sponsorshipAssets.reduce((s, a) => s + a.value, 0);
  const committed = partner.sponsorshipAssets
    .filter((a) => a.status !== "Available")
    .reduce((s, a) => s + a.value, 0);
  const totalAudience = partner.sponsorshipAssets.reduce((s, a) => s + a.audience, 0);
  const deliverables = getLeverageDeliverables(partner, normalized);
  const activeServices = deliverables.length;
  const roles = getTalentDistribution(normalized);

  const topServices = deliverables
    .slice()
    .sort((a, b) => b.talentCount - a.talentCount)
    .slice(0, 3)
    .map((d) => d.label.toLowerCase());

  const pitchHeadline = `Why sponsor ${partner.name}?`;
  const pitchSummary =
    activeServices > 0
      ? `${partner.name} mobilises ${normalized.length} mapped students across ${roles.length} roles, delivering ${topServices.join(", ")}${topServices.length < deliverables.length ? " and more" : ""} for industry partners — with ₹${(totalLeverage / 100000).toFixed(1)}L in sponsorship inventory and ${totalAudience.toLocaleString("en-IN")}+ combined audience reach.`
      : `${partner.name} offers ${partner.memberCount}+ member community reach in ${partner.city}. Map student talent and sponsorship assets to show industry partners what you can deliver.`;

  return {
    totalLeverage,
    committed,
    availableLeverage: totalLeverage - committed,
    totalAudience,
    assetCount: partner.sponsorshipAssets.length,
    mappedTalent: normalized.length,
    availableTalent: normalized.filter((t) => t.status === "Available").length,
    activeServices,
    roleCount: roles.length,
    deliverables,
    categoryStrength: getCategoryStrength(normalized),
    pitchHeadline,
    pitchSummary,
  };
}

export function assetsByFormat(assets: SponsorshipAsset[]): { format: string; audience: number; value: number }[] {
  const map = new Map<string, { audience: number; value: number }>();
  for (const a of assets) {
    const key = a.format || "Other";
    const cur = map.get(key) ?? { audience: 0, value: 0 };
    map.set(key, { audience: cur.audience + a.audience, value: cur.value + a.value });
  }
  return [...map.entries()]
    .map(([format, stats]) => ({ format, ...stats }))
    .sort((a, b) => b.audience - a.audience);
}
