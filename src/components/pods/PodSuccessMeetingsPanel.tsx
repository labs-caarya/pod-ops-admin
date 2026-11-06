import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { createPodSuccessMeeting, deletePodSuccessMeeting, updatePodSuccessMeeting, type PodSuccessMeeting, type SuccessMeetingPulse } from "@/lib/api";
import { adminQueryKeys, podSuccessMeetingsQueryOptions } from "@/lib/adminQueries";
import { POD_ROLES, formatPodRole } from "@/lib/podRoles";
import {
  LIMITS,
  PULSE_OPTIONS,
  draftFromMeeting,
  emptyDraft,
  newItemKey,
  todayIso,
  toInput,
  type SuccessMeetingDraft,
} from "@/lib/successMeetings";

const pulseTone: Record<Exclude<SuccessMeetingPulse, "">, Tone> = { strong: "good", steady: "info", struggling: "bad" };

function readableDay(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

/**
 * Logs the minutes of a pod's success meetings. Moksha reads the latest minutes when it plans for
 * the pod, so this is where "what happened in the last meet" enters the system.
 */
export function PodSuccessMeetingsPanel({ collegeId, podName }: { collegeId: string; podName: string }) {
  const queryClient = useQueryClient();
  const meetingsQuery = useQuery(podSuccessMeetingsQueryOptions(collegeId));
  const [draft, setDraft] = useState<SuccessMeetingDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const meetings = meetingsQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: async (action: { type: "save" } | { type: "delete"; id: string }) => {
      if (action.type === "delete") return deletePodSuccessMeeting(action.id);
      const converted = toInput(draft ?? emptyDraft());
      if (!converted.ok) throw new Error(converted.error);
      if (editingId) return updatePodSuccessMeeting(editingId, converted.input);
      return createPodSuccessMeeting({ ...converted.input, collegeId });
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.podSuccessMeetings(collegeId) });
      setFeedback(action.type === "delete" ? "Minutes deleted." : editingId ? "Minutes updated." : "Minutes logged. Moksha will use them in its next plan for this pod.");
      setError("");
      if (action.type === "save") close();
    },
    onError: (failure) => setError(failure instanceof Error ? failure.message : "Could not save the minutes."),
  });

  function close() {
    setDraft(null);
    setEditingId(null);
  }

  function openNew() {
    setDraft(emptyDraft());
    setEditingId(null);
    setError("");
    setFeedback("");
  }

  function openEdit(meeting: PodSuccessMeeting) {
    setDraft(draftFromMeeting(meeting));
    setEditingId(meeting.id);
    setError("");
    setFeedback("");
  }

  const update = (patch: Partial<SuccessMeetingDraft>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const updateItem = (key: string, patch: Partial<SuccessMeetingDraft["actionItems"][number]>) =>
    setDraft((current) => (current ? { ...current, actionItems: current.actionItems.map((item) => (item.key === key ? { ...item, ...patch } : item)) } : current));

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4 text-ruby-bright" /><h2 className="font-display text-lg font-bold text-ink">Success meets</h2></div>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">Log the minutes of each success meet for {podName}. Moksha reads the latest minutes alongside goals, tasks and challenges when it recommends what the pod should do next.</p>
        </div>
        {!draft ? <Button type="button" size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5" />Log minutes</Button> : null}
      </div>

      {draft ? (
        <form
          className="mt-4 space-y-4 rounded-xl border border-line bg-surface-2 p-3 sm:p-4"
          onSubmit={(event) => { event.preventDefault(); setError(""); mutation.mutate({ type: "save" }); }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{editingId ? "Edit minutes" : "Minutes of the last success meet"}</p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md" aria-label="Close minutes form" onClick={close}><X className="h-3.5 w-3.5" /></Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><Label>Meeting date</Label><Input type="date" required max={todayIso()} value={draft.meetingDate} onChange={(event) => update({ meetingDate: event.target.value })} /></label>
            <label className="block"><Label>How is the pod doing after it? (optional)</Label>
              <Select value={draft.pulse} onChange={(event) => update({ pulse: event.target.value as SuccessMeetingPulse })}>
                {PULSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </label>
          </div>

          <label className="block"><Label>Who attended (comma separated)</Label><Input value={draft.attendees} onChange={(event) => update({ attendees: event.target.value })} placeholder="Asha, Ravi, Meera" /></label>

          <label className="block">
            <span className="flex items-baseline justify-between"><Label>Minutes</Label><span className="mb-1.5 text-xs text-ink-faint">{draft.summary.length}/{LIMITS.summary}</span></span>
            <Textarea className="min-h-[140px]" maxLength={LIMITS.summary} required value={draft.summary} onChange={(event) => update({ summary: event.target.value })} placeholder="What was discussed? Where is the pod at, what is working, what is not?" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><Label>Decisions (one per line)</Label><Textarea value={draft.decisions} onChange={(event) => update({ decisions: event.target.value })} placeholder="Refocus on alumni outreach" /></label>
            <label className="block"><Label>Blockers and challenges raised (one per line)</Label><Textarea value={draft.blockers} onChange={(event) => update({ blockers: event.target.value })} placeholder="No warm introductions to partners" /></label>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label className="mb-0">Action items</Label>
              <Button type="button" variant="secondary" size="sm" disabled={draft.actionItems.length >= LIMITS.actionItems} onClick={() => update({ actionItems: [...draft.actionItems, { key: newItemKey(), text: "", ownerRole: "", dueDate: "" }] })}><Plus className="h-3.5 w-3.5" />Add item</Button>
            </div>
            {draft.actionItems.length ? (
              <ul className="mt-2 space-y-2">
                {draft.actionItems.map((item, index) => (
                  <li key={item.key} className="grid gap-2 rounded-lg border border-line bg-surface p-2 sm:grid-cols-[1fr_11rem_9.5rem_auto]">
                    <Input aria-label={`Action item ${index + 1}`} maxLength={LIMITS.line} value={item.text} onChange={(event) => updateItem(item.key, { text: event.target.value })} placeholder="What was agreed?" />
                    <Select aria-label={`Owner of action item ${index + 1}`} value={item.ownerRole} onChange={(event) => updateItem(item.key, { ownerRole: event.target.value })}>
                      <option value="">Whole pod</option>
                      {POD_ROLES.map((role) => <option key={role.apiValue} value={role.apiValue}>{role.label}</option>)}
                    </Select>
                    <Input aria-label={`Due date of action item ${index + 1}`} type="date" value={item.dueDate} onChange={(event) => updateItem(item.key, { dueDate: event.target.value })} />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove action item ${index + 1}`} onClick={() => update({ actionItems: draft.actionItems.filter((entry) => entry.key !== item.key) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-ink-faint">Nothing agreed yet? You can leave this empty.</p>}
          </div>

          {error ? <p className="text-sm text-bad" role="alert">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : editingId ? "Save changes" : "Log minutes"}</Button>
          </div>
        </form>
      ) : null}

      {feedback && !draft ? <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted" role="status"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ruby-bright" />{feedback}</p> : null}
      {!draft && error ? <p className="mt-3 text-sm text-bad" role="alert">{error}</p> : null}
      {meetingsQuery.isLoading ? <p className="mt-4 text-sm text-ink-muted">Loading minutes…</p> : null}
      {meetingsQuery.isError ? <p className="mt-4 text-sm text-bad">{meetingsQuery.error instanceof Error ? meetingsQuery.error.message : "Could not load the minutes."}</p> : null}
      {!meetingsQuery.isLoading && !meetingsQuery.isError && !meetings.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-center text-sm text-ink-muted">No success meets logged for this pod yet.</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {meetings.map((meeting, index) => (
          <article key={meeting.id} className="rounded-xl border border-line bg-surface-2 p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">{readableDay(meeting.meetingDate)}</p>
                <p className="text-xs text-ink-faint">Logged by {meeting.loggedByName}{meeting.attendees.length ? ` · ${meeting.attendees.length} attended` : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {index === 0 ? <Badge tone="ruby">Latest</Badge> : null}
                {meeting.pulse ? <Badge tone={pulseTone[meeting.pulse]} className="capitalize">{meeting.pulse}</Badge> : null}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{meeting.summary}</p>
            {meeting.attendees.length ? <p className="mt-2 text-xs text-ink-muted">Attended: {meeting.attendees.join(", ")}</p> : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {meeting.decisions.length ? <MeetingList title="Decisions" items={meeting.decisions} /> : null}
              {meeting.blockers.length ? <MeetingList title="Blockers raised" items={meeting.blockers} /> : null}
            </div>
            {meeting.actionItems.length ? (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Action items</p>
                <ul className="mt-1.5 space-y-1.5">
                  {meeting.actionItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex flex-wrap items-center gap-2 text-sm text-ink">
                      <span>{item.text}</span>
                      <Badge>{item.ownerRole ? formatPodRole(item.ownerRole) : "Whole pod"}</Badge>
                      {item.dueDate ? <span className="text-xs text-ink-muted">due {readableDay(item.dueDate)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap justify-end gap-1.5">
              <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(meeting)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
              <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => { if (window.confirm("Delete these minutes? Moksha will no longer use them.")) mutation.mutate({ type: "delete", id: meeting.id }); }}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function MeetingList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-ink">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
