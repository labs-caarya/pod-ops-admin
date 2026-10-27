import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Building2, Check, Landmark, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { MobileFilterDrawer } from "@/components/ui/MobileFilterDrawer";
import { FieldRow, Input, Label, Select } from "@/components/ui/Field";
import { adminQueryKeys, collegesQueryOptions, managedUsersQueryOptions } from "@/lib/adminQueries";
import {
  addCollegeClub,
  CLUB_STAGES,
  createCollege,
  deleteCollege,
  updateCollege,
  updateCollegeClub,
  type ClubStage,
  type College,
  type CollegeClub,
  type AllowedUser,
} from "@/lib/api";
import { normalizePodRole, POD_ROLES } from "@/lib/podRoles";
import { clubStageTone } from "@/lib/clubStage";
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

type Message = { text: string; tone: "good" | "bad" | "info" };

type ClubDraft = {
  name: string;
  stage: ClubStage;
  contribution: string;
};

const EMPTY_CLUB_DRAFT: ClubDraft = {
  name: "",
  stage: "Prospect",
  contribution: "",
};

function activeClubCount(college: College) {
  return college.clubs.filter((club) => !club.archivedAt).length;
}

function findCollegeLead(college: College, users: AllowedUser[]) {
  return users.find(
    (user) => user.collegeId === college.id && normalizePodRole(user.podRole) === "exec" && user.isActive !== false,
  );
}

