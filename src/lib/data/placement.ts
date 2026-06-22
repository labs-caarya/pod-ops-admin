import type { JobOpportunity, OpportunitySource, TalentMember } from "@/lib/types";
import { normalizeTalent } from "./services";

export interface CandidateMatch {
  talent: TalentMember;
  score: number;
  reasons: string[];
}

const STATUS_BONUS: Record<TalentMember["status"], number> = {
  Available: 18,
  Engaged: 12,
  Bench: 6,
  Placed: 0,
};

const SKILL_ALIASES: Record<string, string[]> = {
  events: ["event", "on-ground", "logistics", "vendor"],
  reels: ["ugc", "content", "instagram", "copywriting", "video"],
  research: ["survey", "excel", "market research", "data"],
  design: ["figma", "branding", "illustration"],
  outreach: ["sales", "partnerships", "communication"],
};

function skillOverlap(jobSkills: string[], member: TalentMember): { score: number; hits: string[] } {
  const hay = [
    member.primarySkill ?? "",
    ...(Array.isArray(member.skills) ? member.skills : []),
    member.talentRole ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const hits: string[] = [];
  let score = 0;

  for (const skill of jobSkills) {
    const key = skill.toLowerCase();
    const aliases = SKILL_ALIASES[key] ?? [key];
    if (aliases.some((a) => hay.includes(a)) || hay.includes(key)) {
      hits.push(skill);
      score += 22;
    }
  }

  return { score: Math.min(score, 66), hits };
}

function serviceBonus(job: JobOpportunity, member: TalentMember): { score: number; reason?: string } {
  const offerings = member.serviceOfferings ?? [];
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const desc = `${job.title ?? ""} ${job.description ?? ""} ${skills.join(" ")}`.toLowerCase();

  if (desc.match(/event|activation|on-ground|promoter/) && offerings.includes("event_orchestration")) {
    return { score: 14, reason: "Offers event orchestration" };
  }
  if (desc.match(/ugc|reel|content|influencer|social/) && offerings.includes("nano_influencer_marketing")) {
    return { score: 14, reason: "Nano-influencer / promotion service" };
  }
  if (desc.match(/research|survey|panel|data/) && offerings.includes("market_research")) {
    return { score: 14, reason: "Market research service" };
  }
  if (desc.match(/research|survey|panel/) && offerings.includes("focus_groups")) {
    return { score: 10, reason: "Focus group capability" };
  }
  if (offerings.includes("talent_placement") && job.source === "partner") {
    return { score: 8, reason: "Talent placement track record" };
  }
  return { score: 0 };
}

export function normalizeJob(job: JobOpportunity): JobOpportunity {
  const rawSkills = job.skills as string[] | string | undefined;
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === "string"
      ? rawSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  const base: JobOpportunity = {
    ...job,
    skills,
    sharedChannels: Array.isArray(job.sharedChannels) ? job.sharedChannels : [],
    title: job.title ?? "",
    company: job.company ?? "",
    description: job.description ?? "",
  };

  if (base.source) return base;
  if (base.partnerId) return { ...base, source: "partner" };
  if (base.researchId) return { ...base, source: "researched" };
  return { ...base, source: "researched" };
}

export function opportunitySourceLabel(source: OpportunitySource): string {
  return source === "partner" ? "Partner opportunity" : "Researched opportunity";
}

export function scoreCandidate(job: JobOpportunity, raw: TalentMember): CandidateMatch {
  const talent = normalizeTalent(raw);
  const normalizedJob = normalizeJob(job);
  const jobSkills = normalizedJob.skills;
  const reasons: string[] = [];
  let score = STATUS_BONUS[talent.status] ?? 0;

  if (talent.status === "Available") reasons.push("Available now");
  else if (talent.status === "Engaged") reasons.push("Currently engaged — confirm bandwidth");
  else if (talent.status === "Placed") reasons.push("Already placed — low priority");

  const overlap = skillOverlap(jobSkills, talent);
  score += overlap.score;
  if (overlap.hits.length) reasons.push(`Skills: ${overlap.hits.join(", ")}`);

  const svc = serviceBonus(normalizedJob, talent);
  score += svc.score;
  if (svc.reason) reasons.push(svc.reason);

  if (talent.talentRole === "Event Ops" && jobSkills.some((s) => /event|on-ground/i.test(s))) {
    score += 8;
    reasons.push("Event Ops role fit");
  }
  if (
    (talent.talentRole === "Nano-Influencer" || talent.talentRole === "Content Creator") &&
    jobSkills.some((s) => /reel|ugc|content/i.test(s))
  ) {
    score += 8;
    reasons.push("Content creator fit");
  }
  if (talent.talentRole === "Researcher" && jobSkills.some((s) => /research|survey/i.test(s))) {
    score += 8;
    reasons.push("Researcher role fit");
  }

  return {
    talent,
    score: Math.min(100, score),
    reasons: reasons.slice(0, 4),
  };
}

export function recommendCandidates(job: JobOpportunity, talent: TalentMember[]): CandidateMatch[] {
  const normalized = normalizeJob(job);
  return talent
    .map((t) => scoreCandidate(normalized, t))
    .filter((m) => m.score >= 25 && m.talent.status !== "Placed")
    .sort((a, b) => b.score - a.score);
}

/** Talent tied to a partner opportunity — affiliated, prior placement, or past offers on sibling jobs. */
export function getPartnerRoster(
  job: JobOpportunity,
  talent: TalentMember[],
  allJobs: JobOpportunity[],
  offers: { jobId: string; talentId: string }[],
): CandidateMatch[] {
  const normalized = normalizeJob(job);
  if (normalized.source !== "partner" || !normalized.partnerId) return [];

  const companyHay = normalized.company.toLowerCase();
  const rosterIds = new Set<string>();

  for (const t of talent) {
    const member = normalizeTalent(t);
    if (member.partnerId === normalized.partnerId) rosterIds.add(member.id);
    if (member.placedAt?.toLowerCase().includes(companyHay)) rosterIds.add(member.id);
  }

  const siblingJobIds = allJobs
    .map(normalizeJob)
    .filter((j) => j.partnerId === normalized.partnerId)
    .map((j) => j.id);

  for (const offer of offers) {
    if (siblingJobIds.includes(offer.jobId)) rosterIds.add(offer.talentId);
  }

  return [...rosterIds]
    .map((id) => {
      const raw = talent.find((t) => t.id === id);
      return raw ? scoreCandidate(normalized, raw) : null;
    })
    .filter((m): m is CandidateMatch => m !== null)
    .sort((a, b) => b.score - a.score);
}

export function searchTalentRoster(
  job: JobOpportunity,
  talent: TalentMember[],
  query: string,
  statusFilter: string = "all",
): CandidateMatch[] {
  const normalized = normalizeJob(job);
  const q = query.trim().toLowerCase();

  return talent
    .filter((t) => {
      const member = normalizeTalent(t);
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        member.name,
        member.talentRole,
        member.primarySkill,
        member.college,
        ...member.skills,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .map((t) => scoreCandidate(normalized, t))
    .sort((a, b) => b.score - a.score);
}

export function placementModeCopy(source: OpportunitySource): {
  headline: string;
  action: string;
  sentLabel: string;
} {
  if (source === "partner") {
    return {
      headline: "Plan direct offers",
      action: "Send offer to selected talent",
      sentLabel: "Direct offers sent",
    };
  }
  return {
    headline: "Refer to good-fit candidates",
    action: "Send referral offer",
    sentLabel: "Referrals sent",
  };
}
