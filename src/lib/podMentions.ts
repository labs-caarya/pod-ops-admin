import type { College, PodComment } from "@/lib/api";
import { formatPodRole, normalizePodRole } from "@/lib/podRoles";
import type { PodLeaderOption } from "@/lib/podLeaders";

export function filterPodsForMention(pods: College[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  const ranked = pods
    .map((pod) => {
      const name = pod.name.toLowerCase();
      if (!q) return { pod, score: 0 };
      if (name.startsWith(q)) return { pod, score: 0 };
      if (name.includes(q)) return { pod, score: 1 };
      return null;
    })
    .filter(Boolean) as { pod: College; score: number }[];

  return ranked
    .sort((left, right) => left.score - right.score || left.pod.name.localeCompare(right.pod.name))
    .slice(0, limit)
    .map((entry) => entry.pod);
}

/** Resolve college id from the first @Pod name mention in text (longest name wins). */
export function resolveCollegeIdFromMentions(body: string, pods: College[]): string | null {
  const sorted = [...pods].sort((a, b) => b.name.length - a.name.length);
  for (const pod of sorted) {
    if (body.includes(`@${pod.name}`)) return pod.id;
  }
  return null;
}

export type SlashMode = "none" | "visibility" | "leaders";

export type ComposeTrigger =
  | { type: "pod"; start: number; query: string }
  | { type: "role"; start: number; query: string }
  | { type: "visibility"; start: number; query: string };

export const VISIBILITY_SLASH_OPTIONS = [
  { key: "admin", slash: "admin", visibility: "admin" as const, label: "Admins only" },
  { key: "pod", slash: "pod", visibility: "both" as const, label: "Admins + pod" },
] satisfies ReadonlyArray<{
  key: string;
  slash: string;
  visibility: PodComment["visibility"];
  label: string;
}>;

function isClosedToken(query: string) {
  return query.endsWith(" ") && query.trim().length > 0;
}

export function activeComposeTrigger(
  text: string,
  cursor: number,
  slashMode: SlashMode = "none",
): ComposeTrigger | null {
  const before = text.slice(0, cursor);
  const at = before.match(/@([^@\n]*)$/);
  const slash = before.match(/\/([^/\n]*)$/);
  const atStart = at ? before.length - at[0].length : -1;
  const slashStart = slash ? before.length - slash[0].length : -1;

  if (atStart > slashStart && at) {
    const query = at[1];
    if (isClosedToken(query)) return null;
    return { type: "pod", start: atStart, query };
  }
  if (slashStart >= 0 && slash && slashStart > atStart) {
    const query = slash[1];
    if (isClosedToken(query)) return null;
    if (slashMode === "visibility") return { type: "visibility", start: slashStart, query };
    if (slashMode === "leaders") return { type: "role", start: slashStart, query };
    return null;
  }
  if (atStart >= 0 && at && atStart >= slashStart) {
    const query = at[1];
    if (isClosedToken(query)) return null;
    return { type: "pod", start: atStart, query };
  }
  return null;
}

export function activeMentionQuery(text: string, cursor: number): { start: number; query: string } | null {
  const active = activeComposeTrigger(text, cursor, "none");
  return active?.type === "pod" ? { start: active.start, query: active.query } : null;
}

export function filterVisibilityForMention(query: string) {
  const q = query.trim().toLowerCase();
  return VISIBILITY_SLASH_OPTIONS.filter((option) => {
    if (!q) return true;
    return option.slash.startsWith(q) || option.label.toLowerCase().includes(q);
  });
}

export function visibilitySlashToken(option: (typeof VISIBILITY_SLASH_OPTIONS)[number]) {
  return `/${option.slash} `;
}

export function resolveVisibilityFromSlash(body: string): PodComment["visibility"] | null {
  const matches = [...body.matchAll(/\/(admin|pod)\b/gi)];
  const last = matches.at(-1)?.[1]?.toLowerCase();
  if (last === "admin") return "admin";
  if (last === "pod") return "both";
  return null;
}

export function stripCommentVisibilitySlashes(body: string): string {
  return body
    .replace(/\/admin(?=\s|$)/gi, "")
    .replace(/\/pod(?=\s|$)/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function prepareCommentBody(raw: string): { body: string; visibility: PodComment["visibility"] } {
  const visibility = resolveVisibilityFromSlash(raw) ?? "both";
  const body = stripCommentVisibilitySlashes(raw);
  return { body, visibility };
}

export function filterLeadersForMention(leaders: PodLeaderOption[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  const ranked = leaders
    .map((leader) => {
      const roleLabel = formatPodRole(leader.role).toLowerCase();
      const name = (leader.user.name || leader.user.username || "").toLowerCase();
      if (!q) return { leader, score: 0 };
      if (roleLabel.startsWith(q) || leader.role.startsWith(q)) return { leader, score: 0 };
      if (name.startsWith(q)) return { leader, score: 1 };
      if (roleLabel.includes(q) || name.includes(q)) return { leader, score: 2 };
      return null;
    })
    .filter(Boolean) as { leader: PodLeaderOption; score: number }[];

  return ranked
    .sort((left, right) => left.score - right.score || left.leader.label.localeCompare(right.leader.label))
    .slice(0, limit)
    .map((entry) => entry.leader);
}

export function resolveLeaderKeyFromSlash(body: string, leaders: PodLeaderOption[]): string | null {
  const matches = [...body.matchAll(/\/([^/\n]+?)(?=\s|$)/g)];
  const token = matches.at(-1)?.[1]?.trim();
  if (!token) return null;
  const q = token.toLowerCase();
  if (q === "admin" || q === "pod") return null;
  for (const leader of leaders) {
    const roleLabel = formatPodRole(leader.role).toLowerCase();
    if (leader.role === q || roleLabel === q) return leader.key;
    if (roleLabel.startsWith(q) || leader.role.startsWith(q)) return leader.key;
    if (roleLabel.includes(q)) return leader.key;
    const name = (leader.user.name || leader.user.username || "").toLowerCase();
    if (name.startsWith(q) || name.includes(q)) return leader.key;
  }
  return null;
}

/** Task title/body with @pod and /role tokens removed. */
export function stripAllocationTokens(body: string, pods: College[]): { title: string; description: string } {
  let text = body.trim();
  for (const pod of [...pods].sort((a, b) => b.name.length - a.name.length)) {
    text = text.replaceAll(`@${pod.name}`, " ");
  }
  text = text.replace(/\/[^\s\n]+/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { title: "", description: "" };
  if (lines.length === 1) return { title: lines[0], description: "" };
  return { title: lines[0], description: lines.slice(1).join("\n") };
}

export function roleSlashToken(leader: PodLeaderOption) {
  return `/${formatPodRole(leader.role)} `;
}

export function leaderMatchesGoal(
  goal: { collegeId: string; assignedPodRole: string; assigneeName?: string },
  leader: PodLeaderOption,
) {
  if (goal.collegeId !== leader.user.collegeId) return false;
  if (normalizePodRole(goal.assignedPodRole) !== leader.role) return false;
  const assignee = goal.assigneeName?.trim().toLowerCase();
  if (!assignee) return true;
  const name = (leader.user.name || leader.user.username || "").trim().toLowerCase();
  return name === assignee;
}
