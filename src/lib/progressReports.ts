import type { AllowedUser } from "@/lib/api";

const MAX_LENGTH = 240;

export function crewLeadReportLimit() {
  return MAX_LENGTH;
}

export function canEditCrewLeadReport(
  user: AllowedUser | null,
  pod: { collegeId: string; crew: string },
): boolean {
  if (!user) return false;
  const admin =
    user.accountType === "super_admin"
    || user.accountType === "pod_ops_admin"
    || Boolean(user.permissions?.some((permission) => permission === "*" || permission === "pod_ops:admin"));
  if (admin) return true;
  const exec = user.podRole === "exec";
  if (!exec) return false;
  if (user.collegeId && user.collegeId === pod.collegeId) return true;
  const crew = pod.crew.trim().toLowerCase();
  const userCrew = (user.collegeCrew || "").trim().toLowerCase();
  return Boolean(crew && userCrew && crew === userCrew);
}
