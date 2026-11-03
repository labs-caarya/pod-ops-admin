import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Textarea } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Misc";
import { issueExperienceCredit, revokeExperienceCredit } from "@/lib/experienceApi";
import { experienceKeys, experienceLedgerQuery, experienceMemberQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";
import { InlineError, QueryState, errorMessage, formatCredits, formatDateTime } from "./shared";

export function MemberDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const open = Boolean(userId);
  const overview = useQuery(experienceMemberQuery(userId));
  const ledger = useQuery({ ...experienceLedgerQuery({ userId, includeRevoked: true }), enabled: open });
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: experienceKeys.all });

  const issue = useMutation({
    mutationFn: issueExperienceCredit,
    onSuccess: async () => {
      setAmount("");
      setTitle("");
      setNote("");
      setFormError("");
      await refresh();
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => revokeExperienceCredit(id, reason),
    onSuccess: refresh,
  });

  function submit() {
    const value = Number.parseInt(amount, 10);
    if (!Number.isFinite(value) || value === 0) {
      setFormError("Enter a whole number of credits (negative to correct).");
      return;
    }
    if (!title.trim()) {
      setFormError("Say what the credits are for.");
      return;
    }
    setFormError("");
    issue.mutate({ userId, amount: value, title: title.trim(), note: note.trim() });
  }

  const data = overview.data;
  const canIssue = data?.capabilities?.canIssueCredits !== false;
  const canRevoke = data?.capabilities?.canRevokeCredits !== false;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={data?.member.name ?? "Member"}
      subtitle={data ? `${formatPodRole(data.member.podRole)} · ${data.member.collegeName}` : undefined}
      width="max-w-2xl"
    >
      <QueryState isLoading={overview.isLoading} error={overview.error} onRetry={() => void overview.refetch()} label="Member" />
      {data ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Experience Credits</p>
                <p className="font-display text-4xl font-black text-amber-bright">{formatCredits(data.balance)}</p>
              </div>
              <div className="text-right text-xs text-ink-muted">
                <p>{formatCredits(data.thisMonth)} this month</p>
                <p>
                  Update streak {data.streak.current} · longest {data.streak.longest}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={data.lor.percent} tone="amber" />
              <p className="mt-1.5 text-xs text-ink-muted">
                {data.lor.eligible
                  ? `LoR threshold reached (${formatCredits(data.lor.threshold)})`
                  : `${formatCredits(data.lor.remaining)} to go for an LoR (${formatCredits(data.lor.threshold)})`}
                {data.lor.request ? ` · request ${data.lor.request.status}` : ""}
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Where credits came from</h3>
            <div className="grid grid-cols-2 gap-2">
              {data.breakdown
                .filter((row) => row.total !== 0 || row.count > 0)
                .map((row) => (
                  <div key={row.source} className="rounded-xl border border-line bg-surface-2 px-3 py-2">
                    <p className="text-xs text-ink-muted">{row.label}</p>
                    <p className="font-display text-lg font-bold text-ink">{formatCredits(row.total)}</p>
                  </div>
                ))}
            </div>
          </section>

          {canIssue ? <section className="rounded-2xl border border-line p-4">
            <h3 className="mb-3 font-display text-sm font-bold text-ink">Issue or correct credits</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <FieldRow label="Credits">
                  <Input type="number" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 40" />
                </FieldRow>
                <FieldRow label="Reason" className="col-span-2">
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Hosted the onboarding call" maxLength={240} />
                </FieldRow>
              </div>
              <FieldRow label="Note (optional)">
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} />
              </FieldRow>
              <InlineError message={formError} />
              <div className="flex justify-end">
                <Button size="sm" onClick={submit} disabled={issue.isPending}>
                  {issue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Issue credits
                </Button>
              </div>
            </div>
          </section> : null}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Ledger</h3>
            <QueryState isLoading={ledger.isLoading} error={ledger.error} onRetry={() => void ledger.refetch()} label="Ledger" />
            {ledger.data?.items.length === 0 ? <p className="text-sm text-ink-muted">No credits yet.</p> : null}
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {ledger.data?.items.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className={entry.revoked ? "text-sm text-ink-faint line-through" : "text-sm font-medium text-ink"}>{entry.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {entry.sourceLabel} · {formatDateTime(entry.createdAt)}
                      {entry.issuedByName ? ` · by ${entry.issuedByName}` : ""}
                    </p>
                    {entry.revoked ? <p className="mt-0.5 text-xs text-bad">Revoked{entry.revokeReason ? `: ${entry.revokeReason}` : ""}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={entry.amount < 0 ? "bad" : entry.revoked ? "muted" : "amber"}>
                      {entry.amount > 0 ? "+" : ""}
                      {formatCredits(entry.amount)}
                    </Badge>
                    {!entry.revoked && canRevoke ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Revoke ${entry.title}`}
                        title="Revoke"
                        disabled={revoke.isPending}
                        onClick={() => {
                          const reason = window.prompt("Why are you revoking these credits?", "");
                          if (reason?.trim()) revoke.mutate({ id: entry.id, reason: reason.trim() });
                        }}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {revoke.isError ? <p className="mt-2 text-sm text-bad">{errorMessage(revoke.error)}</p> : null}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
