import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import {
  CREDIT_TIERS,
  CREDIT_TIER_LABELS,
  EVENT_KINDS,
  EVENT_KIND_LABELS,
  type CreditTier,
  type EventKind,
  type InternalEvent,
  type InternalEventWriteInput,
  type TierOverrides,
} from "@/lib/experience";
import { experienceRulesQuery } from "@/lib/experienceQueries";
import { POD_ROLES, type PodRoleApi } from "@/lib/podRoles";
import { cn } from "@/lib/utils";
import { InlineError, fromLocalInput, toLocalInput } from "./shared";

interface Draft {
  title: string;
  description: string;
  kind: EventKind;
  startsAt: string;
  endsAt: string;
  location: string;
  overrides: Record<CreditTier, string>;
  audienceRoles: PodRoleApi[];
}

const NO_OVERRIDES: Record<CreditTier, string> = { attended: "", participated: "", hosted: "" };
const EMPTY: Draft = { title: "", description: "", kind: "workshop", startsAt: "", endsAt: "", location: "", overrides: NO_OVERRIDES, audienceRoles: [] };

export function InternalEventEditorDrawer({
  open,
  onClose,
  event,
  onSave,
  isSaving,
  saveError,
}: {
  open: boolean;
  onClose: () => void;
  event: InternalEvent | null;
  onSave: (input: InternalEventWriteInput) => Promise<void>;
  isSaving: boolean;
  saveError: string;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const defaults = useQuery({ ...experienceRulesQuery(), enabled: open });

  useEffect(() => {
    if (!open) return;
    setError("");
    setDraft(
      event
        ? {
            title: event.title,
            description: event.description,
            kind: event.kind,
            startsAt: toLocalInput(event.startsAt),
            endsAt: toLocalInput(event.endsAt),
            location: event.location,
            overrides: {
              attended: event.creditOverrides?.attended == null ? "" : String(event.creditOverrides.attended),
              participated: event.creditOverrides?.participated == null ? "" : String(event.creditOverrides.participated),
              hosted: event.creditOverrides?.hosted == null ? "" : String(event.creditOverrides.hosted),
            },
            audienceRoles: event.audienceRoles,
          }
        : EMPTY,
    );
  }, [event, open]);

  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));
  const toggleRole = (role: PodRoleApi) =>
    patch({ audienceRoles: draft.audienceRoles.includes(role) ? draft.audienceRoles.filter((item) => item !== role) : [...draft.audienceRoles, role] });

  async function submit() {
    if (!draft.title.trim() || !draft.startsAt) {
      setError("Add a title and a start time.");
      return;
    }
    if (draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      setError("The end time must be after the start time.");
      return;
    }
    setError("");
    try {
      await onSave({
        title: draft.title.trim(),
        description: draft.description.trim(),
        kind: draft.kind,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: draft.endsAt ? fromLocalInput(draft.endsAt) : null,
        location: draft.location.trim(),
        creditOverrides: Object.fromEntries(
          CREDIT_TIERS.map((tier) => {
            const raw = draft.overrides[tier].trim();
            const value = Number.parseInt(raw, 10);
            return [tier, raw === "" || !Number.isFinite(value) ? null : Math.min(5000, Math.max(0, value))];
          }),
        ) as TierOverrides,
        audienceRoles: draft.audienceRoles,
      });
      onClose();
    } catch {
      /* The mutation error is shown below. */
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={event ? "Edit internal event" : "New internal event"}
      subtitle="Credits are issued when you mark someone as attended, participated or hosted."
      width="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {event ? "Save changes" : "Create event"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FieldRow label="Title">
          <Input autoFocus value={draft.title} onChange={(input) => patch({ title: input.target.value })} placeholder="e.g. Monthly town hall" maxLength={200} />
        </FieldRow>
        <FieldRow label="Description">
          <Textarea value={draft.description} onChange={(input) => patch({ description: input.target.value })} rows={3} maxLength={4000} />
        </FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Type">
            <Select value={draft.kind} onChange={(input) => patch({ kind: input.target.value as EventKind })}>
              {EVENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {EVENT_KIND_LABELS[kind]}
                </option>
              ))}
            </Select>
          </FieldRow>
          <FieldRow label="Starts">
            <Input type="datetime-local" value={draft.startsAt} onChange={(input) => patch({ startsAt: input.target.value })} />
          </FieldRow>
          <FieldRow label="Ends (optional)">
            <Input type="datetime-local" value={draft.endsAt} onChange={(input) => patch({ endsAt: input.target.value })} />
          </FieldRow>
        </div>
        <FieldRow label="Location or link">
          <Input value={draft.location} onChange={(input) => patch({ location: input.target.value })} placeholder="Room, address, or meeting link" maxLength={400} />
        </FieldRow>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Credits for this event (leave blank to use the program default)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CREDIT_TIERS.map((tier) => {
              const fallback = defaults.data?.[tier === "attended" ? "eventAttendedCredits" : tier === "participated" ? "eventParticipatedCredits" : "eventHostedCredits"];
              return (
                <FieldRow key={tier} label={CREDIT_TIER_LABELS[tier]}>
                  <Input
                    type="number"
                    min={0}
                    max={5000}
                    inputMode="numeric"
                    value={draft.overrides[tier]}
                    placeholder={fallback === undefined ? "Default" : `Default ${fallback}`}
                    onChange={(input) => patch({ overrides: { ...draft.overrides, [tier]: input.target.value } })}
                  />
                </FieldRow>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Open to (leave empty for every role)</p>
          <div className="flex flex-wrap gap-2">
            {POD_ROLES.map((role) => {
              const active = draft.audienceRoles.includes(role.apiValue);
              return (
                <button
                  key={role.apiValue}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleRole(role.apiValue)}
                  className={cn(
                    "focus-ring rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active ? "border-ruby bg-ruby/15 text-ink" : "border-line text-ink-muted hover:text-ink",
                  )}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
        <InlineError message={error || saveError} />
      </div>
    </Drawer>
  );
}
