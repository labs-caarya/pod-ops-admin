import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarX2, Edit3, MapPin, Plus, Trash2, Users } from "lucide-react";
import { AttendanceDrawer } from "@/components/experience/AttendanceDrawer";
import { InternalEventEditorDrawer } from "@/components/experience/InternalEventEditorDrawer";
import { QueryState, errorMessage, formatDateTime } from "@/components/experience/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { EVENT_KIND_LABELS, type InternalEvent, type InternalEventWriteInput } from "@/lib/experience";
import { deleteInternalEvent, saveInternalEvent } from "@/lib/experienceApi";
import { experienceKeys, internalEventsQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";

type When = "upcoming" | "past";

export default function InternalEvents() {
  const queryClient = useQueryClient();
  const [when, setWhen] = useState<When>("upcoming");
  const events = useQuery(internalEventsQuery(when));
  const items = events.data ?? [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InternalEvent | null>(null);
  const [attendanceId, setAttendanceId] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: experienceKeys.events });
  const save = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: InternalEventWriteInput }) => saveInternalEvent(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: deleteInternalEvent, onSuccess: refresh });
  const cancel = useMutation({
    mutationFn: ({ id, cancelled }: { id: string; cancelled: boolean }) => saveInternalEvent(id, { cancelled }),
    onSuccess: refresh,
  });

  const openEditor = (event: InternalEvent | null) => {
    save.reset();
    setEditing(event);
    setEditorOpen(true);
  };

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Internal Events"
        description="Run workshops, town halls and meetups for pod members. Mark attendance and the event's Experience Credits are issued automatically."
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-xl border border-line bg-surface-2 p-1">
        {(["upcoming", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setWhen(value)}
            className={`focus-ring rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              when === value ? "bg-ruby/20 text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <QueryState isLoading={events.isLoading} error={events.error} onRetry={() => void events.refetch()} label="Events" />
      {!events.isLoading && !events.error && items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={when === "upcoming" ? "No upcoming events" : "No past events"}
          description="Create an event so members can RSVP, then mark attendance to issue credits."
          action={
            when === "upcoming" ? (
              <Button onClick={() => openEditor(null)}>
                <Plus className="h-4 w-4" />
                New event
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((event) => (
          <Card key={event.id} hover className="flex min-w-0 flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-ink">{event.title}</h2>
                <p className="mt-1 text-xs text-ink-muted">{formatDateTime(event.startsAt)}</p>
              </div>
              {event.cancelled ? <Badge tone="bad">Cancelled</Badge> : <Badge tone="ruby">{EVENT_KIND_LABELS[event.kind]}</Badge>}
            </div>
            {event.location ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            ) : null}
            {event.description ? <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{event.description}</p> : null}
            <p className="mt-2 text-xs text-ink-faint">
              {event.audienceRoles.length ? event.audienceRoles.map((role) => formatPodRole(role)).join(", ") : "Open to every role"}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-surface-2 py-2">
                <dd className="font-display text-base font-bold text-ink">{event.rsvpCount}</dd>
                <dt className="text-ink-faint">On list</dt>
              </div>
              <div className="rounded-lg bg-surface-2 py-2">
                <dd className="font-display text-base font-bold text-good">{event.attendedCount}</dd>
                <dt className="text-ink-faint">Attended</dt>
              </div>
              <div className="rounded-lg bg-surface-2 py-2">
                <dd className="font-display text-base font-bold text-amber-bright">{event.credits.attended}/{event.credits.participated}/{event.credits.hosted}</dd>
                <dt className="text-ink-faint">Attend / join / host</dt>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" size="sm" disabled={event.cancelled} onClick={() => setAttendanceId(event.id)}>
                <Users className="h-3.5 w-3.5" />
                Attendance
              </Button>
              <Button variant="secondary" size="sm" aria-label={`Edit ${event.title}`} title="Edit" onClick={() => openEditor(event)}>
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                aria-label={event.cancelled ? `Reopen ${event.title}` : `Cancel ${event.title}`}
                title={event.cancelled ? "Reopen event" : "Cancel event"}
                disabled={cancel.isPending}
                onClick={() => cancel.mutate({ id: event.id, cancelled: !event.cancelled })}
              >
                <CalendarX2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                aria-label={`Delete ${event.title}`}
                title="Delete"
                disabled={remove.isPending}
                onClick={() => {
                  const message = event.creditsIssued
                    ? `“${event.title}” has issued credits, so it will be archived (credits stay).`
                    : `Delete “${event.title}”?`;
                  if (window.confirm(message)) remove.mutate(event.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {remove.isError || cancel.isError ? <p className="mt-4 text-sm text-bad">{errorMessage(remove.error ?? cancel.error)}</p> : null}

      <InternalEventEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        event={editing}
        onSave={async (input) => {
          await save.mutateAsync({ id: editing?.id ?? null, input });
        }}
        isSaving={save.isPending}
        saveError={save.isError ? errorMessage(save.error) : ""}
      />
      <AttendanceDrawer eventId={attendanceId} onClose={() => setAttendanceId("")} />
    </div>
  );
}
