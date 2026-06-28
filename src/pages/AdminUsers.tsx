import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LayoutGrid, List, Loader2, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
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
} from "@/lib/api";
import { adminQueryKeys, managedPodsQueryOptions, managedUsersQueryOptions } from "@/lib/adminQueries";
import { POD_ROLE_OPTIONS, type PodRole } from "@/lib/podRoles";
import { cn } from "@/lib/utils";

type UserDraft = {
  username: string;
  name: string;
  password: string;
  podId: string;
  podRole: PodRole;
};

const DEFAULT_ROLE: PodRole = "Pod Leader";

const EMPTY_DRAFT: UserDraft = {
  username: "",
  name: "",
  password: "",
  podId: "",
  podRole: DEFAULT_ROLE,
};

export default function AdminUsers() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const usersQuery = useQuery(managedUsersQueryOptions());
  const podsQuery = useQuery(managedPodsQueryOptions());
  const users = usersQuery.data || [];
  const pods = podsQuery.data || [];
  const loading = usersQuery.isPending || podsQuery.isPending;
  const refreshing = !loading && (usersQuery.isFetching || podsQuery.isFetching);

  const selectedPod = useMemo(
    () => pods.find((pod) => pod.id === draft.podId) || null,
    [draft.podId, pods],
  );

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingUserId(null);
    setDraft({
      ...EMPTY_DRAFT,
      podId: pods[0]?.id || "",
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
      podRole: (user.podRole as PodRole) || DEFAULT_ROLE,
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
        const created = await createManagedUser(draft);
        queryClient.setQueryData<AllowedUser[]>(adminQueryKeys.managedUsers, (current = []) => [created, ...current]);
        setMessage({ text: `Created ${created.username}.`, tone: "good" });
      } else if (drawerMode === "edit" && editingUserId) {
        const payload: Partial<UserDraft> = {
          username: draft.username,
          name: draft.name,
          podId: draft.podId,
          podRole: draft.podRole,
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
        title="User Access"
        description="Create and manage pod login accounts. Every non-admin user must be mapped to a pod and a pod role."
        icon={ShieldCheck}
        actions={
          <Button onClick={openCreateDrawer} disabled={!pods.length || loading}>
            <Plus className="h-4 w-4" />
            Create user
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Current users</p>
              <p className="text-sm text-ink-muted">{users.length} account{users.length === 1 ? "" : "s"} in the shared collection</p>
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
                onClick={() => void Promise.all([usersQuery.refetch(), podsQuery.refetch()])}
                disabled={loading || refreshing || saving}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : (
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
                    {users.map((user) => {
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
                                {isAdmin ? "super_admin" : user.podRole || user.primary_role || "Pod member"}
                              </Badge>
                            </div>
                          </td>
                          <td className="border-b border-line px-5 py-4">
                            <p className="text-ink">{isAdmin ? "Admin dashboard account" : user.podName || "No pod"}</p>
                            {!isAdmin && (
                              <p className="mt-1 text-xs text-ink-faint">{user.podRole || "No role assigned"}</p>
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
                {users.map((user) => {
                  const isAdmin = user.primary_role === "super_admin" || Boolean(user.permissions?.includes("*"));

                  return (
                    <div key={user.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{user.name || user.username}</p>
                          <Badge tone={isAdmin ? "info" : "muted"}>
                            {isAdmin ? "super_admin" : user.podRole || user.primary_role || "Pod member"}
                          </Badge>
                          <Badge tone={user.isActive === false ? "warn" : "good"}>
                            {user.isActive === false ? "Inactive" : "Active"}
                          </Badge>
                        </div>
                        <p className="text-sm text-ink-muted">@{user.username}</p>
                        <p className="text-sm text-ink-faint">
                          {isAdmin ? "Admin dashboard account" : `${user.podName || "No pod"} · ${user.podRole || "No role assigned"}`}
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

      {!message && (usersQuery.isError || podsQuery.isError) && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : podsQuery.error instanceof Error
              ? podsQuery.error.message
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
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>
                    {pod.name} · {pod.collegeName}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Pod role">
              <Select
                value={draft.podRole}
                onChange={(e) => setDraft((current) => ({ ...current, podRole: e.target.value as PodRole }))}
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
