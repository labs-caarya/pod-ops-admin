import type { OutreachStage } from "./types";
import type { Tone } from "@/components/ui/Badge";

export { pct } from "./utils";

export const CLOSED_WIN: OutreachStage = "partner";

export const OUTREACH_STAGES: {
  key: OutreachStage;
  label: string;
  tone: Tone;
}[] = [
  { key: "to_contact", label: "To Contact", tone: "muted" },
  { key: "outreach_sent", label: "Outreach Sent", tone: "info" },
  { key: "in_conversation", label: "In Conversation", tone: "amber" },
  { key: "meeting", label: "Meeting Booked", tone: "amber" },
  { key: "proposal", label: "Proposal Sent", tone: "ruby" },
  { key: "partner", label: "Partner Won", tone: "good" },
  { key: "passed", label: "Passed", tone: "bad" },
];

export const CHANNELS = [
  "Email",
  "LinkedIn",
  "Twitter / X",
  "Warm Intro",
  "Instagram DM",
  "WhatsApp",
  "Other",
];

export const RESEARCH_STATUSES = [
  "Research",
  "Scored",
  "Outreach Sent",
  "In Conversation",
  "Partner",
  "Archived",
] as const;

export const SEARCH_TARGETS = [
  "Academic Partner",
  "Campus Company",
  "Industry Partner",
] as const;

export const INDUSTRY_PARTNER_STAGES = [
  "Idea stage startup",
  "Early stage startup",
  "Angel Funded Startup",
  "Established Brand",
] as const;

export const SEARCH_TARGET_TONE: Record<string, Tone> = {
  "Academic Partner": "info",
  "Campus Company": "ruby",
  "Industry Partner": "amber",
};

export const TALENT_STATUS_TONE: Record<string, Tone> = {
  Available: "good",
  Engaged: "amber",
  Placed: "info",
  Bench: "muted",
};

export const JOB_STATUS_TONE: Record<string, Tone> = {
  Draft: "muted",
  Open: "amber",
  Shared: "good",
  Filled: "info",
  Closed: "bad",
};

export const PARTNER_STAGE_TONE: Record<string, Tone> = {
  Prospect: "muted",
  Engaged: "info",
  Active: "amber",
  Strategic: "good",
};
