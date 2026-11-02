import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import type { LorRequest } from "@/lib/experience";
import { reviewLorRequest } from "@/lib/experienceApi";
import { experienceKeys, lorQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";
import { InlineError, QueryState, errorMessage, formatCredits, formatDateTime } from "./shared";

const FILTERS = [
  { id: "requested", label: "Requested" },
  { id: "issued", label: "Issued" },
  { id: "declined", label: "Declined" },
] as const;

export function LorTab({ threshold }: { threshold?: number }) {
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("requested");
  const [selected, setSelected] = useState<LorRequest | null>(null);
  const requests = useQuery(lorQuery(status));
  const items = requests.data ?? [];

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
        {threshold ? <p className="text-xs text-ink-faint">Members can request an LoR at {formatCredits(threshold)} Experience Credits.</p> : null}
      </div>

      <QueryState isLoading={requests.isLoading} error={requests.error} onRetry={() => void requests.refetch()} label="Requests" />
      {!requests.isLoading && !requests.error && items.length === 0 ? (
        <EmptyState icon={Award} title="No requests here" description="Members who reach the credit threshold can request a Letter of Recommendation." />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-ink">{request.userName}</h3>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {formatPodRole(request.podRole)} · {request.collegeName}
                </p>
              </div>
              <Badge tone={request.status === "issued" ? "good" : request.status === "declined" ? "muted" : "amber"}>{request.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              {formatCredits(request.balanceAtRequest)} credits at request · {formatDateTime(request.createdAt)}
            </p>
            {request.memberNote ? <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{request.memberNote}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              {request.documentUrl ? (
                <a href={request.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-ruby-bright hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Letter
                </a>
              ) : (
                <span className="text-xs text-ink-faint">{request.reviewedByName ? `Reviewed by ${request.reviewedByName}` : ""}</span>
              )}
              {request.status === "requested" ? (
                <Button size="sm" onClick={() => setSelected(request)}>
                  Respond
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <LorDrawer request={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function LorDrawer({ request, onClose }: { request: LorRequest | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const review = useMutation({
    mutationFn: (decision: "issued" | "declined") => reviewLorRequest(request!.id, { decision, note: note.trim(), documentUrl: documentUrl.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      setNote("");
      setDocumentUrl("");
      onClose();
    },
  });

  return (
    <Drawer open={Boolean(request)} onClose={onClose} title={request?.userName ?? "LoR request"} subtitle={request ? `${formatCredits(request.balanceAtRequest)} credits at request` : undefined}>
      {request ? (
        <div className="space-y-4">
          {request.memberNote ? <p className="rounded-xl bg-surface-2 px-3 py-3 text-sm text-ink-muted">{request.memberNote}</p> : null}
          <FieldRow label="Link to the letter (when issuing)">
            <Input type="url" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="https://drive.google.com/…" />
          </FieldRow>
          <FieldRow label="Note to the member (optional)">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} />
          </FieldRow>
          <InlineError message={review.isError ? errorMessage(review.error) : undefined} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={review.isPending} onClick={() => review.mutate("declined")}>
              Decline
            </Button>
            <Button disabled={review.isPending} onClick={() => review.mutate("issued")}>
              {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              Mark LoR issued
            </Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
