import type { PodMentor } from "@/lib/types";

export function parseExpertiseTags(value: string): string[] {
  return [...new Set(value.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean))];
}

export function formatExpertiseTags(tags: string[]): string {
  return tags.join(", ");
}

export function normalizeMentor(mentor: Partial<PodMentor> & { id: string }): PodMentor {
  return {
    id: mentor.id,
    collegeId: mentor.collegeId ?? "",
    collegeName: mentor.collegeName,
    name: mentor.name ?? "",
    expertise: Array.isArray(mentor.expertise)
      ? [...new Set(mentor.expertise.map((tag) => tag.trim()).filter(Boolean))]
      : [],
    createdAt: mentor.createdAt,
    updatedAt: mentor.updatedAt,
  };
}
