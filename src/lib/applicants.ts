import type { Profile, TechnicalSkill, Tool } from "@/lib/api";
import {
  CAREER_LOOKING_OPTIONS,
  ENGAGEMENT_GIGS,
  HUMAN_CENTRICITY_QUESTIONS,
  HUMAN_LABELS,
  PROFICIENCY_LABELS,
  TRANSFERABLE_SKILL_CATEGORIES,
} from "@/lib/profileConfig";

/** Roles/tools/skills can arrive as plain strings or `{ name | label | value }` objects. */
export function displayValue(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    return String(obj.name ?? obj.label ?? obj.value ?? "");
  }
  return item == null ? "" : String(item);
}

export function clampRating(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.max(1, Math.min(5, Math.round(num)));
}

export function proficiencyLabel(value: unknown): string {
  const rating = clampRating(value);
  return rating ? PROFICIENCY_LABELS[rating - 1] : "Not rated";
}

export function topSkills(profile: Profile): TechnicalSkill[] {
  return [...(profile.technicalSkills ?? [])].sort(
    (a, b) => clampRating(b.proficiency) - clampRating(a.proficiency),
  );
}

export function profileRoles(profile: Profile): string[] {
  return (profile.roles ?? []).map(displayValue).filter(Boolean);
}

export function profileTools(profile: Profile): string[] {
  return ((profile.tools ?? []) as Tool[]).map(displayValue).filter(Boolean);
}

export function skillDomains(profile: Profile): { domain: string; skills: TechnicalSkill[] }[] {
  const groups = new Map<string, TechnicalSkill[]>();
  for (const skill of topSkills(profile)) {
    const domain = skill.domain?.trim() || "General";
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain)!.push(skill);
  }
  return Array.from(groups.entries()).map(([domain, skills]) => ({ domain, skills }));
}

export function ratedTransferableSkills(profile: Profile): { name: string; rating: number }[] {
  const raw = profile.transferableSkills;
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw as Record<string, unknown>)
    .map(([name, value]) => ({ name, rating: clampRating(value) }))
    .filter((entry) => entry.rating > 0)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
}

export function ratedTechnicalCount(profile: Profile): number {
  return (profile.technicalSkills ?? []).filter((skill) => clampRating(skill.proficiency) > 0).length;
}

export function topTransferableSkills(profile: Profile, limit = 2) {
  return ratedTransferableSkills(profile).slice(0, limit);
}

export function topTools(profile: Profile, limit = 3) {
  return profileTools(profile).slice(0, limit);
}

export function transferableSkillGroups(profile: Profile): { category: string; skills: { name: string; rating: number }[] }[] {
  const rated = new Map(ratedTransferableSkills(profile).map((entry) => [entry.name, entry.rating]));
  const known = new Set<string>();

  const grouped: { category: string; skills: { name: string; rating: number }[] }[] = TRANSFERABLE_SKILL_CATEGORIES.map((group) => ({
    category: group.category,
    skills: group.skills
      .map((name) => {
        const rating = rated.get(name) ?? 0;
        if (rating > 0) known.add(name);
        return rating > 0 ? { name, rating } : null;
      })
      .filter(Boolean) as { name: string; rating: number }[],
  })).filter((group) => group.skills.length > 0);

  const other = ratedTransferableSkills(profile).filter((entry) => !known.has(entry.name));
  if (other.length) {
    grouped.push({ category: "Other", skills: other });
  }

  return grouped;
}

export function humanCentricityEntries(profile: Profile): { id: string; text: string; rating: number }[] {
  const responses = profile.humanCentricity?.responses ?? {};
  return HUMAN_CENTRICITY_QUESTIONS.map((question) => ({
    id: question.id,
    text: question.text,
    rating: clampRating(responses[question.id]),
  })).filter((entry) => entry.rating > 0);
}

export function humanCentricitySummary(profile: Profile) {
  const scores = humanCentricityEntries(profile).map((entry) => entry.rating);
  if (!scores.length) return { average: 0, rounded: 0, label: "Not rated" };
  const average = Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1));
  const rounded = Math.max(1, Math.min(5, Math.round(average)));
  return { average, rounded, label: HUMAN_LABELS[rounded - 1] };
}

/** Display alias — API field remains `humanCentricity`. */
export const workPersonalityEntries = humanCentricityEntries;
export const workPersonalitySummary = humanCentricitySummary;

export function previousExperienceSummary(profile: Profile): string {
  const personal = profile.personal;
  if (personal.hasProjectExperience === false) {
    return "No prior project or work experience";
  }
  if (personal.hasProjectExperience === true && personal.projectsWorkedOn?.trim()) {
    const count = personal.projectsWorkedOn.trim();
    const suffix = count === "1" ? "" : "s";
    if (personal.experienceType === "industrial") {
      return `${count} industrial work experience${suffix}`;
    }
    if (personal.experienceType === "academic") {
      return `${count} school, club, or college project${suffix}`;
    }
    return `${count} project${suffix} worked on before`;
  }
  if (personal.projectsWorkedOn?.trim()) {
    const raw = personal.projectsWorkedOn.trim();
    if (/^\d+$/.test(raw)) {
      return `${raw} project${raw === "1" ? "" : "s"} worked on`;
    }
    return raw;
  }
  return "Not provided";
}

export function lookingForLabels(profile: Profile): string[] {
  return (profile.lookingFor ?? [])
    .map((id) => CAREER_LOOKING_OPTIONS.find((option) => option.id === id)?.title ?? displayValue(id))
    .filter(Boolean);
}

export function engagementGigLabels(profile: Profile): string[] {
  return (profile.engagementGigs ?? [])
    .map((id) => ENGAGEMENT_GIGS.find((gig) => gig.id === id)?.title ?? displayValue(id))
    .filter(Boolean);
}

export function nanoInfluencerDetails(profile: Profile) {
  const nano = profile.nanoInfluencer;
  if (!nano || nano.interested !== true) return null;
  return {
    instagramHandle: nano.instagramHandle?.trim() || "",
    followers: nano.followers?.trim() || "",
  };
}

export function formatWorkPreferences(workPreferences: Profile["workPreferences"]): { label: string; values: string[] }[] {
  if (!workPreferences || typeof workPreferences !== "object") return [];

  return Object.entries(workPreferences)
    .map(([key, value]) => {
      const values = Array.isArray(value)
        ? value.map(displayValue).filter(Boolean)
        : typeof value === "string" && value.trim()
          ? [value.trim()]
          : [];
      if (!values.length) return null;
      return {
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).trim(),
        values,
      };
    })
    .filter(Boolean) as { label: string; values: string[] }[];
}
