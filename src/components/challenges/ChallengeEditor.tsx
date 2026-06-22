import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, GitBranch, Target, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Misc";
import { emptyWhys, actionProgress, rcaProgress } from "@/lib/data/challenges";
import { CHALLENGE_PILLARS, CHALLENGE_STATUSES } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { Challenge, ChallengeSeverity, ChallengeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITIES: ChallengeSeverity[] = ["Low", "Medium", "High", "Critical"];

export type ChallengeStep = "map" | "rca" | "solve";

const STEPS: { id: ChallengeStep; label: string; icon: typeof Target; hint: string }[] = [
  { id: "map", label: "Map", icon: Target, hint: "Symptoms & impact" },
  { id: "rca", label: "RCA", icon: GitBranch, hint: "5 Whys → root cause" },
  { id: "solve", label: "Solve", icon: ListChecks, hint: "Owned actions" },
];

export function useChallengeForm(challenge: Challenge) {
  const [form, setForm] = useState<Challenge>({
    ...challenge,
    whys: challenge.whys.length ? challenge.whys : emptyWhys(),
  });

  useEffect(() => {
    setForm({
      ...challenge,
      whys: challenge.whys.length ? challenge.whys : emptyWhys(),
    });
  }, [challenge.id]);

  const set =
    <K extends keyof Challenge>(key: K) =>
    (value: Challenge[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const setWhy = (index: number, answer: string) => {
    setForm((f) => ({
      ...f,
      whys: f.whys.map((w, i) => (i === index ? { ...w, answer } : w)),
    }));
  };

  const addSymptom = () => set("symptoms")([...form.symptoms, ""]);
  const updateSymptom = (i: number, value: string) => {
    set("symptoms")(form.symptoms.map((s, idx) => (idx === i ? value : s)));
  };
  const removeSymptom = (i: number) => set("symptoms")(form.symptoms.filter((_, idx) => idx !== i));

  const addAction = () => {
    set("actions")([
      ...form.actions,
      { id: makeId("act"), label: "", done: false, owner: form.owner },
    ]);
  };
  const updateAction = (id: string, patch: Partial<Challenge["actions"][0]>) => {
    set("actions")(form.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeAction = (id: string) => set("actions")(form.actions.filter((a) => a.id !== id));

  const normalized = useMemo(() => {
    const symptoms = form.symptoms.map((s) => s.trim()).filter(Boolean);
    const actions = form.actions.filter((a) => a.label.trim());
    return { ...form, symptoms, actions };
  }, [form]);

  const stepComplete = useMemo(
    () => ({
      map: Boolean(normalized.title.trim() && (normalized.symptoms.length > 0 || normalized.impact.trim())),
      rca: Boolean(normalized.rootCause.trim()),
      solve: normalized.actions.length > 0 && normalized.actions.every((a) => a.done),
    }),
    [normalized],
  );

  return {
    form,
    normalized,
    set,
    setWhy,
    addSymptom,
    updateSymptom,
    removeSymptom,
    addAction,
    updateAction,
    removeAction,
    stepComplete,
    rcaPct: rcaProgress(normalized),
    actionPct: actionProgress(normalized),
  };
}

export function ChallengeStepNav({
  active,
  onChange,
  stepComplete,
}: {
  active: ChallengeStep;
  onChange: (step: ChallengeStep) => void;
  stepComplete: Record<ChallengeStep, boolean>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = active === step.id;
        const done = stepComplete[step.id];
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onChange(step.id)}
            className={cn(
              "relative rounded-xl border px-3 py-3 text-left transition-colors sm:px-4",
              isActive
                ? "border-ruby/40 bg-ruby/10"
                : "border-line bg-surface-2 hover:border-line-strong hover:bg-surface-3",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  done ? "bg-good/20 text-good" : isActive ? "bg-ruby/20 text-ruby-bright" : "bg-surface-3 text-ink-faint",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display font-bold text-ink">
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {step.label}
                </p>
                <p className="truncate text-[11px] text-ink-faint">{step.hint}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ChallengeFormSections({
  activeStep,
  form,
  set,
  setWhy,
  addSymptom,
  updateSymptom,
  removeSymptom,
  addAction,
  updateAction,
  removeAction,
}: {
  activeStep: ChallengeStep;
  form: Challenge;
  set: ReturnType<typeof useChallengeForm>["set"];
  setWhy: ReturnType<typeof useChallengeForm>["setWhy"];
  addSymptom: ReturnType<typeof useChallengeForm>["addSymptom"];
  updateSymptom: ReturnType<typeof useChallengeForm>["updateSymptom"];
  removeSymptom: ReturnType<typeof useChallengeForm>["removeSymptom"];
  addAction: ReturnType<typeof useChallengeForm>["addAction"];
  updateAction: ReturnType<typeof useChallengeForm>["updateAction"];
  removeAction: ReturnType<typeof useChallengeForm>["removeAction"];
}) {
  if (activeStep === "map") {
    return (
      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ruby-bright">
            <Target className="h-3.5 w-3.5" /> Map the challenge
          </p>
          <p className="mt-1 text-sm text-ink-muted">Name the blocker and capture what you observe on the ground.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldRow label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="What's blocking the pod?" />
          </FieldRow>
          <FieldRow label="Pillar">
            <Select value={form.pillar} onChange={(e) => set("pillar")(e.target.value as Challenge["pillar"])}>
              {CHALLENGE_PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Severity">
            <Select value={form.severity} onChange={(e) => set("severity")(e.target.value as ChallengeSeverity)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Status">
            <Select value={form.status} onChange={(e) => set("status")(e.target.value as ChallengeStatus)}>
              {CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Owner">
            <Input value={form.owner} onChange={(e) => set("owner")(e.target.value)} placeholder="Who's driving this?" />
          </FieldRow>
          <FieldRow label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} />
          </FieldRow>
          <FieldRow label="Impact if unsolved" className="sm:col-span-2">
            <Textarea value={form.impact} onChange={(e) => set("impact")(e.target.value)} rows={3} placeholder="What does this cost the pod?" />
          </FieldRow>
        </div>
        <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Symptoms</span>
            <Button type="button" variant="ghost" size="sm" onClick={addSymptom}>
              <Plus className="h-3.5 w-3.5" /> Add symptom
            </Button>
          </div>
          <div className="space-y-2">
            {form.symptoms.length === 0 && (
              <p className="text-sm text-ink-faint">Observable signals — e.g. &quot;3 brands stuck in conversation for 3+ weeks&quot;</p>
            )}
            {form.symptoms.map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-2.5 text-ink-faint">·</span>
                <Input value={s} onChange={(e) => updateSymptom(i, e.target.value)} placeholder="What are you seeing?" className="flex-1" />
                <button type="button" onClick={() => removeSymptom(i)} className="shrink-0 self-center text-ink-faint hover:text-bad">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (activeStep === "rca") {
    return (
      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-bright">
            <GitBranch className="h-3.5 w-3.5" /> Root cause analysis
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Ask &quot;why?&quot; five times to peel back from symptoms to the systemic root — not who to blame.
          </p>
        </div>
        <div className="space-y-4">
          {form.whys.map((why, i) => (
            <div key={why.id} className="relative flex gap-4">
              {i < form.whys.length - 1 && (
                <span className="absolute left-[15px] top-10 h-[calc(100%+4px)] w-0.5 bg-gradient-to-b from-amber/40 to-transparent" />
              )}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-amber/15 font-display text-sm font-black text-amber-bright">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pb-2">
                <label className="text-xs font-medium text-ink-muted">
                  {i === 0 ? "Why is this happening?" : "Why is that?"}
                </label>
                <Textarea
                  value={why.answer}
                  onChange={(e) => setWhy(i, e.target.value)}
                  rows={2}
                  className="mt-1.5"
                  placeholder={`Your answer to why #${i + 1}…`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-amber/25 bg-amber/5 p-4">
          <FieldRow label="Root cause conclusion">
            <Textarea
              value={form.rootCause}
              onChange={(e) => set("rootCause")(e.target.value)}
              rows={4}
              placeholder="The underlying cause you'll solve for — not a symptom."
            />
          </FieldRow>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-good">
          <ListChecks className="h-3.5 w-3.5" /> Solve for it
        </p>
        <p className="mt-1 text-sm text-ink-muted">Break the root cause into owned actions. Check off as you go.</p>
      </div>
      {form.rootCause && (
        <div className="mb-5 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Solving for</p>
          <p className="mt-1 text-sm text-ink">{form.rootCause}</p>
        </div>
      )}
      <div className="space-y-2">
        {form.actions.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink-faint">
            No actions yet — add the first step to fix the root cause.
          </p>
        )}
        {form.actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors",
              action.done ? "border-good/30 bg-good/5" : "border-line bg-surface-2",
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-good"
              checked={action.done}
              onChange={(e) => updateAction(action.id, { done: e.target.checked })}
            />
            <Input
              value={action.label}
              onChange={(e) => updateAction(action.id, { label: e.target.value })}
              className={cn("min-w-[200px] flex-1", action.done && "line-through opacity-70")}
              placeholder="What needs to happen?"
            />
            <Input
              value={action.owner ?? ""}
              onChange={(e) => updateAction(action.id, { owner: e.target.value })}
              className="w-32"
              placeholder="Owner"
            />
            <button type="button" onClick={() => removeAction(action.id)} className="text-ink-faint hover:text-bad">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={addAction}>
        <Plus className="h-4 w-4" /> Add action
      </Button>
      <FieldRow label="Notes" className="mt-6">
        <Textarea value={form.notes ?? ""} onChange={(e) => set("notes")(e.target.value)} rows={3} placeholder="Context, links, or follow-ups…" />
      </FieldRow>
    </Card>
  );
}

export function ChallengeProgressStrip({ rcaPct, actionPct }: { rcaPct: number; actionPct: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-faint">
          <GitBranch className="h-3.5 w-3.5" /> RCA depth
        </p>
        <ProgressBar value={rcaPct} tone={rcaPct >= 80 ? "good" : rcaPct >= 40 ? "amber" : "ruby"} />
        <p className="mt-1 text-xs text-ink-muted">{rcaPct}% toward root cause</p>
      </div>
      <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-faint">
          <ListChecks className="h-3.5 w-3.5" /> Actions
        </p>
        <ProgressBar value={actionPct} tone={actionPct >= 100 ? "good" : "amber"} />
        <p className="mt-1 text-xs text-ink-muted">{actionPct}% complete</p>
      </div>
    </div>
  );
}
