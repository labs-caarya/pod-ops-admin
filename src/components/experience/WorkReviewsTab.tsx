import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Loader2, MessageSquareWarning, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import type { WorkItem, WorkReviewDecision } from "@/lib/experience";
import { reviewWorkItem } from "@/lib/experienceApi";
import { experienceKeys, workItemsQuery, workUpdatesQuery } from "@/lib/experienceQueries";
import { leaderGoalsQueryOptions } from "@/lib/adminQueries";
import { formatPodRole } from "@/lib/podRoles";
import { InlineError, QueryState, errorMessage, formatDateTime } from "./shared";

const FILTERS = [
  { id: "in_review", label: "Awaiting review" },
  { id: "active", label: "In progress" },
  { id: "done", label: "Completed" },
] as const;

const STATUS_TONE = { in_review: "info", active: "amber", done: "good", discarded: "muted" } as const;
const STATUS_LABEL = { in_review: "In review", active: "In progress", done: "Completed", discarded: "Discarded" } as const;

export function WorkReviewsTab() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("in_review");
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const work = useQuery(workItemsQuery(status));
  const items = work.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === filter.id ? "bg-ruby/20 text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-faint">Pods send work for review. Only you can mark it complete.</p>
      </div>

      <QueryState isLoading={work.isLoading} error={work.error} onRetry={() => void work.refetch()} label="Work" />

      {!work.isLoading && !work.error && items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={status === "in_review" ? "Nothing waiting for review" : "No work here yet"}
          description="Sprint goals assigned to pod roles show up here as members send updates."
        />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} hover className="flex flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {item.collegeName} · {formatPodRole(item.assignedPodRole)}
                  {item.assigneeName ? ` · ${item.assigneeName}` : ""}
                </p>
              </div>
              <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            </div>
            {item.status === "in_review" && item.submissionNote ? (
              <p className="mt-3 line-clamp-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-muted">{item.submissionNote}</p>
            ) : item.latestUpdates[0] ? (
              <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{item.latestUpdates[0].body}</p>
            ) : (
              <p className="mt-3 text-sm text-ink-faint">No updates yet.</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-faint">
              <span>
                {item.updateCount} update{item.updateCount === 1 ? "" : "s"}
                {item.lastUpdateAt ? ` · last ${formatDateTime(item.lastUpdateAt)}` : ""}
              </span>
              <Button size="sm" variant={item.status === "in_review" ? "primary" : "secondary"} onClick={() => setSelected(item)}>
                {item.status === "in_review" ? "Review" : "Open"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ReviewDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ReviewDrawer({ item, onClose }: { item: WorkItem | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const updates = useQuery(workUpdatesQuery(item?.id ?? ""));
  const [decision, setDecision] = useState<WorkReviewDecision>("complete");
  const [note, setNote] = useState("");
  const [credits, setCredits] = useState("");
  const [result, setResult] = useState("");

  const review = useMutation({
    mutationFn: () =>
      reviewWorkItem(item!.id, {
        decision,
        note: note.trim(),
        completionCredits: decision === "complete" && credits.trim() !== "" ? Number.parseInt(credits, 10) : undefined,
      }),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({ queryKey: leaderGoalsQueryOptions().queryKey }),
      ]);
      if (data.awards.length) {
        setResult(`Marked complete. ${data.awards.map((award) => `${award.name} +${award.amount}`).join(", ")} credits issued.`);
      } else {
        onClose();
      }
    },
  });

  function close() {
    setDecision("complete");
    setNote("");
    setCredits("");
    setResult("");
    review.reset();
    onClose();
  }

  const open = Boolean(item);
  const closed = item ? item.status === "done" || item.status === "discarded" : false;
  const defaultCredits = item?.completionCredits;

  return (
    <Drawer open={open} onClose={close} title={item?.title ?? "Work"} subtitle={item ? `${item.collegeName} · ${formatPodRole(item.assignedPodRole)}` : undefined} width="max-w-2xl">
      {item ? (
        <div className="space-y-6">
          {item.description ? <p className="text-sm leading-relaxed text-ink-muted">{item.description}</p> : null}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">History</h3>
            <QueryState isLoading={updates.isLoading} error={updates.error} onRetry={() => void updates.refetch()} label="Updates" />
            {updates.data?.updates.length === 0 ? <p className="text-sm text-ink-muted">No updates have been posted.</p> : null}
            <ol className="space-y-2">
              {updates.data?.updates.map((update) => (
                <li
                  key={update.id}
                  className={`rounded-xl border px-3 py-2.5 ${update.isAdmin ? "border-ruby/30 bg-ruby/5" : "border-line bg-surface-2"}`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    <span className="font-medium text-ink">{update.authorName}</span>
                    <Badge tone={update.kind === "review_request" ? "info" : update.kind === "review_feedback" ? "ruby" : "muted"}>
                      {update.kind === "review_request" ? "Sent for review" : update.kind === "review_feedback" ? "CREW feedback" : "Update"}
                    </Badge>
                    <span>{formatDateTime(update.createdAt)}</span>
                    {update.creditsAwarded ? <span className="text-amber-bright">+{update.creditsAwarded} XC</span> : null}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-muted">{update.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {result ? (
            <div className="rounded-xl border border-good/30 bg-good/10 px-3 py-3 text-sm text-good">
              <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
              {result}
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={close}>
                  Done
                </Button>
              </div>
            </div>
          ) : closed ? (
            <p className="rounded-xl border border-line bg-surface-2 px-3 py-3 text-sm text-ink-muted">This work is {item.status === "done" ? "complete" : "discarded"}.</p>
          ) : (
            <section className="rounded-2xl border border-line p-4">
              <h3 className="mb-3 font-display text-sm font-bold text-ink">Your decision</h3>
              <div className="space-y-3">
                <FieldRow label="Decision">
                  <Select value={decision} onChange={(event) => setDecision(event.target.value as WorkReviewDecision)}>
                    <option value="complete">Mark complete and issue credits</option>
                    <option value="request_changes" disabled={item.status !== "in_review"}>
                      Send back with feedback
                    </option>
                    <option value="discard">Discard</option>
                  </Select>
                </FieldRow>
                {decision === "complete" ? (
                  <FieldRow label="Completion credits (optional override)">
                    <Input
                      type="number"
                      min={0}
                      max={5000}
                      value={credits}
                      onChange={(event) => setCredits(event.target.value)}
                      placeholder={defaultCredits != null ? `${defaultCredits} (set on this work)` : "Uses the global rule"}
                    />
                  </FieldRow>
                ) : null}
                <FieldRow label={decision === "request_changes" ? "What needs to change?" : "Note to the pod (optional)"}>
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} />
                </FieldRow>
                <InlineError message={review.isError ? errorMessage(review.error) : undefined} />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={decision === "discard" ? "danger" : "primary"}
                    disabled={review.isPending || (decision === "request_changes" && !note.trim())}
                    onClick={() => review.mutate()}
                  >
                    {review.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : decision === "discard" ? (
                      <Trash2 className="h-4 w-4" />
                    ) : decision === "request_changes" ? (
                      <MessageSquareWarning className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {decision === "complete" ? "Complete work" : decision === "discard" ? "Discard work" : "Send back"}
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}
