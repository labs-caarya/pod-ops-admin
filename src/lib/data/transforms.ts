import { makeId } from "../utils";
import type { Contact, IndustryPartnerStage, ResearchProfile, SearchTarget } from "../types";

/** Map industry stage to legacy EntityKind for backward compatibility. */
export function kindFromIndustryStage(stage?: IndustryPartnerStage): ResearchProfile["kind"] {
  return stage === "Established Brand" ? "Brand" : "Startup";
}

export function normalizeResearch(profile: ResearchProfile): ResearchProfile {
  const searchTarget = profile.searchTarget ?? "Industry Partner";
  const industryStage =
    profile.industryStage ??
    (searchTarget === "Industry Partner"
      ? profile.kind === "Brand"
        ? "Established Brand"
        : "Early stage startup"
      : undefined);

  return {
    ...profile,
    searchTarget,
    industryStage,
    kind: profile.kind ?? kindFromIndustryStage(industryStage),
  };
}

export function emptyResearch(): ResearchProfile {
  return {
    id: makeId("res"),
    name: "",
    kind: "Startup",
    searchTarget: "Industry Partner",
    industryStage: "Early stage startup",
    sector: "",
    city: "",
    website: "",
    founded: "",
    status: "Research",
    founderName: "",
    founderBackground: "",
    founderActive: false,
    instagramFollowers: "",
    linkedinFollowers: "",
    socialFeel: "",
    productClarity: 3,
    designQuality: "",
    gaps: "",
    teamSize: "",
    fundingStage: "",
    openRoles: "",
    strengths: "",
    offer: "",
    redFlags: "",
    verdict: "",
    scores: { gapMatch: 3, podFit: 3, businessHealth: 3, socialPresence: 3, peopleCulture: 3 },
  };
}

export function searchTargetLabel(profile: ResearchProfile): string {
  const p = normalizeResearch(profile);
  if (p.searchTarget === "Industry Partner" && p.industryStage) {
    return p.industryStage;
  }
  return p.searchTarget;
}

export function contactFromResearch(research: ResearchProfile): Contact {
  const p = normalizeResearch(research);
  const channelByTarget: Record<SearchTarget, string> = {
    "Academic Partner": "Email",
    "Campus Company": "WhatsApp",
    "Industry Partner": p.founderActive ? "LinkedIn" : "Email",
  };

  return {
    id: makeId("con"),
    researchId: p.id,
    company: p.name,
    sector: p.sector,
    contactName: p.founderName || "",
    contactRole: p.founderName ? "Founder" : "",
    email: "",
    phone: "",
    linkedin: "",
    channel: channelByTarget[p.searchTarget],
    stage: "to_contact",
    hypothesis: p.offer || p.gaps || "",
    nextAction: "Draft and send first outreach message",
    nextActionDate: "",
    owner: "",
    notes: [],
  };
}
