import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LayoutGrid, List, Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
  type AllowedUser,
  type College,
  type ManagedPod,
} from "@/lib/api";
import {
  adminQueryKeys,
  collegesQueryOptions,
  managedPodsQueryOptions,
  managedUsersQueryOptions,
} from "@/lib/adminQueries";
import {
  formatPodRole,
  POD_ROLE_OPTIONS,
  podRoleToApiValue,
  podRoleToLabel,
  type PodRoleLabel,
} from "@/lib/podRoles";
import { cn } from "@/lib/utils";

type UserDraft = {
  username: string;
  name: string;
  password: string;
  podId: string;
  podRole: PodRoleLabel;
};

const DEFAULT_ROLE: PodRoleLabel = "Exec Lead";

const EMPTY_DRAFT: UserDraft = {
  username: "",
  name: "",
  password: "",
  podId: "",
  podRole: DEFAULT_ROLE,
};

function normalizePodName(value: string) {
  return String(value || "").toLowerCase().replace(/\bpod\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function findManagedPod(college: College, pods: ManagedPod[]) {
  const names = [college.name, college.crew].map(normalizePodName).filter(Boolean);
  return pods.find((pod) => {
    const candidates = [pod.name, pod.collegeName].map(normalizePodName);
    return names.some((name) =>
      candidates.some((candidate) =>
        candidate === name || candidate.includes(name) || name.includes(candidate),
      ),
    );
  });
}

export default function AdminUsers() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [podFilter, setPodFilter] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const usersQuery = useQuery(managedUsersQueryOptions());
  const podsQuery = useQuery(managedPodsQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const users = usersQuery.data || [];
  const pods = podsQuery.data || [];
  const registeredPods = useMemo(
    () => (collegesQuery.data || []).filter((college) => college.isPod),
    [collegesQuery.data],
  );
  const createPodOptions = useMemo(
    () => registeredPods.map((college) => ({
      college,
      managedPod: findManagedPod(college, pods),
    })),
    [pods, registeredPods],
  );
  const firstAssignablePodId = createPodOptions.find((option) => option.managedPod)?.managedPod?.id || "";
  const loading = usersQuery.isPending || podsQuery.isPending || collegesQuery.isPending;
  const refreshing = !loading && (
    usersQuery.isFetching ||
    podsQuery.isFetching ||
    collegesQuery.isFetching
  );

  const selectedPod = useMemo(
    () => pods.find((pod) => pod.id === draft.podId) || null,
    [draft.podId, pods],
  );

  const filteredUsers = useMemo(() => {
    if (!podFilter) return users;
    return users.filter((user) => user.podId === podFilter);
  }, [users, podFilter]);

  const hasActiveFilters = Boolean(podFilter);

  function formatLeadershipSummary(total: number, filtered: number) {
    if (hasActiveFilters && filtered !== total) {
      return `${filtered} of ${total} leadership account${total === 1 ? "" : "s"}`;
    }
    return `${total} leadership account${total === 1 ? "" : "s"}`;
  }

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingUserId(null);
    setDraft({
      ...EMPTY_DRAFT,
      podId: firstAssignablePodId,
    });
    setShowPassword(false);
    setMessage(null);
  }

  function openEditDrawer(user: AllowedUser) {
    setDrawerMode("edit");
    setEditingUserId(user.id || null);
    setDraft({
      username: user.username || "",
      name: user.name || "",
      password: "",
      podId: user.podId || pods[0]?.id || "",
      podRole: podRoleToLabel(user.podRole),
    });
    setShowPassword(false);
    setMessage(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerMode(null);
    setEditingUserId(null);
    setDraft(EMPTY_DRAFT);
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (drawerMode === "create") {
        const created = await createManagedUser({
          ...draft,
          podRole: podRoleToApiValue(draft.podRole),
        });
        queryClient.setQueryData<AllowedUser[]>(adminQueryKeys.managedUsers, (current = []) => [created, ...current]);
        setMessage({ text: `Created ${created.username}.`, tone: "good" });
      } else if (drawerMode === "edit" && editingUserId) {
        const payload: {
          username: string;
          name: string;
          podId: string;
          podRole: ReturnType<typeof podRoleToApiValue>;
          password?: string;
        } = {
          username: draft.username,
          name: draft.name,
          podId: draft.podId,
          podRole: podRoleToApiValue(draft.podRole),
        };
        if (draft.password.trim()) {
          payload.password = draft.password;
        }
        const updated = await updateManagedUser(editingUserId, payload);
        queryClient.setQueryData<AllowedUser[]>(
          adminQueryKeys.managedUsers,
          (current = []) => current.map((user) => (user.id === editingUserId ? updated : user)),
        );
        setMessage({ text: `Updated ${updated.username}.`, tone: "good" });
      }
      setDrawerMode(null);
      setEditingUserId(null);
      setDraft(EMPTY_DRAFT);
      setShowPassword(false);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not save user.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AllowedUser) {
    if (!user.id) return;
    const confirmed = window.confirm(`Delete ${user.username}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteManagedUser(user.id);
      queryClient.setQueryData<AllowedUser[]>(
        adminQueryKeys.managedUsers,
        (current = []) => current.filter((item) => item.id !== user.id),
      );
      setMessage({ text: `Deleted ${user.username}.`, tone: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete user.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Leadership"
        description="Create and manage pod login accounts. Every non-admin user must be mapped to a pod and a pod role."
        icon={UserRound}
        actions={
          <Button onClick={openCreateDrawer} disabled={!firstAssignablePodId || loading}>
            <Plus className="h-4 w-4" />
            Create user
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Current Leadership</p>
              <p className="text-sm text-ink-muted">
                {loading && !users.length
                  ? "Loading leadership accounts…"
                  : formatLeadershipSummary(users.length, filteredUsers.length)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                    viewMode === "cards"
                      ? "bg-ruby/15 text-ruby-bright"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                  aria-pressed={viewMode === "cards"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                    viewMode === "table"
                      ? "bg-ruby/15 text-ruby-bright"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                  aria-pressed={viewMode === "table"}
                >
                  <List className="h-3.5 w-3.5" />
                  Table
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={() => void Promise.all([
                  usersQuery.refetch(),
                  podsQuery.refetch(),
                  collegesQuery.refetch(),
                ])}
                disabled={loading || refreshing || saving}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <Select value={podFilter} onChange={(e) => setPodFilter(e.target.value)} className="w-full sm:w-64">
              <option value="">All pods</option>
              {pods.map((pod) => (
                <option key={pod.id} value={pod.id}>
                  {pod.name} · {pod.collegeName}
                </option>
              ))}
            </Select>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={() => setPodFilter("")}>
                Clear filter
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : filteredUsers.length ? (
            viewMode === "table" ? (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-base">
                    <tr className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                      <th className="border-b border-line px-5 py-3 font-medium">User</th>
                      <th className="border-b border-line px-5 py-3 font-medium">Access</th>
                      <th className="border-b border-line px-5 py-3 font-medium">Pod</th>
                      <th className="border-b border-line px-5 py-3 font-medium">Status</th>
                      <th className="border-b border-line px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isAdmin = user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));

                      return (
                        <tr key={user.id} className="align-top text-ink-muted">
                          <td className="border-b border-line px-5 py-4">
                            <p className="font-semibold text-ink">{user.name || user.username}</p>
                            <p className="mt-1 text-xs text-ink-faint">@{user.username}</p>
                          </td>
                          <td className="border-b border-line px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={isAdmin ? "info" : "muted"}>
                                {isAdmin ? "super_admin" : formatPodRole(user.podRole)}
                              </Badge>
                            </div>
                          </td>
                          <td className="border-b border-line px-5 py-4">
                            <p className="text-ink">{isAdmin ? "Admin dashboard account" : user.podName || "No pod"}</p>
                            {!isAdmin && (
                              <p className="mt-1 text-xs text-ink-faint">{formatPodRole(user.podRole)}</p>
                            )}
                          </td>
                          <td className="border-b border-line px-5 py-4">
                            <Badge tone={user.isActive === false ? "warn" : "good"}>
                              {user.isActive === false ? "Inactive" : "Active"}
                            </Badge>
                          </td>
                          <td className="border-b border-line px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openEditDrawer(user)}
                                disabled={isAdmin}
                                title={isAdmin ? "Default admin stays fixed to admin access." : undefined}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => void handleDelete(user)}
                                disabled={saving || isAdmin}
                                title={isAdmin ? "Default admin cannot be deleted." : undefined}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredUsers.map((user) => {
                  const isAdmin = user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));

                  return (
                    <div key={user.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{user.name || user.username}</p>
                          <Badge tone={isAdmin ? "info" : "muted"}>
                            {isAdmin ? "super_admin" : formatPodRole(user.podRole)}
                          </Badge>
                          <Badge tone={user.isActive === false ? "warn" : "good"}>
                            {user.isActive === false ? "Inactive" : "Active"}
                          </Badge>
                        </div>
                        <p className="text-sm text-ink-muted">@{user.username}</p>
                        <p className="text-sm text-ink-faint">
                          {isAdmin ? "Admin dashboard account" : `${user.podName || "No pod"} · ${formatPodRole(user.podRole)}`}
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditDrawer(user)}
                          disabled={isAdmin}
                          title={isAdmin ? "Default admin stays fixed to admin access." : undefined}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void handleDelete(user)}
                          disabled={saving || isAdmin}
                          title={isAdmin ? "Default admin cannot be deleted." : undefined}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <p className="font-display font-bold text-ink">
                {hasActiveFilters ? "No matching leadership" : "No leadership accounts yet"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {hasActiveFilters
                  ? "No leadership accounts are assigned to this pod."
                  : "Create the first leadership account to get started."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {message && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            message.tone === "good" && "border-good/30 bg-good/10 text-good",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </p>
      )}

      {!message && (usersQuery.isError || podsQuery.isError || collegesQuery.isError) && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : podsQuery.error instanceof Error
              ? podsQuery.error.message
              : collegesQuery.error instanceof Error
                ? collegesQuery.error.message
                : "Could not load users."}
        </p>
      )}

      <Drawer
        open={Boolean(drawerMode)}
        onClose={closeDrawer}
        title={drawerMode === "edit" ? "Edit user" : "Create a pod user"}
        subtitle={
          drawerMode === "edit"
            ? "Update identity, pod assignment, role, or reset the password when needed."
            : "Add a username, password, pod, and pod role for the main pod-ops frontend."
        }
        width="max-w-md"
        panelClassName="bg-[color-mix(in_srgb,var(--color-base-2)_78%,transparent)] backdrop-blur-2xl"
        bodyClassName="flex items-center"
        footerClassName="bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)] backdrop-blur-xl"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : drawerMode === "edit" ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {drawerMode === "edit" ? "Save changes" : "Create user"}
            </Button>
          </div>
        }
      >
        <div className="w-full rounded-2xl border border-line/70 bg-base/30 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="mb-5">
            <p className="font-display text-lg font-bold text-ink">
              {selectedPod ? `${selectedPod.name}` : "User account"}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {selectedPod ? `${selectedPod.collegeName} · ${draft.podRole}` : "Choose a pod and role for this user."}
            </p>
          </div>

          <form id="user-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <FieldRow label="Username">
              <Input
                value={draft.username}
                onChange={(e) => setDraft((current) => ({ ...current, username: e.target.value }))}
                placeholder="e.g. gitam.lead"
              />
            </FieldRow>
            <FieldRow label="Name">
              <Input
                value={draft.name}
                onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                placeholder="e.g. Harsha Vardhan"
              />
            </FieldRow>
            <FieldRow label="Pod">
              <Select
                value={draft.podId}
                onChange={(e) => setDraft((current) => ({ ...current, podId: e.target.value }))}
              >
                <option value="">Select pod</option>
                {drawerMode === "create"
                  ? createPodOptions.map(({ college, managedPod }) => (
                      <option
                        key={college.id}
                        value={managedPod?.id || `unlinked:${college.id}`}
                        disabled={!managedPod}
                      >
                        {college.name} · {college.crew}
                        {!managedPod ? " · Not linked for login" : ""}
                      </option>
                    ))
                  : pods.map((pod) => (
                      <option key={pod.id} value={pod.id}>
                        {pod.name} · {pod.collegeName}
                      </option>
                    ))}
              </Select>
            </FieldRow>
            <FieldRow label="Pod role">
              <Select
                value={draft.podRole}
                onChange={(e) => setDraft((current) => ({ ...current, podRole: e.target.value as PodRoleLabel }))}
              >
                {POD_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label={drawerMode === "edit" ? "Reset password (optional)" : "Password"}>
              <PasswordInput
                value={draft.password}
                onChange={(value) => setDraft((current) => ({ ...current, password: value }))}
                placeholder={drawerMode === "edit" ? "Enter only if you want to change it" : "Set an initial password"}
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((current) => !current)}
              />
            </FieldRow>
          </form>
        </div>
      </Drawer>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisibility,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
