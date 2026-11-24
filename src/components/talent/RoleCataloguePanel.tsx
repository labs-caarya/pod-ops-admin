import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Tags, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import {
  listTalentRoleCatalogue,
  listTalentRoleSuggestions,
  reviewTalentRoleSuggestion,
  type TalentRoleSuggestion,
} from "@/lib/api";

const CATALOGUE_KEY = ["admin", "talent-role-catalogue"] as const;
const SUGGESTIONS_KEY = ["admin", "talent-role-suggestions"] as const;

export function RoleCataloguePanel() {
  const queryClient = useQueryClient();
  const catalogueQuery = useQuery({ queryKey: CATALOGUE_KEY, queryFn: listTalentRoleCatalogue });
  const suggestionsQuery = useQuery({ queryKey: SUGGESTIONS_KEY, queryFn: listTalentRoleSuggestions });
  const [search, setSearch] = useState("");
  const roles = catalogueQuery.data?.roles.filter((role) => role.status === "active") ?? [];
  const pending = suggestionsQuery.data?.filter((row) => row.status === "pending") ?? [];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => `${role.label} ${role.domainName} ${(role.aliases || []).join(" ")}`.toLowerCase().includes(query));
  }, [roles, search]);

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof reviewTalentRoleSuggestion>[1] }) => reviewTalentRoleSuggestion(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CATALOGUE_KEY }),
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: ["admin", "industry-applicants"] }),
      ]);
    },
  });

  if (catalogueQuery.isPending || suggestionsQuery.isPending) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-ruby-bright" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Role suggestions</h2>
            <p className="mt-1 text-sm text-ink-muted">Review applicant wording before it becomes a catalogue alias or a new role.</p>
          </div>
          <Badge tone={pending.length ? "amber" : "good"}>{pending.length} pending</Badge>
        </div>
        {pending.length ? (
          <div className="mt-4 space-y-3">
            {pending.map((suggestion) => (
              <SuggestionReview
                key={suggestion.id}
                suggestion={suggestion}
                roles={roles}
                domains={catalogueQuery.data?.domains ?? []}
                pending={mutation.isPending}
                onReview={(input) => mutation.mutate({ id: suggestion.id, input })}
              />
            ))}
          </div>
        ) : <p className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm text-ink-muted">No role suggestions need review.</p>}
        {mutation.isError ? <p className="mt-3 text-sm text-bad">{mutation.error instanceof Error ? mutation.error.message : "Could not review this suggestion."}</p> : null}
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Canonical catalogue</h2>
            <p className="mt-1 text-sm text-ink-muted">{roles.length} active roles grouped across the Ethos domains.</p>
          </div>
          <Input className="sm:w-72" placeholder="Search roles or domains…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((role) => (
            <div key={role.roleId} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="font-medium text-ink">{role.label}</p>
              <p className="mt-1 text-xs text-ink-faint">{role.domainName}</p>
              {role.aliases?.length ? <p className="mt-2 text-xs text-ink-muted">Aliases: {role.aliases.join(", ")}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SuggestionReview({ suggestion, roles, domains, pending, onReview }: {
  suggestion: TalentRoleSuggestion;
  roles: Awaited<ReturnType<typeof listTalentRoleCatalogue>>["roles"];
  domains: Awaited<ReturnType<typeof listTalentRoleCatalogue>>["domains"];
  pending: boolean;
  onReview: (input: Parameters<typeof reviewTalentRoleSuggestion>[1]) => void;
}) {
  const [mode, setMode] = useState<"map" | "create">("map");
  const [targetRoleId, setTargetRoleId] = useState(suggestion.closestRoleId || roles[0]?.roleId || "");
  const [label, setLabel] = useState(suggestion.rawLabel);
  const [domainId, setDomainId] = useState(domains[0]?.domainId || "");
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">“{suggestion.rawLabel}”</p>
          <p className="mt-1 text-xs text-ink-faint">Used by {suggestion.affectedCount} profile{suggestion.affectedCount === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-line p-1">
          <Button size="sm" variant={mode === "map" ? "primary" : "ghost"} onClick={() => setMode("map")}><Tags className="h-3.5 w-3.5" /> Map</Button>
          <Button size="sm" variant={mode === "create" ? "primary" : "ghost"} onClick={() => setMode("create")}><Plus className="h-3.5 w-3.5" /> New</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {mode === "map" ? (
          <Select value={targetRoleId} onChange={(event) => setTargetRoleId(event.target.value)} className="min-w-0 flex-1">
            {roles.map((role) => <option key={role.roleId} value={role.roleId}>{role.domainName} — {role.label}</option>)}
          </Select>
        ) : (
          <>
            <Input value={label} onChange={(event) => setLabel(event.target.value)} className="min-w-0 flex-1" />
            <Select value={domainId} onChange={(event) => setDomainId(event.target.value)} className="sm:w-64">
              {domains.map((domain) => <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>)}
            </Select>
          </>
        )}
        <Button disabled={pending || (mode === "map" ? !targetRoleId : !label.trim() || !domainId)} onClick={() => onReview(mode === "map" ? { action: "map", targetRoleId } : { action: "create", label, domainId })}>
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => onReview({ action: "reject" })}><X className="h-4 w-4" /> Reject</Button>
      </div>
    </div>
  );
}
