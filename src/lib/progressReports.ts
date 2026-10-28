import type { AllowedUser } from "@/lib/api";

const STORAGE_KEY = "pod-ops-admin.crew-lead-reports";

export interface CrewLeadReport {
  collegeId: string;
  body: string;
  updatedAt: string;
  updatedBy: string;
}

const MAX_LENGTH = 240;

export function crewLeadReportLimit() {
  return MAX_LENGTH;
}

function readAll(): CrewLeadReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CrewLeadReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listCrewLeadReports(): CrewLeadReport[] {
  return readAll();
}

export function saveCrewLeadReport(report: CrewLeadReport): CrewLeadReport {
  const next = {
    ...report,
    body: report.body.trim().slice(0, MAX_LENGTH),
    updatedAt: new Date().toISOString(),
  };
  const all = readAll().filter((item) => item.collegeId !== next.collegeId);
  all.push(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return next;
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
