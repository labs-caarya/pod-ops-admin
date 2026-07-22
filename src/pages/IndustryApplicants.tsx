import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { listIndustryApplicants, type Profile } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

function profileRoles(profile: Profile): string[] {
  return (profile.roles ?? [])
    .map((role) => (typeof role === "string" ? role : String(role)))
    .filter(Boolean);
}

function industryApplicantsQueryOptions() {
  return queryOptions<Profile[]>({
    queryKey: ["admin", "industry-applicants"],
    queryFn: listIndustryApplicants,
  });
}

export default function IndustryApplicants() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const applicantsQuery = useQuery(industryApplicantsQueryOptions());
  const applicants = applicantsQuery.data || [];
  const loading = applicantsQuery.isPending;
  const refreshing = !loading && applicantsQuery.isFetching;

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    applicants.forEach((profile) => profileRoles(profile).forEach((role) => roles.add(role)));
    return Array.from(roles).sort();
  }, [applicants]);

  const filtered = useMemo(() => {
    return applicants.filter((profile) => {
      if (roleFilter !== "all" && !profileRoles(profile).includes(roleFilter)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        profile.personal.fullName.toLowerCase().includes(q) ||
        profile.personal.email.toLowerCase().includes(q) ||
        profile.personal.headline.toLowerCase().includes(q) ||
        (profile.personal.collegeName || "").toLowerCase().includes(q) ||
        profileRoles(profile).some((role) => role.toLowerCase().includes(q))
      );
    });
  }, [applicants, roleFilter, search]);

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Industry applicants"
        description="Browse industry profile submissions with skills, tools, and work preferences across the network."
        icon={Briefcase}
        actions={
          <Button variant="secondary" onClick={() => void applicantsQuery.refetch()} disabled={loading || refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                placeholder="Search by name, headline, college, or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-48">
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <EmptyState
                icon={Briefcase}
                title={applicants.length === 0 ? "No industry applicants yet" : "No results found"}
                description={
                  applicants.length === 0
                    ? "Industry profile submissions will appear here once students apply."
                    : "Try adjusting your search or role filter."
                }
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-base">
                  <tr className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                    <th className="border-b border-line px-5 py-3 font-medium">Applicant</th>
                    <th className="border-b border-line px-5 py-3 font-medium">College</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Roles</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Status</th>
                    <th className="border-b border-line px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => (
                    <tr key={profile.id} className="align-top text-ink-muted">
                      <td className="border-b border-line px-5 py-4">
                        <p className="font-semibold text-ink">{profile.personal.fullName}</p>
                        <p className="mt-1 text-xs text-ink-faint">{profile.personal.email}</p>
                        {profile.personal.headline && (
                          <p className="mt-1 text-xs text-ink-muted">{profile.personal.headline}</p>
                        )}
                      </td>
                      <td className="border-b border-line px-5 py-4 text-ink">
                        {profile.personal.collegeName || "—"}
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {profileRoles(profile).slice(0, 3).map((role) => (
                            <Badge key={role} tone="muted" className="text-[10px]">
                              {role}
                            </Badge>
                          ))}
                          {profileRoles(profile).length > 3 && (
                            <span className="text-xs text-ink-faint">+{profileRoles(profile).length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-line px-5 py-4">
                        <Badge tone="muted">{profile.status || "Submitted"}</Badge>
                      </td>
                      <td className="border-b border-line px-5 py-4 text-ink-faint">
                        {formatDate(profile.submittedAt || profile.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {applicantsQuery.isError && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {applicantsQuery.error instanceof Error
            ? applicantsQuery.error.message
            : "Could not load industry applicants."}
        </p>
      )}
    </div>
  );
}
