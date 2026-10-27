import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import {
  createPodComment,
  deletePodComment,
  markPodCommentsRead,
  resolvePodComment,
  updatePodComment,
  type PodComment,
} from "@/lib/api";
import { adminQueryKeys, podCommentsQueryOptions } from "@/lib/adminQueries";

type AudienceState = { admin: boolean; pod: boolean };
const DEFAULT_AUDIENCE: AudienceState = { admin: true, pod: false };

function visibilityFor(audience: AudienceState): PodComment["visibility"] | null {
  if (audience.admin && audience.pod) return "both";
  if (audience.admin) return "admin";
  if (audience.pod) return "pod";
  return null;
}

function audienceFor(visibility: PodComment["visibility"]): AudienceState {
  return { admin: visibility !== "pod", pod: visibility !== "admin" };
}

function audienceLabel(visibility: PodComment["visibility"]) {
  if (visibility === "both") return "Admins + pod";
  if (visibility === "pod") return "This pod";
  return "Pod Ops Admin";
}

function readableDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function PodCommentsPanel({ collegeId }: { collegeId: string }) {
  const queryClient = useQueryClient();
  const commentsQuery = useQuery(podCommentsQueryOptions(collegeId));
  const [status, setStatus] = useState<PodComment["status"]>("open");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AudienceState>(DEFAULT_AUDIENCE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<PodComment | null>(null);
  const [resolving, setResolving] = useState<PodComment | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const comments = commentsQuery.data ?? [];
  const visibleComments = useMemo(() => comments.filter((comment) => comment.status === status), [comments, status]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.podComments(collegeId) });
  const markReadMutation = useMutation({
    mutationFn: () => markPodCommentsRead(collegeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.podCommentUnreadCounts }),
  });

  useEffect(() => {
    if (commentsQuery.data?.some((comment) => comment.isUnread) && !markReadMutation.isPending) {
      markReadMutation.mutate();
    }
  }, [commentsQuery.dataUpdatedAt, collegeId]);

  const mutation = useMutation({
    mutationFn: async (action: { type: "create" | "edit" | "delete" | "resolve"; id?: string }) => {
      if (action.type === "delete" && action.id) return deletePodComment(action.id);
      if (action.type === "resolve" && action.id) return resolvePodComment(action.id, resolutionNote.trim());
      const visibility = visibilityFor(audience);
      if (!visibility) throw new Error("Choose at least one audience.");
      if (!body.trim()) throw new Error("Write a comment before saving.");
      if (action.type === "edit" && action.id) return updatePodComment(action.id, { body: body.trim(), visibility });
      return createPodComment({ collegeId, body: body.trim(), visibility });
    },
    onSuccess: async (_, action) => {
      await refresh();
      setFeedback(action.type === "resolve" ? "Comment resolved." : action.type === "delete" ? "Comment deleted." : "Comment saved.");
      setBody("");
      setAudience(DEFAULT_AUDIENCE);
      setComposerOpen(false);
      setEditing(null);
      setResolving(null);
      setResolutionNote("");
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "Could not update comments."),
  });

  function beginEdit(comment: PodComment) {
    setComposerOpen(true);
    setEditing(comment);
    setResolving(null);
    setBody(comment.body);
    setAudience(audienceFor(comment.visibility));
    setFeedback("");
  }

  function cancelComposer() {
    setComposerOpen(false);
    setEditing(null);
    setBody("");
    setAudience(DEFAULT_AUDIENCE);
  }

  function openComposer() {
    setComposerOpen(true);
    setEditing(null);
    setResolving(null);
    setBody("");
    setAudience(DEFAULT_AUDIENCE);
    setFeedback("");
  }

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-ruby-bright" /><h3 className="font-display font-bold text-ink">Pod comments</h3></div>
          <p className="mt-1 text-sm text-ink-muted">Leave a clear note and choose who should see it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={openComposer}>
            <Plus className="h-3.5 w-3.5" />
            Add comment
          </Button>
          <div className="flex rounded-lg border border-line bg-surface-2 p-1" aria-label="Comment status filter">
            {(["open", "resolved"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${status === value ? "bg-surface text-ink shadow-sm" : "text-ink-muted"}`}>{value}</button>
            ))}
          </div>
        </div>
      </div>

      {composerOpen ? (
        <form className="mt-4 rounded-xl border border-line bg-surface-2 p-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ type: editing ? "edit" : "create", id: editing?.id }); }}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{editing ? "Edit your comment" : "Add a comment"}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-ink-faint">{body.length}/2000</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md" aria-label="Close comment composer" title="Close composer" onClick={cancelComposer}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Textarea className="mt-2" maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should the team know about this pod?" />
          <fieldset className="mt-3">
            <legend className="text-xs font-medium text-ink-muted">Visible to</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink"><input type="checkbox" checked={audience.admin} onChange={(event) => setAudience((current) => ({ ...current, admin: event.target.checked }))} />Pod Ops Admin</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink"><input type="checkbox" checked={audience.pod} onChange={(event) => setAudience((current) => ({ ...current, pod: event.target.checked }))} />This pod</label>
            </div>
          </fieldset>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancelComposer}>{editing ? "Cancel edit" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={mutation.isPending || !body.trim() || !visibilityFor(audience)}>{mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add comment"}</Button>
          </div>
        </form>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-ink-muted" role="status">{feedback}</p> : null}
      {commentsQuery.isLoading ? <p className="mt-4 text-sm text-ink-muted">Loading comments…</p> : null}
      {commentsQuery.isError ? <p className="mt-4 text-sm text-bad">{commentsQuery.error instanceof Error ? commentsQuery.error.message : "Could not load comments."}</p> : null}
      {!commentsQuery.isLoading && !visibleComments.length ? <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-center text-sm text-ink-muted">No {status} comments for this pod.</p> : null}

      <div className="mt-4 flex flex-col gap-3">
        {visibleComments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-line bg-surface-2 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-sm font-semibold text-ink">{comment.createdByName}</p><p className="text-xs text-ink-faint">{readableDate(comment.createdAt)}</p></div>
              <div className="flex flex-wrap gap-1.5"><Badge tone={comment.status === "resolved" ? "good" : "amber"}>{comment.status}</Badge><Badge>{audienceLabel(comment.visibility)}</Badge></div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{comment.body}</p>
            {comment.status === "resolved" ? <div className="mt-3 rounded-lg border border-good/25 bg-good/10 p-3"><p className="text-xs font-semibold text-good">Resolved by {comment.resolvedByName} · {readableDate(comment.resolvedAt)}</p><p className="mt-1 text-sm text-ink-muted">{comment.resolutionNote}</p></div> : null}
            {resolving?.id === comment.id ? <form className="mt-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ type: "resolve", id: comment.id }); }}><Textarea maxLength={500} value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="What was resolved?" /><div className="mt-2 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { setResolving(null); setResolutionNote(""); }}>Cancel</Button><Button type="submit" size="sm" disabled={!resolutionNote.trim() || mutation.isPending}>Confirm resolution</Button></div></form> : null}
            {comment.status === "open" ? <div className="mt-3 flex flex-wrap justify-end gap-1.5">
              {comment.canEdit ? <Button type="button" variant="ghost" size="sm" onClick={() => beginEdit(comment)}><Pencil className="h-3.5 w-3.5" />Edit</Button> : null}
              {comment.canDelete ? <Button type="button" variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete this open comment?")) mutation.mutate({ type: "delete", id: comment.id }); }}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}
              {comment.canResolve && resolving?.id !== comment.id ? <Button type="button" variant="secondary" size="sm" onClick={() => { cancelComposer(); setResolving(comment); setResolutionNote(""); }}><CheckCircle2 className="h-3.5 w-3.5" />Resolve</Button> : null}
            </div> : null}
          </article>
        ))}
      </div>
    </Card>
  );
}
