import type { PodSuccessMeeting, PodSuccessMeetingInput, SuccessMeetingPulse } from "@/lib/api";

/** What the form holds while editing. Lists are kept as plain text and parsed on save. */
export interface SuccessMeetingDraft {
  meetingDate: string;
  pulse: SuccessMeetingPulse;
  attendees: string;
  summary: string;
  decisions: string;
  blockers: string;
  actionItems: { key: string; text: string; ownerRole: string; dueDate: string }[];
}

export const PULSE_OPTIONS: { value: SuccessMeetingPulse; label: string }[] = [
  { value: "", label: "Not rated" },
  { value: "strong", label: "Strong" },
  { value: "steady", label: "Steady" },
  { value: "struggling", label: "Struggling" },
];

export const LIMITS = { summary: 4000, line: 300, attendees: 40, decisions: 20, blockers: 20, actionItems: 20 } as const;

let counter = 0;
export const newItemKey = () => `item-${(counter += 1)}`;

export function todayIso(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function emptyDraft(now = new Date()): SuccessMeetingDraft {
  return { meetingDate: todayIso(now), pulse: "", attendees: "", summary: "", decisions: "", blockers: "", actionItems: [] };
}

export function draftFromMeeting(meeting: PodSuccessMeeting): SuccessMeetingDraft {
  return {
    meetingDate: meeting.meetingDate,
    pulse: meeting.pulse,
    attendees: meeting.attendees.join(", "),
    summary: meeting.summary,
    decisions: meeting.decisions.join("\n"),
    blockers: meeting.blockers.join("\n"),
    actionItems: meeting.actionItems.map((item) => ({ key: newItemKey(), text: item.text, ownerRole: item.ownerRole, dueDate: item.dueDate })),
  };
}

const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const commaList = (value: string) => value.split(/[,\n]/).map((name) => name.trim()).filter(Boolean);

/** Validates the draft and converts it to what the API accepts. Returns the first problem in plain words. */
export function toInput(draft: SuccessMeetingDraft, now = new Date()): { ok: true; input: PodSuccessMeetingInput } | { ok: false; error: string } {
  if (!draft.meetingDate) return { ok: false, error: "Choose the date of the meeting." };
  if (draft.meetingDate > todayIso(now)) return { ok: false, error: "A meeting that has not happened yet cannot be logged." };
  const summary = draft.summary.trim();
  if (!summary) return { ok: false, error: "Write the minutes before saving." };
  if (summary.length > LIMITS.summary) return { ok: false, error: `Minutes must be ${LIMITS.summary.toLocaleString()} characters or fewer.` };

  const attendees = commaList(draft.attendees);
  const decisions = lines(draft.decisions);
  const blockers = lines(draft.blockers);
  const actionItems = draft.actionItems.map((item) => ({ text: item.text.trim(), ownerRole: item.ownerRole, dueDate: item.dueDate })).filter((item) => item.text);

  if (attendees.length > LIMITS.attendees) return { ok: false, error: `List at most ${LIMITS.attendees} attendees.` };
  if (attendees.some((name) => name.length > 80)) return { ok: false, error: "Each attendee name must be 80 characters or fewer." };
  if (decisions.length > LIMITS.decisions) return { ok: false, error: `List at most ${LIMITS.decisions} decisions.` };
  if (blockers.length > LIMITS.blockers) return { ok: false, error: `List at most ${LIMITS.blockers} blockers.` };
  if (actionItems.length > LIMITS.actionItems) return { ok: false, error: `Add at most ${LIMITS.actionItems} action items.` };
  const tooLong = [...decisions, ...blockers, ...actionItems.map((item) => item.text)].find((text) => text.length > LIMITS.line);
  if (tooLong) return { ok: false, error: `Keep each decision, blocker and action item under ${LIMITS.line} characters.` };

  return { ok: true, input: { meetingDate: draft.meetingDate, pulse: draft.pulse, attendees, summary, decisions, blockers, actionItems } };
}
