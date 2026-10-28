import type { AllowedUser, College } from "@/lib/api";
import { formatPodRole, normalizePodRole, type PodRoleApi } from "@/lib/podRoles";

export function isAdminPortalUser(user: AllowedUser) {
  return user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));
}

export type PodLeaderOption = {
  key: string;
  user: AllowedUser;
  role: PodRoleApi;
  label: string;
};

export function listPodLeaderOptions(users: AllowedUser[], collegeId: string): PodLeaderOption[] {
  return users
    .filter(
      (user) =>
        user.isActive !== false &&
        !isAdminPortalUser(user) &&
        user.collegeId === collegeId &&
        normalizePodRole(user.podRole),
    )
    .map((user) => {
      const role = normalizePodRole(user.podRole)!;
      const name = user.name?.trim() || user.username?.trim() || "Unnamed";
      return {
        key: `${collegeId}:${role}:${user.id || user.username || name}`,
        user,
        role,
        label: `${name} · ${formatPodRole(role)}`,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function listPodColleges(colleges: College[]) {
  return colleges.filter((college) => college.isPod).sort((a, b) => a.name.localeCompare(b.name));
}
