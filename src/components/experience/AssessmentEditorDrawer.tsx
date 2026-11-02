import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import type { Assessment, AssessmentQuestion, AssessmentScope, AssessmentStatus, AssessmentWriteInput } from "@/lib/experience";
import { POD_ROLES, type PodRoleApi } from "@/lib/podRoles";
import { cn } from "@/lib/utils";
import { InlineError } from "./shared";

const blankQuestion = (): AssessmentQuestion => ({
  prompt: "",
  explanation: "",
  options: [
    { text: "", correct: true },
    { text: "", correct: false },
  ],
});

interface Draft {
  title: string;
  description: string;
  scope: AssessmentScope;
  roles: PodRoleApi[];
  passMarkPercent: string;
  credits: string;
  status: AssessmentStatus;
  sortOrder: string;
  questions: AssessmentQuestion[];
}

const EMPTY: Draft = {
  title: "",
  description: "",
  scope: "caarya",
  roles: [],
  passMarkPercent: "70",
  credits: "25",
  status: "draft",
  sortOrder: "0",
  questions: [blankQuestion()],
};

function fromAssessment(assessment: Assessment): Draft {
  return {
    title: assessment.title,
    description: assessment.description,
    scope: assessment.scope,
    roles: assessment.roles,
    passMarkPercent: String(assessment.passMarkPercent),
    credits: String(assessment.credits),
    status: assessment.status,
    sortOrder: String(assessment.sortOrder),
    questions: assessment.questions.length ? assessment.questions.map((question) => ({ ...question, options: question.options.map((option) => ({ ...option })) })) : [blankQuestion()],
  };
}

/** Problems that would stop the assessment from being published. */
function publishProblems(draft: Draft): string[] {
  const problems: string[] = [];
  if (draft.scope === "role" && draft.roles.length === 0) problems.push("Pick at least one role.");
  draft.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.prompt.trim()) problems.push(`${label} needs a prompt.`);
    if (question.options.some((option) => !option.text.trim())) problems.push(`${label} has an empty option.`);
    if (!question.options.some((option) => option.correct)) problems.push(`${label} needs a correct answer.`);
    if (question.options.every((option) => option.correct)) problems.push(`${label} cannot have every option correct.`);
  });
  return problems;
}

