/** Values accepted by pod-ops-be when creating or updating users. */
export const POD_ROLE_API_VALUES = [
  "exec",
  "ops",
  "marketing",
  "tdl",
  "prl",
  "spaa",
] as const;

export type PodRoleApi = (typeof POD_ROLE_API_VALUES)[number];

export const POD_ROLES = [
  { label: "Exec Lead", apiValue: "exec", legacyValues: ["Pod Leader"] },
  { label: "Ops Lead", apiValue: "ops", legacyValues: ["Pod Researcher"] },
  { label: "Marketing Lead", apiValue: "marketing", legacyValues: ["Pod Outreach Manager"] },
  { label: "Talent Development Lead", apiValue: "tdl", legacyValues: ["Pod Talent Manager"] },
  { label: "Partner Relations Lead", apiValue: "prl", legacyValues: ["Pod Partner Manager"] },
  { label: "Strategic Partnership Associate", apiValue: "spaa", legacyValues: [] },
] as const satisfies ReadonlyArray<{ label: string; apiValue: PodRoleApi; legacyValues: readonly string[] }>;

export type PodRoleLabel = (typeof POD_ROLES)[number]["label"];

export const POD_ROLE_OPTIONS = POD_ROLES.map((role) => role.label) as PodRoleLabel[];

const labelByApiValue = new Map(POD_ROLES.map((role) => [role.apiValue, role.label]));
const apiValueByLabel = new Map(POD_ROLES.map((role) => [role.label, role.apiValue]));
const apiValueByLegacy: Map<string, PodRoleApi> = new Map(
  POD_ROLES.flatMap((role) => role.legacyValues.map((legacy) => [legacy, role.apiValue] as const)),
);

export function normalizePodRole(value: string | null | undefined): PodRoleApi | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (POD_ROLE_API_VALUES.includes(raw as PodRoleApi)) return raw as PodRoleApi;
  return apiValueByLegacy.get(raw) ?? apiValueByLabel.get(raw as PodRoleLabel);
}

export function podRoleToApiValue(label: PodRoleLabel): PodRoleApi {
  return apiValueByLabel.get(label) ?? "exec";
}

export function podRoleToLabel(value: string | null | undefined): PodRoleLabel {
  const normalized = normalizePodRole(value);
  return (normalized ? labelByApiValue.get(normalized) : undefined) ?? "Exec Lead";
}

export function formatPodRole(value: string | null | undefined): string {
  if (!value) return "No role assigned";
  return podRoleToLabel(value);
}

/** @deprecated Use PodRoleApi for API payloads and PodRoleLabel in UI state. */
export type PodRole = PodRoleLabel;
