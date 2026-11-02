import type { PodRoleApi } from "@/lib/podRoles";

export const TALENT_PROGRAMS = [
  { id: "experience-studio", name: "Experience Studio" },
  { id: "castle-entrepreneurship", name: "CASTLE for Entrepreneurship" },
  { id: "castle-tech", name: "CASTLE for Tech" },
  { id: "castle-marketing", name: "CASTLE for Marketing" },
] as const;

export type TalentProgramId = (typeof TALENT_PROGRAMS)[number]["id"];

export interface ProgramTodo {
  id: string;
  programId: TalentProgramId;
  title: string;
  role: PodRoleApi;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ProgramTodoWriteInput = Pick<ProgramTodo, "programId" | "title" | "role">;

export function programName(programId: string) {
  return TALENT_PROGRAMS.find((program) => program.id === programId)?.name ?? programId;
}