export function AssessmentEditorDrawer({
  open,
  onClose,
  assessment,
  onSave,
  isSaving,
  saveError,
}: {
  open: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  onSave: (input: AssessmentWriteInput) => Promise<void>;
  isSaving: boolean;
  saveError: string;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setDraft(assessment ? fromAssessment(assessment) : EMPTY);
  }, [assessment, open]);

  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));
  const patchQuestion = (index: number, changes: Partial<AssessmentQuestion>) =>
    patch({ questions: draft.questions.map((question, position) => (position === index ? { ...question, ...changes } : question)) });
  const patchOption = (questionIndex: number, optionIndex: number, changes: Partial<AssessmentQuestion["options"][number]>) =>
    patchQuestion(questionIndex, {
      options: draft.questions[questionIndex].options.map((option, position) => (position === optionIndex ? { ...option, ...changes } : option)),
    });
  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.questions.length) return;
    const next = [...draft.questions];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ questions: next });
  };
  const toggleRole = (role: PodRoleApi) =>
    patch({ roles: draft.roles.includes(role) ? draft.roles.filter((item) => item !== role) : [...draft.roles, role] });

  async function submit() {
    if (!draft.title.trim()) {
      setError("Give the assessment a title.");
      return;
    }
    if (draft.status === "published") {
      const problems = publishProblems(draft);
      if (problems.length) {
        setError(problems[0]);
        return;
      }
    } else if (draft.scope === "role" && draft.roles.length === 0) {
      setError("Pick at least one role.");
      return;
    }
    setError("");
    const input: AssessmentWriteInput = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      scope: draft.scope,
      roles: draft.scope === "role" ? draft.roles : [],
      passMarkPercent: Math.min(100, Math.max(1, Number.parseInt(draft.passMarkPercent, 10) || 70)),
      credits: Math.max(0, Number.parseInt(draft.credits, 10) || 0),
      status: draft.status,
      sortOrder: Math.max(0, Number.parseInt(draft.sortOrder, 10) || 0),
      questions: draft.questions
        .filter((question) => question.prompt.trim() || question.options.some((option) => option.text.trim()))
        .map((question) => ({
          id: question.id,
          prompt: question.prompt.trim(),
          explanation: question.explanation.trim(),
          options: question.options.map((option) => ({ id: option.id, text: option.text.trim(), correct: option.correct })),
        })),
    };
    try {
      await onSave(input);
      onClose();
    } catch {
      /* The mutation error is shown below. */
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={assessment ? "Edit assessment" : "New assessment"}
      subtitle="Members earn credits the first time they pass."
      width="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {assessment ? "Save changes" : "Create assessment"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <FieldRow label="Title">
            <Input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="e.g. Do you understand Caarya?" maxLength={200} />
          </FieldRow>
          <FieldRow label="Description (shown to members)">
            <Textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} rows={2} maxLength={2000} />
          </FieldRow>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="What does it test?">
              <Select value={draft.scope} onChange={(event) => patch({ scope: event.target.value as AssessmentScope })}>
                <option value="caarya">Understanding of Caarya (everyone)</option>
                <option value="role">Understanding of a role</option>
              </Select>
            </FieldRow>
            <FieldRow label="Status">
              <Select value={draft.status} onChange={(event) => patch({ status: event.target.value as AssessmentStatus })}>
                <option value="draft">Draft (hidden from members)</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FieldRow>
          </div>
          {draft.scope === "role" ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-muted">Which roles see it?</p>
              <div className="flex flex-wrap gap-2">
                {POD_ROLES.map((role) => {
                  const active = draft.roles.includes(role.apiValue);
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
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldRow label="Pass mark (%)">
              <Input type="number" min={1} max={100} value={draft.passMarkPercent} onChange={(event) => patch({ passMarkPercent: event.target.value })} />
            </FieldRow>
            <FieldRow label="Credits for passing">
              <Input type="number" min={0} max={5000} value={draft.credits} onChange={(event) => patch({ credits: event.target.value })} />
            </FieldRow>
            <FieldRow label="Display order">
              <Input type="number" min={0} value={draft.sortOrder} onChange={(event) => patch({ sortOrder: event.target.value })} />
            </FieldRow>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">Questions ({draft.questions.length})</h3>
            <Button size="sm" variant="secondary" onClick={() => patch({ questions: [...draft.questions, blankQuestion()] })}>
              <Plus className="h-4 w-4" />
              Add question
            </Button>
          </div>
          {draft.questions.map((question, questionIndex) => {
            const correctCount = question.options.filter((option) => option.correct).length;
            return (
              <div key={question.id ?? `new-${questionIndex}`} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Question {questionIndex + 1}</span>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Move up" disabled={questionIndex === 0} onClick={() => moveQuestion(questionIndex, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Move down"
                      disabled={questionIndex === draft.questions.length - 1}
                      onClick={() => moveQuestion(questionIndex, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-bad"
                      aria-label="Delete question"
                      disabled={draft.questions.length === 1}
                      onClick={() => patch({ questions: draft.questions.filter((_, position) => position !== questionIndex) })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Textarea value={question.prompt} onChange={(event) => patchQuestion(questionIndex, { prompt: event.target.value })} rows={2} placeholder="Ask the question" maxLength={1000} />
                <p className="mb-2 mt-3 text-xs text-ink-faint">
                  Tick the correct answer{correctCount > 1 ? "s. Members must pick exactly these (select all that apply)." : ". Tick more than one to make it select-all-that-apply."}
                </p>
                <ul className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <li key={option.id ?? `option-${optionIndex}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`Option ${optionIndex + 1} is correct`}
                        checked={option.correct}
                        onChange={(event) => patchOption(questionIndex, optionIndex, { correct: event.target.checked })}
                        className="h-4 w-4 shrink-0 accent-[#fb3a63]"
                      />
                      <Input
                        value={option.text}
                        onChange={(event) => patchOption(questionIndex, optionIndex, { text: event.target.value })}
                        placeholder={`Option ${optionIndex + 1}`}
                        maxLength={400}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Remove option ${optionIndex + 1}`}
                        disabled={question.options.length <= 2}
                        onClick={() => patchQuestion(questionIndex, { options: question.options.filter((_, position) => position !== optionIndex) })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
                {question.options.length < 8 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => patchQuestion(questionIndex, { options: [...question.options, { text: "", correct: false }] })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add option
                  </Button>
                ) : null}
                <div className="mt-3">
                  <FieldRow label="Explanation (shown after passing)">
                    <Input value={question.explanation} onChange={(event) => patchQuestion(questionIndex, { explanation: event.target.value })} maxLength={1000} />
                  </FieldRow>
                </div>
              </div>
            );
          })}
        </section>

        <InlineError message={error || saveError} />
      </div>
    </Drawer>
  );
}