export default function AdminPodRegistry() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [viewDrawer, setViewDrawer] = useState<ViewDrawerMode>(null);
  const [viewCollege, setViewCollege] = useState<College | null>(null);
  const [draft, setDraft] = useState<CollegeDraft>(EMPTY_DRAFT);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
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

  // Club edits replace the college in the query cache, so read the live copy rather than the snapshot.
  const liveViewCollege = rows.find((row) => row.id === viewCollege?.id) || viewCollege;

  function replaceCollege(updated: College) {
    queryClient.setQueryData<College[]>(
      adminQueryKeys.colleges,
      (current = []) => current.map((item) => (item.id === updated.id ? updated : item)),
    );
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.podPortfolio });
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
  const leadership = useMemo(() => POD_ROLES.map((role) => ({
    role: role.label,
    name: collegeUsers.find((user) => normalizePodRole(user.podRole) === role.apiValue)?.name,
  })), [collegeUsers]);

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
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Industrial Pods"
        description="Manage industrial pods and pod assignments."
        icon={Building2}
        className="mb-0 shrink-0"
        actionsClassName="w-auto justify-end"
        actions={
          <div className="flex items-center gap-2">
            <Button
              className="hidden sm:inline-flex"
              onClick={openCreateDrawer}
            >
              <Plus className="h-4 w-4" />
              Add Pod
            </Button>
            {hasActiveFilters ? (
              <Button className="hidden sm:inline-flex" variant="secondary" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="icon"
              className="sm:hidden"
              aria-label="Refresh pods"
              title="Refresh pods"
              onClick={() => void collegesQuery.refetch()}
              disabled={loading || refreshing || saving}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              className="sm:hidden"
              aria-label="Add pod"
              title="Add pod"
              onClick={openCreateDrawer}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button className="hidden sm:inline-flex" variant="secondary" onClick={() => void collegesQuery.refetch()} disabled={loading || refreshing || saving}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="shrink-0 sm:hidden">
        <MobileFilterDrawer
          open={filterDrawerOpen}
          onOpen={() => setFilterDrawerOpen(true)}
          onClose={() => setFilterDrawerOpen(false)}
          active={hasActiveFilters}
          title="Pod registry filters"
          triggerLabel="Open pod registry filters"
          onClear={resetFilters}
        >
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
        </MobileFilterDrawer>
      </div>

      <Card className="hidden shrink-0 p-4 sm:block">
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
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:hidden">
                <PodRegistryCards
                  rows={filteredRows}
                  users={usersQuery.data || []}
                  saving={saving}
                  onViewLeadership={openLeadershipDrawer}
                  onViewClubs={openClubsDrawer}
                  onEdit={openEditDrawer}
                  onDelete={(row) => void handleDelete(row)}
                />
              </div>
              <div className="hidden min-h-0 flex-1 overflow-auto sm:block">
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
                            Clubs ({activeClubCount(row)})
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
            </>
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
        title="Clubs"
        subtitle={viewCollege ? `${viewCollege.name} · ${viewCollege.crew}` : undefined}
        width="max-w-lg"
        footer={
          <div className="flex justify-end">
            <Button onClick={closeViewDrawer}>Close</Button>
          </div>
        }
      >
        {liveViewCollege ? (
          <ClubManager college={liveViewCollege} onUpdated={replaceCollege} />
        ) : null}
      </Drawer>
    </div>
  );
}

function PodRegistryCards({
  rows,
  users,
  saving,
  onViewLeadership,
  onViewClubs,
  onEdit,
  onDelete,
}: {
  rows: College[];
  users: AllowedUser[];
  saving: boolean;
  onViewLeadership: (row: College) => void;
  onViewClubs: (row: College) => void;
  onEdit: (row: College) => void;
  onDelete: (row: College) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const execLead = findCollegeLead(row, users)?.name;
        return (
          <div key={row.id} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{row.name || "—"}</p>
                <p className="mt-0.5 truncate text-sm text-ink-muted">{row.crew || "—"}</p>
              </div>
              <Badge tone={row.isPod ? "good" : "muted"}>{row.isPod ? "Pod" : "Non-Pod"}</Badge>
            </div>

            <div className="mt-4 space-y-3 border-t border-line pt-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">Exec Lead</p>
                <p className="mt-1 text-sm font-medium text-ink">{execLead || "Unassigned"}</p>
              </div>
              {row.isPod ? (
                <button
                  type="button"
                  onClick={() => onViewLeadership(row)}
                  className="focus-ring text-sm text-ruby-bright hover:underline"
                >
                  View leadership
                </button>
              ) : (
                <p className="text-xs text-ink-faint">Leadership not applicable</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onViewClubs(row)}>
                <Landmark className="h-4 w-4" />
                Clubs ({activeClubCount(row)})
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onEdit(row)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" variant="danger" className="w-full" onClick={() => onDelete(row)} disabled={saving}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClubManager({
  college,
  onUpdated,
}: {
  college: College;
  onUpdated: (college: College) => void;
}) {
  const [message, setMessage] = useState<Message | null>(null);
  const [newClub, setNewClub] = useState<ClubDraft>(EMPTY_CLUB_DRAFT);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ClubDraft>(EMPTY_CLUB_DRAFT);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const activeClubs = college.clubs.filter((club) => !club.archivedAt);
  const archivedClubs = college.clubs.filter((club) => club.archivedAt);

  async function run(action: () => Promise<College>, success: string) {
    setBusy(true);
    try {
      onUpdated(await action());
      setMessage({ text: success, tone: "good" });
      return true;
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not update club.", tone: "bad" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    const name = newClub.name.trim();
    if (!name) return;
    const added = await run(
      () => addCollegeClub(college.id, { ...newClub, name, contribution: newClub.contribution.trim() }),
      `Added ${name}.`,
    );
    if (added) setNewClub(EMPTY_CLUB_DRAFT);
  }

  function startEdit(club: CollegeClub) {
    setEditingClubId(club.id);
    setEditDraft({ name: club.name, stage: club.stage, contribution: club.contribution });
  }

  async function handleSaveEdit(club: CollegeClub) {
    const name = editDraft.name.trim();
    if (!name) return;
    const saved = await run(
      () => updateCollegeClub(college.id, club.id, { ...editDraft, name, contribution: editDraft.contribution.trim() }),
      `Updated ${name}.`,
    );
    if (saved) setEditingClubId(null);
  }

  async function handleArchive(club: CollegeClub) {
    if (!window.confirm(`Archive ${club.name}? Students won't be able to pick it any more.`)) return;
    await run(() => updateCollegeClub(college.id, club.id, { archived: true }), `Archived ${club.name}.`);
  }

  async function handleRestore(club: CollegeClub) {
    await run(() => updateCollegeClub(college.id, club.id, { archived: false }), `Restored ${club.name}.`);
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
        <p className="text-sm text-ink-muted">Students of {college.name} pick from these clubs in the profile builder.</p>
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ruby-bright" />}
      </div>

      {message && (
        <p
          className={cn(
            "mt-3 rounded-xl border px-3 py-2 text-sm",
            message.tone === "good" && "border-good/30 bg-good/10 text-good",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 space-y-2 rounded-xl border border-line bg-surface-2 p-3">
        <Label>Add a club</Label>
        <Input
          value={newClub.name}
          onChange={(e) => setNewClub((current) => ({ ...current, name: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Club name, e.g. E-Cell"
          maxLength={80}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
          <Select
            value={newClub.stage}
            onChange={(e) => setNewClub((current) => ({ ...current, stage: e.target.value as ClubStage }))}
            aria-label="Stage"
          >
            {CLUB_STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </Select>
          <Input
            value={newClub.contribution}
            onChange={(e) => setNewClub((current) => ({ ...current, contribution: e.target.value }))}
            placeholder="Contribution (optional)"
            maxLength={200}
            aria-label="Contribution"
          />
        </div>
        <Button size="sm" onClick={() => void handleAdd()} disabled={busy || !newClub.name.trim()}>
          <Plus className="h-4 w-4" />
          Add club
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {activeClubs.length === 0 && (
          <p className="text-sm text-ink-faint">
            No clubs yet. Students of this college will see a "no clubs associated with Caarya yet" message.
          </p>
        )}
        {activeClubs.map((club) =>
          editingClubId === club.id ? (
            <div key={club.id} className="space-y-2 rounded-xl border border-ruby/40 bg-surface-2 p-3">
              <Input
                value={editDraft.name}
                onChange={(e) => setEditDraft((current) => ({ ...current, name: e.target.value }))}
                maxLength={80}
                aria-label="Club name"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                <Select
                  value={editDraft.stage}
                  onChange={(e) => setEditDraft((current) => ({ ...current, stage: e.target.value as ClubStage }))}
                  aria-label="Stage"
                >
                  {CLUB_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </Select>
                <Input
                  value={editDraft.contribution}
                  onChange={(e) => setEditDraft((current) => ({ ...current, contribution: e.target.value }))}
                  placeholder="Contribution (optional)"
                  maxLength={200}
                  aria-label="Contribution"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void handleSaveEdit(club)} disabled={busy || !editDraft.name.trim()}>
                  <Check className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingClubId(null)} disabled={busy}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div key={club.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{club.name}</p>
                    <Badge tone={clubStageTone(club.stage)}>{club.stage}</Badge>
                  </div>
                  {club.contribution && <p className="mt-1 text-xs text-ink-faint">{club.contribution}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(club)} disabled={busy} aria-label={`Edit ${club.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleArchive(club)} disabled={busy} aria-label={`Archive ${club.name}`}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {archivedClubs.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            className="text-sm text-ink-muted hover:text-ink"
            aria-expanded={showArchived}
          >
            {showArchived ? "Hide" : "Show"} archived ({archivedClubs.length})
          </button>
          {showArchived && (
            <div className="mt-2 space-y-2">
              {archivedClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2/60 p-3">
                  <p className="text-sm text-ink-faint line-through">{club.name}</p>
                  <Button size="sm" variant="ghost" onClick={() => void handleRestore(club)} disabled={busy}>
                    <ArchiveRestore className="h-4 w-4" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
