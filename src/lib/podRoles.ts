/** Values accepted by pod-ops-be when creating or updating users. */
export const POD_ROLE_API_VALUES = [
  "Pod Leader",
  "Pod Talent Manager",
  "Pod Outreach Manager",
  "Pod Researcher",
  "Pod Partner Manager",
] as const;

export type PodRoleApi = (typeof POD_ROLE_API_VALUES)[number];

export const POD_ROLES = [
  { label: "Exec Lead", apiValue: "Pod Leader" },
  { label: "Ops Lead", apiValue: "Pod Researcher" },
  { label: "Marketing Lead", apiValue: "Pod Outreach Manager" },
  { label: "Talent Development Lead", apiValue: "Pod Talent Manager" },
  { label: "Partner Relations Lead", apiValue: "Pod Partner Manager" },
] as const satisfies ReadonlyArray<{ label: string; apiValue: PodRoleApi }>;

export type PodRoleLabel = (typeof POD_ROLES)[number]["label"];

export const POD_ROLE_OPTIONS = POD_ROLES.map((role) => role.label);

const labelByApiValue = new Map(POD_ROLES.map((role) => [role.apiValue, role.label]));
const apiValueByLabel = new Map(POD_ROLES.map((role) => [role.label, role.apiValue]));

export function podRoleToApiValue(label: PodRoleLabel): PodRoleApi {
  return apiValueByLabel.get(label) ?? "Pod Leader";
}

export function podRoleToLabel(value: string | null | undefined): PodRoleLabel {
  if (!value) return "Exec Lead";
  return (labelByApiValue.get(value as PodRoleApi) as PodRoleLabel | undefined) ?? (value as PodRoleLabel);
}

export function formatPodRole(value: string | null | undefined): string {
  if (!value) return "No role assigned";
  return podRoleToLabel(value);
}

/** @deprecated Use PodRoleApi for API payloads and PodRoleLabel in UI state. */
export type PodRole = PodRoleLabel;
