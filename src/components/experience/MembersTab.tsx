import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Coins, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { StatCard } from "@/components/ui/StatCard";
import { collegesQueryOptions } from "@/lib/adminQueries";
import { experienceDirectoryQuery } from "@/lib/experienceQueries";
import { formatPodRole } from "@/lib/podRoles";
import { formatDate } from "@/lib/utils";
import { MemberDrawer } from "./MemberDrawer";
import { QueryState, formatCredits, searchInputClass } from "./shared";

export function MembersTab() {
  const [search, setSearch] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [openUserId, setOpenUserId] = useState("");
  const colleges = useQuery(collegesQueryOptions()).data ?? [];
  const directory = useQuery(experienceDirectoryQuery(search.trim(), collegeId));
  const data = directory.data;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Pod members" value={data ? data.totals.members : "-"} icon={Users} tone="info" />
        <StatCard label="Credits held" value={data ? formatCredits(data.totals.credits) : "-"} icon={Coins} tone="amber" />
        <StatCard
          label="LoR eligible"
          value={data ? data.totals.lorEligible : "-"}
          hint={data ? `${formatCredits(data.lorThreshold)} credits needed` : undefined}
          icon={Award}
          tone="good"
        />
      </div>

      <Card className="mb-4 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              aria-label="Search members"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, pod or role"
              className={searchInputClass}
            />
          </div>
          <Select aria-label="Filter by pod" value={collegeId} onChange={(event) => setCollegeId(event.target.value)} className="sm:w-64">
            <option value="">All pods</option>
            {colleges
              .filter((college) => college.isPod)
              .map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
          </Select>
        </div>
      </Card>

      <QueryState isLoading={directory.isLoading} error={directory.error} onRetry={() => void directory.refetch()} label="Members" />

      {data && data.members.length === 0 ? (
        <EmptyState icon={Users} title="No pod members found" description="Try another search or pod." />
      ) : null}

      {data && data.members.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Pod</th>
                  <th className="px-4 py-3 text-right font-medium">Credits</th>
                  <th className="px-4 py-3 font-medium">Last earned</th>
                  <th className="px-4 py-3 font-medium">LoR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.members.map((member) => (
                  <tr
                    key={member.id}
                    tabIndex={0}
                    onClick={() => setOpenUserId(member.id)}
                    onKeyDown={(event) => event.key === "Enter" && setOpenUserId(member.id)}
                    className="focus-ring cursor-pointer transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{member.name}</p>
                      <p className="text-xs text-ink-faint">{formatPodRole(member.podRole)}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{member.collegeName}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-amber-bright">{formatCredits(member.balance)}</td>
                    <td className="px-4 py-3 text-ink-muted">{member.lastEarnedAt ? formatDate(member.lastEarnedAt) : "Never"}</td>
                    <td className="px-4 py-3">{member.lorEligible ? <Badge tone="good">Eligible</Badge> : <span className="text-ink-faint">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <MemberDrawer userId={openUserId} onClose={() => setOpenUserId("")} />
    </div>
  );
}
