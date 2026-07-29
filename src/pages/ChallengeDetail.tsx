import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Vault } from "lucide-react";
import { createChallenge, deleteChallenge, updateChallenge, type College } from "@/lib/api";
import { adminQueryKeys, challengesQueryOptions, collegesQueryOptions } from "@/lib/adminQueries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldRow, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { emptyWhys } from "@/lib/data/challenges";
import { CHALLENGE_SEVERITY_TONE, CHALLENGE_STATUS_TONE } from "@/lib/constants";
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

function emptyChallenge(college?: College): Challenge {
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
    collegeId: college?.id,
    collegeName: college?.name,
  };
}

export default function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const challengesQuery = useQuery(challengesQueryOptions());
  const collegesQuery = useQuery(collegesQueryOptions());
  const colleges = (collegesQuery.data || []).filter((college) => college.isPod);
  const isNew = challengeId === "new";
  const stored = isNew ? null : challengesQuery.data?.find((item) => item.id === challengeId);
  const [activeStep, setActiveStep] = useState<ChallengeStep>("map");

  if (challengesQuery.isPending || collegesQuery.isPending) {
    return <Card className="p-8 text-center text-sm text-ink-muted">Loading challenge…</Card>;
  }
  if (challengesQuery.isError || collegesQuery.isError) {
    const error = challengesQuery.error || collegesQuery.error;
    return <Card className="p-8 text-center text-sm text-bad">{error instanceof Error ? error.message : "Could not load challenge."}</Card>;
  }
  if (!isNew && !stored) {
    return (
      <EmptyState
        icon={Vault}
        title="Challenge not found"
        description="This challenge may have been archived."
        action={<Link to="/challenges"><Button>Back to Challenge Vault</Button></Link>}
      />
    );
  }

  const initial = stored ?? emptyChallenge(colleges[0]);
  return (
    <ChallengeDetailBody
      key={initial.id}
      initial={initial}
      colleges={colleges}
      isNew={isNew}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      onSaved={(id) => navigate(`/challenges/${id}`, { replace: true })}
      onDeleted={() => navigate("/challenges")}
      onCancel={() => navigate("/challenges")}
    />
  );
}

function ChallengeDetailBody({
  initial,
  colleges,
  isNew,
  activeStep,
  onStepChange,
  onSaved,
  onDeleted,
  onCancel,
}: {
  initial: Challenge;
  colleges: College[];
  isNew: boolean;
  activeStep: ChallengeStep;
  onStepChange: (step: ChallengeStep) => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const editor = useChallengeForm(initial);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const stepIndex = STEP_ORDER.indexOf(activeStep);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const selectedCollege = colleges.find((college) => college.id === editor.normalized.collegeId);
      const input = { ...editor.normalized, collegeName: selectedCollege?.name };
      const saved = isNew ? await createChallenge(input) : await updateChallenge(input);
      queryClient.setQueryData<Challenge[]>(adminQueryKeys.challenges, (current = []) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
      });
      onSaved(saved.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save challenge.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (isNew) return onDeleted();
    setSaving(true);
    try {
      await deleteChallenge(editor.form.id);
      queryClient.setQueryData<Challenge[]>(adminQueryKeys.challenges, (current = []) =>
        current.filter((item) => item.id !== editor.form.id),
      );
      onDeleted();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete challenge.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-8">
      <Link to="/challenges" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Challenge Vault
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {isNew ? "Map a new challenge" : editor.form.title || "Untitled challenge"}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {editor.form.collegeName ? <Badge tone="info">{editor.form.collegeName}</Badge> : null}
          <Badge tone={CHALLENGE_STATUS_TONE[editor.form.status] ?? "muted"}>{editor.form.status}</Badge>
          <Badge tone={CHALLENGE_SEVERITY_TONE[editor.form.severity] ?? "muted"}>{editor.form.severity}</Badge>
          <Badge tone="muted">{editor.form.pillar}</Badge>
        </div>
      </div>

      {isNew ? (
        <Card className="mb-4 p-4">
          <FieldRow label="College">
            <Select
              value={editor.form.collegeId || ""}
              onChange={(event) => {
                const college = colleges.find((item) => item.id === event.target.value);
                editor.set("collegeId")(event.target.value || undefined);
                editor.set("collegeName")(college?.name);
              }}
            >
              <option value="">All colleges</option>
              {colleges.map((college) => <option key={college.id} value={college.id}>{college.name} · {college.crew}</option>)}
            </Select>
          </FieldRow>
        </Card>
      ) : null}

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

      {message ? <p className="mt-4 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{message}</p> : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onStepChange(STEP_ORDER[stepIndex - 1])} disabled={stepIndex === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onStepChange(STEP_ORDER[stepIndex + 1])} disabled={stepIndex === STEP_ORDER.length - 1}>
          Next step <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-base-2/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-between gap-3">
          {!isNew ? <Button variant="danger" size="sm" onClick={() => void remove()} disabled={saving}><Trash2 className="h-4 w-4" /> Delete</Button> : <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
          <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : isNew ? "Create challenge" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}
