import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MessageSquareText, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldRow } from "@/components/ui/Field";
import { PodMentionTextarea } from "@/components/moksha/PodMentionTextarea";
import { createPodComment, type PodComment } from "@/lib/api";
import { adminQueryKeys, collegesQueryOptions, podCommentsQueryOptions } from "@/lib/adminQueries";
import { listPodColleges } from "@/lib/podLeaders";
import { prepareCommentBody, resolveCollegeIdFromMentions, resolveVisibilityFromSlash } from "@/lib/podMentions";
import { cn } from "@/lib/utils";

type RecentComment = {
  id: string;
  body: string;
  podName: string;
  visibility: PodComment["visibility"];
  at: string;
};

function visibilityLabel(visibility: PodComment["visibility"]) {
  if (visibility === "admin") return "Admins only";
  if (visibility === "pod") return "This pod only";
  return "Admins + pod";
}

export function MokshaCommentPanel({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const collegesQuery = useQuery(collegesQueryOptions());
  const pods = useMemo(() => listPodColleges(collegesQuery.data || []), [collegesQuery.data]);

  const [body, setBody] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentComment[]>([]);

  const resolvedCollegeId = collegeId || resolveCollegeIdFromMentions(body, pods);
  const selectedPod = pods.find((pod) => pod.id === resolvedCollegeId) ?? null;
  const resolvedVisibility = resolveVisibilityFromSlash(body) ?? "both";

  const previewQuery = useQuery({
    ...podCommentsQueryOptions(resolvedCollegeId || ""),
    enabled: Boolean(resolvedCollegeId),
  });
  const previewComments = useMemo(() => {
    if (!resolvedCollegeId) return [];
    return (previewQuery.data ?? []).filter((c) => c.status === "open").slice(0, 4);
  }, [previewQuery.data, resolvedCollegeId]);

  async function postComment() {
    const { body: postBody, visibility } = prepareCommentBody(body);
    if (!postBody.trim()) {
      setError("Write a comment first.");
      return;
    }
    const targetId = collegeId || resolveCollegeIdFromMentions(body, pods);
    if (!targetId) {
      setError("Tag a pod with @ — type @ and pick a pod name.");
      return;
    }
    const pod = pods.find((item) => item.id === targetId);
    setSaving(true);
    setError(null);
    try {
      const saved = await createPodComment({ collegeId: targetId, body: postBody.trim(), visibility });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.podComments(targetId) }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.podCommentUnreadCounts }),
      ]);
      setRecent((items) => [
        {
          id: saved.id,
          body: saved.body,
          podName: pod?.name || saved.collegeName,
          visibility: saved.visibility,
          at: new Date().toISOString(),
        },
        ...items.slice(0, 4),
      ]);
      setBody("");
      setCollegeId("");
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Could not post comment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <p className="mb-3 shrink-0 text-sm text-ink-muted">
        <span className="font-medium text-ink">@pod</span> for where,{" "}
        <span className="font-medium text-ink">/admin</span> or <span className="font-medium text-ink">/pod</span> for
        audience, then your message.
      </p>

      {collegesQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading pods…
        </div>
      ) : (
        <>
          {recent.length ? (
            <div className="mb-3 max-h-28 shrink-0 space-y-2 overflow-y-auto rounded-xl border border-line bg-surface-2/60 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Just posted</p>
              {recent.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
                  <div>
                    <p className="font-medium text-ink">
                      {item.podName} · {visibilityLabel(item.visibility)}
                    </p>
                    <p className="line-clamp-2 text-ink-muted">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-visible">
            <FieldRow label="Comment">
              <PodMentionTextarea
                value={body}
                onChange={setBody}
                pods={pods}
                slashMode="visibility"
                disabled={saving}
                placeholder="e.g. @Pod Name /pod Please close the loop on yesterday's outreach…"
                onMentionPod={(pod) => setCollegeId(pod.id)}
              />
            </FieldRow>

            <div className="flex flex-wrap gap-2">
              {selectedPod ? (
                <Badge tone="info">
                  <MessageSquareText className="h-3 w-3" /> {selectedPod.name}
                </Badge>
              ) : (
                <Badge tone="amber">Add @pod</Badge>
              )}
              <Badge tone={resolvedVisibility === "admin" ? "muted" : "good"}>{visibilityLabel(resolvedVisibility)}</Badge>
            </div>

            {selectedPod && previewComments.length ? (
              <div className="rounded-xl border border-line bg-surface-2/40 p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  Open on {selectedPod.name}
                </p>
                <ul className="space-y-2">
                  {previewComments.map((comment) => (
                    <li key={comment.id} className="text-xs text-ink-muted">
                      <span className="font-medium text-ink">{comment.createdByName || "Admin"}</span>
                      {" · "}
                      {comment.body}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-2 shrink-0 text-xs text-bad">{error}</p> : null}

          <Button
            type="button"
            className="mt-3 w-full shrink-0"
            disabled={saving || !body.trim() || !resolvedCollegeId}
            onClick={() => void postComment()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post comment
          </Button>
        </>
      )}
    </div>
  );
}
