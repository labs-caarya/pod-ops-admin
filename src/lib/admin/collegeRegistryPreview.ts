import type { College } from "@/lib/api";
import { POD_ROLE_OPTIONS, type PodRoleLabel } from "@/lib/podRoles";

export interface CollegeLeadershipSlot {
  role: PodRoleLabel;
  name: string | null;
}

export interface CollegeClubPreview {
  name: string;
  stage: string;
  contribution: string;
}

const SAMPLE_CLUBS: CollegeClubPreview[] = [
  {
    name: "Entrepreneurship Cell",
    stage: "Engaged",
    contribution: "Founder pipeline and campus startup events",
  },
  {
    name: "Marketing Society",
    stage: "Active",
    contribution: "Creator and design talent pipeline",
  },
  {
    name: "IEEE Student Branch",
    stage: "Prospect",
    contribution: "Technical student talent and workshops",
  },
];

const SAMPLE_EXEC_LEADS = [
  "Harsha Vardhan",
  "Riya Sharma",
  "Arjun Menon",
  "Kiara Shah",
  "Neha Srinivasan",
];

/** FE-only preview until leadership is wired to the backend. */
export function getCollegeExecLeadPreview(college: College): string | null {
  if (!college.isPod) return null;
  const index = college.name.length % SAMPLE_EXEC_LEADS.length;
  return SAMPLE_EXEC_LEADS[index] || null;
}

/** FE-only preview until leadership is wired to the backend. */
export function getCollegeLeadershipPreview(college: College): CollegeLeadershipSlot[] {
  const execLead = getCollegeExecLeadPreview(college);
  return POD_ROLE_OPTIONS.map((role) => ({
    role,
    name: role === "Exec Lead" ? execLead : null,
  }));
}

/** FE-only preview until clubs are wired to the backend. */
export function getCollegeClubsPreview(college: College): CollegeClubPreview[] {
  if (!college.isPod) return [];
  const count = (college.name.length % SAMPLE_CLUBS.length) + 1;
  return SAMPLE_CLUBS.slice(0, count);
}
