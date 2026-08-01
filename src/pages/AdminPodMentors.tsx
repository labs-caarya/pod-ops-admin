import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ExpertiseTags } from "@/components/ui/ExpertiseTags";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { deleteMentor, upsertMentor } from "@/lib/api";
import { adminQueryKeys, collegesQueryOptions, mentorsQueryOptions } from "@/lib/adminQueries";
import { formatExpertiseTags, parseExpertiseTags } from "@/lib/mentors";
import type { PodMentor } from "@/lib/types";
import { makeId } from "@/lib/utils";
import { cn } from "@/lib/utils";

type MentorDraft = {
  name: string;
  expertise: string;
  collegeId: string;
};

const EMPTY_DRAFT: MentorDraft = {
  name: "",
  expertise: "",
  collegeId: "",
};

function collegeLabel(collegeId: string, collegeName?: string, colleges: { id: string; name: string; crew: string }[] = []) {
  if (!collegeId) return collegeName || "No college";
  const college = colleges.find((item) => item.id === collegeId);
  return college ? `${college.name} · ${college.crew}` : collegeName || collegeId;
}

export default function AdminPodMentors() {
  const [saving, setSaving] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MentorDraft>(EMPTY_DRAFT);
  const [podFilter, setPodFilter] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const queryClient = useQueryClient();
  const mentorsQuery = useQuery(mentorsQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const mentors = mentorsQuery.data || [];
  const colleges = collegesQuery.data || [];
  const loading = mentorsQuery.isPending || collegesQuery.isPending;
  const refreshing = !loading && (mentorsQuery.isFetching || collegesQuery.isFetching);

  const filteredMentors = useMemo(() => {
    if (!podFilter) return mentors;
    return mentors.filter((mentor) => mentor.collegeId === podFilter);
  }, [mentors, podFilter]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingMentorId(null);
    setDraft(EMPTY_DRAFT);
    setMessage(null);
  }

  function openEditDrawer(mentor: PodMentor) {
    setDrawerMode("edit");
    setEditingMentorId(mentor.id);
    setDraft({
      name: mentor.name,
      expertise: formatExpertiseTags(mentor.expertise),
      collegeId: mentor.collegeId || "",
    });
    setMessage(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerMode(null);
    setEditingMentorId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setMessage({ text: "Mentor name is required.", tone: "bad" });
      return;
    }

    const expertise = parseExpertiseTags(draft.expertise);
    if (!expertise.length) {
      setMessage({ text: "Add at least one expertise tag.", tone: "bad" });
      return;
    }
    if (!draft.collegeId) {
      setMessage({ text: "College is required.", tone: "bad" });
      return;
    }

    setSaving(true);
    try {
      const selectedCollege = colleges.find((college) => college.id === draft.collegeId);
      const payload: PodMentor = {
        id: editingMentorId || makeId("mnt"),
        collegeId: draft.collegeId,
        collegeName: selectedCollege?.name,
        name: draft.name.trim(),
        expertise,
      };
      const saved = await upsertMentor(payload);
      queryClient.setQueryData<PodMentor[]>(adminQueryKeys.mentors, (current = []) => {
        const idx = current.findIndex((item) => item.id === saved.id);
        if (idx >= 0) {
          const next = [...current];
          next[idx] = saved;
          return next;
        }
        return [saved, ...current];
      });
      setMessage({ text: drawerMode === "create" ? "Mentor added." : "Mentor updated.", tone: "good" });
      closeDrawer();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not save mentor.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mentor: PodMentor) {
    const confirmed = window.confirm(`Remove ${mentor.name}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteMentor(mentor.id);
      queryClient.setQueryData<PodMentor[]>(
        adminQueryKeys.mentors,
        (current = []) => current.filter((item) => item.id !== mentor.id),
      );
      setMessage({ text: "Mentor removed.", tone: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete mentor.",
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Pod mentors"
        description="Assign mentors to colleges."
        icon={GraduationCap}
        actions={
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            Add mentor
          </Button>
        }
      />

      {message && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.tone === "good" && "border-good/30 bg-good/10 text-good",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </div>
      )}

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Mentor roster</p>
              <p className="text-sm text-ink-muted">
                {loading && !mentors.length
                  ? "Loading mentors…"
                  : `${filteredMentors.length} mentor${filteredMentors.length === 1 ? "" : "s"} shown`}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void Promise.all([mentorsQuery.refetch(), collegesQuery.refetch()])}
              disabled={loading || refreshing || saving}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <Select value={podFilter} onChange={(e) => setPodFilter(e.target.value)} className="w-full sm:w-56">
              <option value="">All colleges</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name} · {college.crew}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading && !mentors.length ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-ruby-bright" />
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-ink">No mentors yet</p>
                <p className="mt-1 text-sm text-ink-muted">Add a mentor with name and expertise tags.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {filteredMentors.map((mentor) => (
                    <Card key={mentor.id} className="p-4">
                      <p className="font-display text-lg font-bold text-ink">{mentor.name}</p>
                      <div className="mt-3">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
                          Expertise
                        </p>
                        <ExpertiseTags tags={mentor.expertise} />
                      </div>
                      <div className="mt-3 border-t border-line pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Pod</p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {collegeLabel(mentor.collegeId, mentor.collegeName, colleges)}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditDrawer(mentor)} disabled={saving}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => void handleDelete(mentor)} disabled={saving}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <table className="hidden w-full min-w-[720px] text-left text-sm md:table">
                <thead className="sticky top-0 bg-surface-1 text-xs uppercase tracking-wide text-ink-faint">
                  <tr className="border-b border-line">
                    <th className="px-5 py-3 font-medium">Mentor</th>
                    <th className="px-5 py-3 font-medium">Expertise</th>
                    <th className="px-5 py-3 font-medium">Pod</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="border-b border-line/70 hover:bg-surface-2/60">
                      <td className="px-5 py-4 align-top font-medium text-ink">{mentor.name}</td>
                      <td className="px-5 py-4 align-top">
                        <ExpertiseTags tags={mentor.expertise} />
                      </td>
                      <td className="px-5 py-4 align-top text-ink-muted">
                        {collegeLabel(mentor.collegeId, mentor.collegeName, colleges)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditDrawer(mentor)} disabled={saving}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => void handleDelete(mentor)} disabled={saving}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </Card>

      <Drawer
        open={drawerMode !== null}
        onClose={closeDrawer}
        title={drawerMode === "create" ? "Add mentor" : "Edit mentor"}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <FieldRow label="Mentor name">
            <Input
              value={draft.name}
              onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
              placeholder="Full name"
              required
            />
          </FieldRow>
          <FieldRow label="Expertise tags">
            <Textarea
              value={draft.expertise}
              onChange={(e) => setDraft((current) => ({ ...current, expertise: e.target.value }))}
              placeholder="Startup fundraising, D2C growth, Pitch decks"
            />
            <p className="mt-1.5 text-xs text-ink-faint">Separate tags with commas.</p>
          </FieldRow>
          <FieldRow label="College">
            <Select
              value={draft.collegeId}
              onChange={(e) => setDraft((current) => ({ ...current, collegeId: e.target.value }))}
              required
            >
              <option value="">Select college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name} · {college.crew}
                </option>
              ))}
            </Select>
          </FieldRow>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {drawerMode === "create" ? "Add mentor" : "Save changes"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
