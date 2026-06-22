import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Vault, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { challengeStore } from "@/lib/data/collections";
import { emptyWhys } from "@/lib/data/challenges";
import {
  CHALLENGE_SEVERITY_TONE,
  CHALLENGE_STATUS_TONE,
} from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { Challenge } from "@/lib/types";
import {
  ChallengeFormSections,
  ChallengeProgressStrip,
  ChallengeStepNav,
  useChallengeForm,
  type ChallengeStep,
} from "@/components/challenges/ChallengeEditor";

const STEP_ORDER: ChallengeStep[] = ["map", "rca", "solve"];

function emptyChallenge(): Challenge {
  return {
    id: makeId("ch"),
    title: "",
    description: "",
    pillar: "Ops",
    status: "Mapped",
    severity: "Medium",
    symptoms: [],
    impact: "",
    whys: emptyWhys(),
    rootCause: "",
    actions: [],
    owner: "",
  };
}

export default function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const challenges = useCollection(challengeStore);
  const isNew = challengeId === "new";

  const stored = isNew ? null : challenges.find((c) => c.id === challengeId);
  const [activeStep, setActiveStep] = useState<ChallengeStep>("map");

  if (!isNew && !stored) {
    return (
      <EmptyState
        icon={Vault}
        title="Challenge not found"
        description="This challenge may have been removed."
        action={
          <Link to="/challenges">
            <Button>Back to Challenge Vault</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ChallengeDetailBody
      key={stored?.id ?? "new"}
      initial={stored ?? emptyChallenge()}
      isNew={isNew}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      onSaved={(id) => {
        if (isNew) navigate(`/challenges/${id}`, { replace: true });
      }}
      onDeleted={() => navigate("/challenges")}
      onCancel={() => navigate("/challenges")}
    />
  );
}

function ChallengeDetailBody({
  initial,
  isNew,
  activeStep,
  onStepChange,
  onSaved,
  onDeleted,
  onCancel,
}: {
  initial: Challenge;
  isNew: boolean;
  activeStep: ChallengeStep;
  onStepChange: (s: ChallengeStep) => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const editor = useChallengeForm(initial);
  const stepIndex = STEP_ORDER.indexOf(activeStep);

  const save = () => {
    const saved = challengeStore.upsert(editor.normalized);
    onSaved(saved.id);
  };

  const remove = () => {
    if (!isNew) challengeStore.remove(editor.form.id);
    onDeleted();
  };

  const goPrev = () => {
    if (stepIndex > 0) onStepChange(STEP_ORDER[stepIndex - 1]);
  };
  const goNext = () => {
    if (stepIndex < STEP_ORDER.length - 1) onStepChange(STEP_ORDER[stepIndex + 1]);
  };

  return (
    <div className="pb-8">
      <Link
        to="/challenges"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Challenge Vault
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {isNew ? "Map a new challenge" : editor.form.title || "Untitled challenge"}
        </h1>
        {!isNew && editor.form.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{editor.form.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={CHALLENGE_STATUS_TONE[editor.form.status] ?? "muted"}>{editor.form.status}</Badge>
          <Badge tone={CHALLENGE_SEVERITY_TONE[editor.form.severity] ?? "muted"}>{editor.form.severity}</Badge>
          <Badge tone="muted">{editor.form.pillar}</Badge>
          {editor.form.owner && <Badge tone="muted">{editor.form.owner}</Badge>}
        </div>
      </div>

      <div className="mb-5 space-y-4">
        <ChallengeProgressStrip rcaPct={editor.rcaPct} actionPct={editor.actionPct} />
        <ChallengeStepNav active={activeStep} onChange={onStepChange} stepComplete={editor.stepComplete} />
      </div>

      <ChallengeFormSections
        activeStep={activeStep}
        form={editor.form}
        set={editor.set}
        setWhy={editor.setWhy}
        addSymptom={editor.addSymptom}
        updateSymptom={editor.updateSymptom}
        removeSymptom={editor.removeSymptom}
        addAction={editor.addAction}
        updateAction={editor.updateAction}
        removeAction={editor.removeAction}
      />

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={goPrev} disabled={stepIndex === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {stepIndex < STEP_ORDER.length - 1 ? (
          <Button type="button" variant="secondary" size="sm" onClick={goNext}>
            Next step <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <span />
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-base-2/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-between gap-3">
          {!isNew ? (
            <Button variant="danger" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          )}
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={onCancel}>Back to vault</Button>
            )}
            <Button onClick={save}>
              {isNew ? "Create challenge" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
