import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, UserPlus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import type { TalentReferral } from "@/lib/experience";
import { reviewTalentReferral } from "@/lib/experienceApi";
import { experienceKeys, referralsQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";
import { InlineError, QueryState, errorMessage, formatDateTime } from "./shared";

const FILTERS = [
  { id: "submitted", label: "To review" },
  { id: "accepted", label: "Accepted" },
  { id: "selected", label: "Selected" },
  { id: "not_selected", label: "Not selected" },
] as const;

const STATUS_LABEL: Record<TalentReferral["status"], string> = {
  submitted: "To review",
  accepted: "Accepted",
  selected: "Selected",
  not_selected: "Not selected",
};

export function ReferralsTab({ openingCredits, programCredits }: { openingCredits?: number; programCredits?: number }) {
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("submitted");
  const [selected, setSelected] = useState<TalentReferral | null>(null);
  const referrals = useQuery(referralsQuery(status));
  const items = referrals.data ?? [];

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
        <p className="text-xs text-ink-faint">
          Accepting a referral to an opening issues {openingCredits ?? "the opening"} credits. Selecting a candidate into a program adds them to the
          talent roster and issues {programCredits ?? "the program"} credits.
        </p>
      </div>

      <QueryState isLoading={referrals.isLoading} error={referrals.error} onRetry={() => void referrals.refetch()} label="Referrals" />
      {!referrals.isLoading && !referrals.error && items.length === 0 ? (
        <EmptyState icon={UserPlus} title="No referrals here" description="Referrals pod members submit from My Caarya appear in this list." />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((referral) => (
          <Card key={referral.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-ink">{referral.candidateName}</h3>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {[referral.candidateSkill, referral.candidateCollege].filter(Boolean).join(" · ") || "No details added"}
                </p>
              </div>
              <Badge tone={referral.status === "selected" || referral.status === "accepted" ? "good" : referral.status === "not_selected" ? "muted" : "info"}>
                {STATUS_LABEL[referral.status]}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              <span className="font-medium text-ink">{referral.kind === "opening" ? "Existing opening" : "Program"}</span>
              {referral.targetTitle ? `: ${referral.targetTitle}` : ""}
            </p>
            <p className="mt-3 text-xs text-ink-muted">
              Referred by <span className="font-medium text-ink">{referral.referrerName}</span> ({formatPodRole(referral.podRole)}, {referral.collegeName}) on{" "}
              {formatDateTime(referral.createdAt)}
            </p>
            {referral.note ? <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{referral.note}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-ink-faint">
                {referral.creditsAwarded ? `${referral.creditsAwarded} credits issued` : referral.reviewedByName ? `Reviewed by ${referral.reviewedByName}` : ""}
              </span>
              {referral.status === "submitted" ? (
                <Button size="sm" onClick={() => setSelected(referral)}>
                  Review
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <ReferralDrawer referral={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ReferralDrawer({ referral, onClose }: { referral: TalentReferral | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "accepted" | "selected" | "not_selected") => reviewTalentReferral(referral!.id, decision, note.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      setNote("");
      onClose();
    },
  });

  return (
    <Drawer open={Boolean(referral)} onClose={onClose} title={referral?.candidateName ?? "Referral"} subtitle={referral ? `Referred by ${referral.referrerName}` : undefined}>
      {referral ? (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Skill", referral.candidateSkill],
              ["College", referral.candidateCollege],
              ["Email", referral.candidateEmail],
              ["Phone", referral.candidatePhone],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-surface-2 px-3 py-2">
                <dt className="text-xs text-ink-faint">{label}</dt>
                <dd className="mt-0.5 break-words text-ink">{value || "-"}</dd>
              </div>
            ))}
          </dl>
          {referral.note ? <p className="rounded-xl bg-surface-2 px-3 py-3 text-sm text-ink-muted">{referral.note}</p> : null}
          <FieldRow label="Note (optional)">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} />
          </FieldRow>
          <InlineError message={decide.isError ? errorMessage(decide.error) : undefined} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate("not_selected")}>
              <XCircle className="h-4 w-4" />
              Not selected
            </Button>
            <Button disabled={decide.isPending} onClick={() => decide.mutate(referral.kind === "opening" ? "accepted" : "selected")}>
              {decide.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {referral.kind === "opening" ? "Accept referral" : "Selected for program"}
            </Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
