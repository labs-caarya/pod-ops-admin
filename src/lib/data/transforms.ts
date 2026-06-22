import { makeId } from "../utils";
import type { Contact, ResearchProfile } from "../types";

export function emptyResearch(): ResearchProfile {
  return {
    id: makeId("res"),
    name: "",
    kind: "Brand",
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

export function contactFromResearch(research: ResearchProfile): Contact {
  return {
    id: makeId("con"),
    researchId: research.id,
    company: research.name,
    sector: research.sector,
    contactName: research.founderName || "",
    contactRole: research.founderName ? "Founder" : "",
    email: "",
    phone: "",
    linkedin: "",
    channel: research.founderActive ? "LinkedIn" : "Email",
    stage: "to_contact",
    hypothesis: research.offer || research.gaps || "",
    nextAction: "Draft and send first outreach message",
    nextActionDate: "",
    owner: "",
    notes: [],
  };
}
