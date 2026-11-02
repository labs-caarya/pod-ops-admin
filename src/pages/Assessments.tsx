import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Edit3, GraduationCap, Plus, Trash2 } from "lucide-react";
import { AssessmentEditorDrawer } from "@/components/experience/AssessmentEditorDrawer";
import { QueryState, errorMessage, formatDateTime } from "@/components/experience/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Assessment, AssessmentWriteInput } from "@/lib/experience";
import { deleteAssessment, saveAssessment } from "@/lib/experienceApi";
import { assessmentDetailQuery, assessmentsQuery, experienceKeys } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";

const STATUS_TONE = { draft: "muted", published: "good", archived: "warn" } as const;

export default function Assessments() {
  const queryClient = useQueryClient();
  const assessments = useQuery(assessmentsQuery());
  const items = assessments.data ?? [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [resultsId, setResultsId] = useState("");

  const save = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: AssessmentWriteInput }) => saveAssessment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: experienceKeys.assessments }),
  });
  const remove = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: experienceKeys.assessments }),
  });

  const openEditor = (assessment: Assessment | null) => {
    save.reset();
    setEditing(assessment);
    setEditorOpen(true);
  };

  const groups: { title: string; hint: string; items: Assessment[] }[] = [
    { title: "Understanding Caarya", hint: "Everyone sees these.", items: items.filter((item) => item.scope === "caarya") },
    { title: "Understanding a role", hint: "Shown only to the roles you pick.", items: items.filter((item) => item.scope === "role") },
  ];

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="Assessments"
        description="Short MCQ checks on how well members understand Caarya and their role. You write the questions, options and right answers; members earn Experience Credits the first time they pass."
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" />
            New assessment
          </Button>
        }
      />

      <QueryState isLoading={assessments.isLoading} error={assessments.error} onRetry={() => void assessments.refetch()} label="Assessments" />

      {!assessments.isLoading && !assessments.error && items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No assessments yet"
          description="Create one for Caarya as a whole, or for a specific role. New assessments start as drafts."
          action={
            <Button onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" />
              New assessment
            </Button>
          }
        />
      ) : null}

      <div className="space-y-8">
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.title}>
              <div className="mb-3">
                <h2 className="font-display text-lg font-bold text-ink">{group.title}</h2>
                <p className="text-xs text-ink-faint">{group.hint}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((assessment) => (
                  <Card key={assessment.id} hover className="flex min-w-0 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 font-display text-base font-bold text-ink">{assessment.title}</h3>
                      <Badge tone={STATUS_TONE[assessment.status]}>{assessment.status}</Badge>
                    </div>
                    {assessment.description ? <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{assessment.description}</p> : null}
                    {assessment.scope === "role" ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {assessment.roles.map((role) => (
                          <Badge key={role} tone="info">
                            {formatPodRole(role)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-surface-2 py-2">
                        <dd className="font-display text-base font-bold text-ink">{assessment.questionCount}</dd>
                        <dt className="text-ink-faint">Questions</dt>
                      </div>
                      <div className="rounded-lg bg-surface-2 py-2">
                        <dd className="font-display text-base font-bold text-amber-bright">{assessment.credits}</dd>
                        <dt className="text-ink-faint">Credits</dt>
                      </div>
                      <div className="rounded-lg bg-surface-2 py-2">
                        <dd className="font-display text-base font-bold text-ink">
                          {assessment.passedCount}/{assessment.attemptCount}
                        </dd>
                        <dt className="text-ink-faint">Passed</dt>
                      </div>
                    </dl>
                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1" variant="secondary" size="sm" onClick={() => openEditor(assessment)}>
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" aria-label={`Results for ${assessment.title}`} title="Results" onClick={() => setResultsId(assessment.id)}>
                        <BarChart3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Delete ${assessment.title}`}
                        title={assessment.attemptCount ? "Archive" : "Delete"}
                        disabled={remove.isPending}
                        onClick={() => {
                          const message = assessment.attemptCount
                            ? `“${assessment.title}” has attempts, so it will be archived instead of deleted.`
                            : `Delete “${assessment.title}”?`;
                          if (window.confirm(message)) remove.mutate(assessment.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
      </div>
      {remove.isError ? <p className="mt-4 text-sm text-bad">{errorMessage(remove.error)}</p> : null}

      <AssessmentEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        assessment={editing}
        onSave={async (input) => {
          await save.mutateAsync({ id: editing?.id ?? null, input });
        }}
        isSaving={save.isPending}
        saveError={save.isError ? errorMessage(save.error) : ""}
      />
      <ResultsDrawer id={resultsId} onClose={() => setResultsId("")} />
    </div>
  );
}

function ResultsDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useQuery(assessmentDetailQuery(id));
  const attempts = detail.data?.attempts ?? [];
  return (
    <Drawer open={Boolean(id)} onClose={onClose} title={detail.data?.title ?? "Results"} subtitle="Most recent attempts" width="max-w-2xl">
      <QueryState isLoading={detail.isLoading} error={detail.error} onRetry={() => void detail.refetch()} label="Results" />
      {detail.data && attempts.length === 0 ? <p className="text-sm text-ink-muted">Nobody has attempted this yet.</p> : null}
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {attempts.map((attempt) => (
          <li key={attempt.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{attempt.userName}</p>
              <p className="text-xs text-ink-faint">
                {formatPodRole(attempt.podRole)} · {attempt.collegeName} · {formatDateTime(attempt.createdAt)}
              </p>
            </div>
            <span className="text-sm text-ink-muted">
              {attempt.correctCount}/{attempt.totalQuestions} ({attempt.scorePercent}%)
            </span>
            <Badge tone={attempt.passed ? "good" : "bad"}>{attempt.passed ? "Passed" : "Not yet"}</Badge>
            {attempt.creditsAwarded ? <Badge tone="amber">+{attempt.creditsAwarded}</Badge> : null}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
