import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Field";
import { RULE_FIELDS, type ExperienceRules } from "@/lib/experience";
import { saveExperienceRules } from "@/lib/experienceApi";
import { activationBudgetQuery, experienceKeys, experienceRulesQuery } from "@/lib/experienceQueries";
import { InlineError, QueryState, errorMessage } from "./shared";

const GROUPS = ["Updates", "Work", "Research", "Referrals", "Internal events", "Activation", "Letter of Recommendation"] as const;

function ActivationBudgetPanel() {
  const budget = useQuery(activationBudgetQuery());
  const roles = budget.data?.roles ?? [];
  if (!roles.length) return null;
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-base font-bold text-ink">How the activation pool splits</h2>
      <p className="mb-4 mt-1 text-xs text-ink-faint">
        Each member earns up to {budget.data?.pool} credits from their role&apos;s assessments plus its pod setup tasks. Published assessments keep their own credits; what is left is
        shared between the setup tasks. Adjust the credits on an assessment if a role is over budget.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-ink-faint">
            <tr>
              <th className="py-1.5 pr-3 font-medium">Role</th>
              <th className="py-1.5 pr-3 font-medium">Assessments</th>
              <th className="py-1.5 pr-3 font-medium">Setup tasks</th>
              <th className="py-1.5 pr-3 font-medium">Per task</th>
              <th className="py-1.5 font-medium">Unallocated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roles.map((role) => (
              <tr key={role.roleId}>
                <td className="py-2 pr-3 text-ink">{role.roleLabel}</td>
                <td className="py-2 pr-3 text-ink-muted">{role.assessmentCredits}</td>
                <td className="py-2 pr-3 text-ink-muted">{role.taskCount}</td>
                <td className="py-2 pr-3 text-ink-muted">{role.taskCount ? role.perTask : "-"}</td>
                <td className={role.overBudget ? "py-2 text-bad" : "py-2 text-ink-muted"}>
                  {role.overBudget ? `Over by ${Math.abs(role.unallocated)}` : role.unallocated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function RulesTab() {
  const queryClient = useQueryClient();
  const rules = useQuery(experienceRulesQuery());
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!rules.data) return;
    setDraft(Object.fromEntries(Object.entries(rules.data).map(([key, value]) => [key, String(value)])));
  }, [rules.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload: Partial<ExperienceRules> = {};
      for (const field of RULE_FIELDS) {
        const value = Number.parseInt(draft[field.key] ?? "", 10);
        if (Number.isFinite(value)) payload[field.key] = value;
      }
      return saveExperienceRules(payload);
    },
    onSuccess: async () => {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: experienceKeys.all });
    },
  });

  const dirty = Boolean(rules.data) && RULE_FIELDS.some((field) => String(rules.data?.[field.key]) !== draft[field.key]);

  return (
    <div className="max-w-3xl">
      <p className="mb-5 text-sm text-ink-muted">
        These rules decide how many Experience Credits members earn automatically. Changes apply to future activity; credits already issued are not
        recalculated. You can override credits on individual work items and events.
      </p>
      <QueryState isLoading={rules.isLoading} error={rules.error} onRetry={() => void rules.refetch()} label="Rules" />
      {rules.data ? (
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <Card key={group} className="p-4 sm:p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink">{group}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {RULE_FIELDS.filter((field) => field.group === group).map((field) => (
                  <FieldRow key={field.key} label={field.label}>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={draft[field.key] ?? ""}
                      onChange={(event) => {
                        setSaved(false);
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }));
                      }}
                    />
                    <span className="mt-1 block text-[11px] leading-relaxed text-ink-faint">{field.hint}</span>
                  </FieldRow>
                ))}
              </div>
            </Card>
          ))}
          <ActivationBudgetPanel />
          <InlineError message={save.isError ? errorMessage(save.error) : undefined} />
          <div className="flex items-center justify-end gap-3">
            {saved && !dirty ? <span className="text-sm text-good">Rules saved.</span> : null}
            <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save rules
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
