/** Domain types for the Pod Operating Portal. Shapes mirror REST resources so
 *  the localStorage store can be swapped for chronos-be / chirag-ai later. */

export interface PodProfile {
  id: string;
  name: string;
  crew: string;
  college: string;
  level: number;
  tagline: string;
}

/* ----------------------------- Research (HIVE) ---------------------------- */

export type ResearchStatus =
  | "Research"
  | "Scored"
  | "Outreach Sent"
  | "In Conversation"
  | "Partner"
  | "Archived";

export type EntityKind = "Startup" | "Brand";

/** What the pod is researching toward in HIVE. */
export type SearchTarget = "Academic Partner" | "Campus Company" | "Industry Partner";

/** Industry-partner stage when searchTarget is Industry Partner. */
export type IndustryPartnerStage =
  | "Idea stage startup"
  | "Early stage startup"
  | "Angel Funded Startup"
  | "Established Brand";

export interface ResearchScores {
  gapMatch: number;
  podFit: number;
  businessHealth: number;
  socialPresence: number;
  peopleCulture: number;
}

export interface ResearchProfile {
  id: string;
  name: string;
  /** @deprecated Use searchTarget + industryStage; kept for legacy profiles. */
  kind: EntityKind;
  searchTarget: SearchTarget;
  /** Set when searchTarget is Industry Partner. */
  industryStage?: IndustryPartnerStage;
  sector: string;
  city: string;
  website: string;
  founded: string;
  status: ResearchStatus;

  founderName: string;
  founderBackground: string;
  founderActive: boolean;

  instagramFollowers: string;
  linkedinFollowers: string;
  socialFeel: string;

  productClarity: number;
  designQuality: string;
  gaps: string;

  teamSize: string;
  fundingStage: string;
  openRoles: string;

  strengths: string;
  offer: string;
  redFlags: string;
  verdict: string;

  scores: ResearchScores;
  createdAt?: string;
  updatedAt?: string;
}

/* ------------------------------- Rolodex ---------------------------------- */

export type OutreachStage =
  | "to_contact"
  | "outreach_sent"
  | "in_conversation"
  | "meeting"
  | "proposal"
  | "partner"
  | "passed";

export interface ContactNote {
  id: string;
  ts: string;
  text: string;
}

export interface Contact {
  id: string;
  researchId: string;
  company: string;
  sector: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  linkedin: string;
  channel: string;
  stage: OutreachStage;
  hypothesis: string;
  nextAction: string;
  nextActionDate: string;
  owner: string;
  notes: ContactNote[];
  createdAt?: string;
  updatedAt?: string;
}

/* ----------------------------- Talent map --------------------------------- */

export type TalentStatus = "Available" | "Engaged" | "Placed" | "Bench";

/** Distribution bucket on the talent map & dashboard. */
export type TalentRole =
  | "Developer"
  | "Designer"
  | "Video Editor"
  | "Nano-Influencer"
  | "Researcher"
  | "Event Ops"
  | "Content Creator"
  | "Data Analyst"
  | "Partnerships";

/** Leaf services a student can opt into providing. */
export type PodServiceId =
  | "talent_placement"
  | "innovation_consulting"
  | "event_orchestration"
  | "testing_360"
  | "focus_groups"
  | "market_research"
  | "nano_influencer_marketing";

export interface TalentMember {
  id: string;
  name: string;
  avatarColor?: string;
  college: string;
  /** When the member belongs to an academic partner, set partnerId. */
  partnerId?: string;
  primarySkill: string;
  skills: string[];
  /** Role bucket for talent distribution charts. */
  talentRole: TalentRole;
  /** Services this student has opted in to deliver for the pod. */
  serviceOfferings: PodServiceId[];
  level: "Explorer" | "Builder" | "Specialist" | "Lead";
  status: TalentStatus;
  availability: string;
  placedAt?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

/* --------------------------- Job opportunities ---------------------------- */

export type JobStatus = "Draft" | "Open" | "Shared" | "Filled" | "Closed";
export type JobType = "Internship" | "Freelance" | "Part-time" | "Full-time" | "Project";

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  researchId?: string;
  type: JobType;
  status: JobStatus;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  stipend: string;
  skills: string[];
  description: string;
  seats: number;
  applicants: number;
  sharedChannels: string[];
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------- Partners -------------------------------- */

export type PartnerType = "Academic" | "Industry" | "Campus Company";
export type PartnerKind =
  | "Club"
  | "Council"
  | "College"
  | "Company"
  | "Incubator"
  | "Community"
  | "Student Startup";
export type PartnerStage = "Prospect" | "Engaged" | "Active" | "Strategic";

export interface SponsorshipAsset {
  id: string;
  label: string;
  /** Estimated leverage value in INR. */
  value: number;
  audience: number;
  format: string;
  status: "Available" | "Committed" | "Delivered";
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  kind: PartnerKind;
  city: string;
  stage: PartnerStage;
  owner: string;
  memberCount: number;
  description: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  /** Academic partners can be offered a sponsorship-leverage dashboard. */
  sponsorshipEnabled: boolean;
  sponsorshipAssets: SponsorshipAsset[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

/* --------------------------------- Goals ---------------------------------- */

export interface PodGoal {
  id: string;
  title: string;
  pillar: "Research" | "Network" | "Talent" | "Opportunities" | "Brand";
  target: number;
  current: number;
  unit: string;
  due: string;
}

/* --------------------------------- Ask ------------------------------------ */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
}
