import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Landmark, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { adminQueryKeys, collegesQueryOptions, managedUsersQueryOptions } from "@/lib/adminQueries";
import {
  createCollege,
  deleteCollege,
  updateCollege,
  type College,
  type AllowedUser,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type CollegeDraft = {
  id: string;
  name: string;
  crew: string;
  isPod: boolean;
};

type Filters = {
  search: string;
  type: "" | "pod" | "non-pod";
};

const EMPTY_DRAFT: CollegeDraft = {
  id: "",
  name: "",
  crew: "",
  isPod: false,
};

const EMPTY_FILTERS: Filters = {
  search: "",
  type: "",
};

function formatCollegeSummary(total: number, filtered: number, hasFilters: boolean) {
  if (hasFilters && filtered !== total) {
    return `${filtered} of ${total} ${total === 1 ? "pod" : "pods"}`;
  }
  return `${total} ${total === 1 ? "pod" : "pods"} registered`;
}

type ViewDrawerMode = "leadership" | "clubs" | null;

function findCollegeLead(college: College, users: AllowedUser[]) {
  return users.find(
    (user) => user.collegeId === college.id && user.podRole === "Pod Leader" && user.isActive !== false,
  );
}

export default function AdminPodRegistry() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [viewDrawer, setViewDrawer] = useState<ViewDrawerMode>(null);
  const [viewCollege, setViewCollege] = useState<College | null>(null);
  const [draft, setDraft] = useState<CollegeDraft>(EMPTY_DRAFT);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const collegesQuery = useQuery(collegesQueryOptions());
  const usersQuery = useQuery(managedUsersQueryOptions());
  const rows = collegesQuery.data || [];
  const loading = collegesQuery.isPending;
  const refreshing = !loading && collegesQuery.isFetching;

  const hasActiveFilters = Boolean(filters.search.trim() || filters.type);

  const filteredRows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row.name, row.crew].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesType =
        filters.type === "" ||
        (filters.type === "pod" && row.isPod) ||
        (filters.type === "non-pod" && !row.isPod);
      return matchesSearch && matchesType;
    });
  }, [rows, filters]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function openCreateDrawer() {
    setDrawerMode("create");
    setDraft(EMPTY_DRAFT);
    setMessage(null);
  }

  function openEditDrawer(row: College) {
    setDrawerMode("edit");
    setDraft({
      id: row.id,
      name: row.name,
      crew: row.crew,
      isPod: row.isPod,
    });
    setMessage(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerMode(null);
    setDraft(EMPTY_DRAFT);
  }

  function openLeadershipDrawer(row: College) {
    setViewCollege(row);
    setViewDrawer("leadership");
  }

  function openClubsDrawer(row: College) {
    setViewCollege(row);
    setViewDrawer("clubs");
  }

  function closeViewDrawer() {
    setViewDrawer(null);
    setViewCollege(null);
  }

  const collegeUsers = useMemo(
    () => (viewCollege
      ? (usersQuery.data || []).filter((user) => user.collegeId === viewCollege.id && user.isActive !== false)
      : []),
    [usersQuery.data, viewCollege],
  );
  const leadership = useMemo(() => [
    { role: "Exec Lead", name: collegeUsers.find((user) => user.podRole === "Pod Leader")?.name },
    { role: "Talent Manager", name: collegeUsers.find((user) => user.podRole === "Pod Talent Manager")?.name },
    { role: "Outreach Manager", name: collegeUsers.find((user) => user.podRole === "Pod Outreach Manager")?.name },
    { role: "Researcher", name: collegeUsers.find((user) => user.podRole === "Pod Researcher")?.name },
    { role: "Partner Manager", name: collegeUsers.find((user) => user.podRole === "Pod Partner Manager")?.name },
  ], [collegeUsers]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.crew.trim()) {
      return;
    }

    const payload = {
      name: draft.name.trim(),
      crew: draft.crew.trim(),
      isPod: Boolean(draft.isPod),
    };

    setSaving(true);
    try {
      if (drawerMode === "create") {
        const created = await createCollege(payload);
        queryClient.setQueryData<College[]>(adminQueryKeys.colleges, (current = []) => [
          created,
          ...current.filter((item) => item.id !== created.id),
        ]);
        setMessage({ text: `Added ${created.name}.`, tone: "good" });
      } else if (drawerMode === "edit" && draft.id) {
        const updated = await updateCollege(draft.id, payload);
        queryClient.setQueryData<College[]>(
          adminQueryKeys.colleges,
          (current = []) => current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setMessage({ text: `Updated ${updated.name}.`, tone: "good" });
      }
      setDrawerMode(null);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not save industrial pod.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: College) {
    const confirmed = window.confirm(`Delete ${row.name}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteCollege(row.id);
      queryClient.setQueryData<College[]>(
        adminQueryKeys.colleges,
        (current = []) => current.filter((item) => item.id !== row.id),
      );
      setMessage({ text: `Deleted ${row.name}.`, tone: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete industrial pod.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Industrial Pods"
        description="Manage industrial pods and pod assignments."
        icon={Building2}
        actions={
          <>
            <Button onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              Add Pod
            </Button>
            {hasActiveFilters ? (
              <Button variant="secondary" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => void collegesQuery.refetch()} disabled={loading || refreshing || saving}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Refresh
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="mb-3">
          <h3 className="font-display text-sm font-bold text-ink">Search & Filters</h3>
          <p className="text-sm text-ink-muted">Filter pods by name, crew, or type.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px] md:items-end">
          <FieldRow label="Search">
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Pod name or crew"
            />
          </FieldRow>
          <FieldRow label="Type">
            <Select value={filters.type} onChange={(event) => updateFilter("type", event.target.value as Filters["type"])}>
              <option value="">All Types</option>
              <option value="pod">Pod</option>
              <option value="non-pod">Non-Pod</option>
            </Select>
          </FieldRow>
        </div>
      </Card>

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-line px-5 py-4">
            <p className="font-display text-lg font-bold text-ink">Industrial Pods</p>
            <p className="text-sm text-ink-muted">
              {loading && !rows.length
                ? "Loading industrial pods…"
                : formatCollegeSummary(rows.length, filteredRows.length, hasActiveFilters)}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : filteredRows.length ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-base">
                  <tr className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                    <th className="border-b border-line px-5 py-3 font-medium">Name</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Crew</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Type</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Exec Lead</th>
                    <th className="border-b border-line px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const execLead = findCollegeLead(row, usersQuery.data || [])?.name;
                    return (
                    <tr key={row.id} className="align-top text-ink-muted">
                      <td className="border-b border-line px-5 py-4 font-semibold text-ink">{row.name || "—"}</td>
                      <td className="border-b border-line px-5 py-4 text-ink">{row.crew || "—"}</td>
                      <td className="border-b border-line px-5 py-4">
                        <Badge tone={row.isPod ? "good" : "muted"}>{row.isPod ? "Pod" : "Non-Pod"}</Badge>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-ink">{execLead || "—"}</p>
                          {row.isPod ? (
                            <button
                              type="button"
                              onClick={() => openLeadershipDrawer(row)}
                              className="focus-ring text-sm text-ruby-bright hover:underline"
                            >
                              View leadership
                            </button>
                          ) : (
                            <span className="text-xs text-ink-faint">Not applicable</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openClubsDrawer(row)}>
                            <Landmark className="h-4 w-4" />
                            View Clubs
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openEditDrawer(row)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => void handleDelete(row)} disabled={saving}>
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
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <p className="font-display font-bold text-ink">
                {hasActiveFilters ? "No matching pods" : "No industrial pods yet"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {hasActiveFilters
                  ? "No pods match your filter criteria."
                  : "Add the first industrial pod to get started."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {message ? (
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
      ) : null}

      {!message && collegesQuery.isError ? (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {collegesQuery.error instanceof Error ? collegesQuery.error.message : "Could not load industrial pods."}
        </p>
      ) : null}

      <Drawer
        open={Boolean(drawerMode)}
        onClose={closeDrawer}
        title={drawerMode === "edit" ? "Edit industrial pod" : "Add industrial pod"}
        width="max-w-lg"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="college-form" className="flex-1" disabled={saving || !draft.name.trim() || !draft.crew.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : drawerMode === "edit" ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {drawerMode === "edit" ? "Save" : "Add Pod"}
            </Button>
          </div>
        }
      >
        <form id="college-form" className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <FieldRow label="Name">
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Enter pod name"
            />
          </FieldRow>
          <FieldRow label="Crew">
            <Input
              value={draft.crew}
              onChange={(event) => setDraft((current) => ({ ...current, crew: event.target.value }))}
              placeholder="Enter crew name"
            />
          </FieldRow>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-3">
            <span className="text-sm font-medium text-ink">Is pod</span>
            <input
              type="checkbox"
              checked={draft.isPod}
              onChange={(event) => setDraft((current) => ({ ...current, isPod: event.target.checked }))}
              className="h-4 w-4 accent-ruby"
            />
          </label>
        </form>
      </Drawer>

      <Drawer
        open={viewDrawer === "leadership"}
        onClose={closeViewDrawer}
        title="Pod leadership"
        subtitle={viewCollege ? `${viewCollege.name} · ${viewCollege.crew}` : undefined}
        width="max-w-lg"
        footer={
          <div className="flex justify-end">
            <Button onClick={closeViewDrawer}>Close</Button>
          </div>
        }
      >
        <p className="mb-4 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          Leadership is derived from active users assigned to this college.
        </p>
        <div className="space-y-3">
          {leadership.map((slot) => (
            <div key={slot.role} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{slot.role}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{slot.name || "Unassigned"}</p>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer
        open={viewDrawer === "clubs"}
        onClose={closeViewDrawer}
        title="Linked clubs"
        subtitle={viewCollege ? `${viewCollege.name} · ${viewCollege.crew}` : undefined}
        width="max-w-lg"
        footer={
          <div className="flex justify-end">
            <Button onClick={closeViewDrawer}>Close</Button>
          </div>
        }
      >
        <p className="mb-4 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          Club assignments are not yet stored on college records.
        </p>
        <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <p className="font-display font-bold text-ink">No clubs linked yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            {viewCollege?.isPod
              ? "Club assignments will appear here after they are added to the college model."
              : "Non-pod entries typically do not have linked clubs."}
          </p>
        </div>
      </Drawer>
    </div>
  );
}
