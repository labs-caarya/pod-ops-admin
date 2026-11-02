import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Loader2, Search, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import type { AttendeeStatus } from "@/lib/experience";
import { addEventAttendees, markEventAttendance, removeEventAttendee } from "@/lib/experienceApi";
import { experienceDirectoryQuery, experienceKeys, internalEventQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";
import { InlineError, QueryState, errorMessage, formatDateTime, searchInputClass } from "./shared";

const STATUS_LABELS: Record<AttendeeStatus, string> = {
  rsvp: "RSVP'd",
  attended: "Attended",
  participated: "Participated",
  hosted: "Hosted",
  absent: "Absent",
};
const STATUS_ORDER: AttendeeStatus[] = ["rsvp", "attended", "participated", "hosted", "absent"];

export function AttendanceDrawer({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const open = Boolean(eventId);
  const eventQuery = useQuery(internalEventQuery(eventId));
  const event = eventQuery.data;
  const attendees = useMemo(() => event?.attendees ?? [], [event]);

  const [marks, setMarks] = useState<Record<string, AttendeeStatus>>({});
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState("");
  const directory = useQuery({ ...experienceDirectoryQuery(search.trim(), ""), enabled: open && search.trim().length >= 2 });

  useEffect(() => {
    setMarks(Object.fromEntries(attendees.map((attendee) => [attendee.userId, attendee.status])));
  }, [attendees]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSummary("");
    }
  }, [open]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: experienceKeys.all });

  const changed = attendees.filter((attendee) => marks[attendee.userId] && marks[attendee.userId] !== attendee.status);

  const save = useMutation({
    mutationFn: () => markEventAttendance(eventId, changed.map((attendee) => ({ userId: attendee.userId, status: marks[attendee.userId] }))),
    onSuccess: async (data) => {
      setSummary(
        data.issued.length
          ? `Issued ${data.issued.reduce((sum, item) => sum + item.amount, 0)} credits to ${data.issued.length} member${data.issued.length === 1 ? "" : "s"}.`
          : "Attendance saved.",
      );
      await refresh();
    },
  });

  const add = useMutation({
    mutationFn: (userId: string) => addEventAttendees(eventId, [userId]),
    onSuccess: async () => {
      setSearch("");
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeEventAttendee(eventId, userId),
    onSuccess: refresh,
  });

  const attendeeIds = new Set(attendees.map((attendee) => attendee.userId));
  const suggestions = (directory.data?.members ?? []).filter((member) => !attendeeIds.has(member.id)).slice(0, 6);
  const error = save.isError ? save.error : add.isError ? add.error : remove.isError ? remove.error : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={event?.title ?? "Attendance"}
      subtitle={event ? `${formatDateTime(event.startsAt)} · Attended ${event.credits.attended} · Participated ${event.credits.participated} · Hosted ${event.credits.hosted} credits` : undefined}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-faint">{changed.length ? `${changed.length} unsaved change${changed.length === 1 ? "" : "s"}` : summary}</span>
          <Button disabled={!changed.length || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Save attendance
          </Button>
        </div>
      }
    >
      <QueryState isLoading={eventQuery.isLoading} error={eventQuery.error} onRetry={() => void eventQuery.refetch()} label="Event" />
      {event ? (
        <div className="space-y-5">
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                aria-label="Add a member"
                value={search}
                onChange={(input) => setSearch(input.target.value)}
                placeholder="Add a member who has not RSVP'd (type 2+ letters)"
                className={searchInputClass}
              />
            </div>
            {suggestions.length ? (
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                {suggestions.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{member.name}</p>
                      <p className="text-xs text-ink-faint">
                        {formatPodRole(member.podRole)} · {member.collegeName}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" disabled={add.isPending} onClick={() => add.mutate(member.id)}>
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {attendees.length} on the list · {event.attendedCount} credited
            </p>
            {attendees.length ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMarks(Object.fromEntries(attendees.map((attendee) => [attendee.userId, "attended" as AttendeeStatus])))}
              >
                Mark everyone attended
              </Button>
            ) : null}
          </div>

          {attendees.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">Nobody has RSVP&apos;d yet.</p> : null}

          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {attendees.map((attendee) => (
              <li key={attendee.userId} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{attendee.name}</p>
                  <p className="text-xs text-ink-faint">
                    {formatPodRole(attendee.podRole)} · {attendee.collegeName}
                    {attendee.rsvpSource === "admin" ? " · added by CREW" : ""}
                  </p>
                </div>
                {attendee.creditsAwarded ? <Badge tone="amber">+{attendee.creditsAwarded}</Badge> : null}
                <select
                  aria-label={`Attendance for ${attendee.name}`}
                  value={marks[attendee.userId] ?? attendee.status}
                  onChange={(input) => setMarks((current) => ({ ...current, [attendee.userId]: input.target.value as AttendeeStatus }))}
                  className="min-h-9 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-ink outline-none focus:border-ruby"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                      {status === "attended" || status === "participated" || status === "hosted" ? ` (+${event.credits[status]})` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Remove ${attendee.name}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove ${attendee.name} from this event?${attendee.creditsAwarded ? " Their credits will be revoked." : ""}`)) remove.mutate(attendee.userId);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          <InlineError message={error ? errorMessage(error) : undefined} />
        </div>
      ) : null}
    </Drawer>
  );
}
