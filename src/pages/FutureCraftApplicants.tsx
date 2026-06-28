import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, GraduationCap, Loader2, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { futureCraftApplicantsQueryOptions } from "@/lib/adminQueries";
import { cn, formatDate } from "@/lib/utils";

export default function FutureCraftApplicants() {
  const [yearFilter, setYearFilter] = useState("all");
  const [podFilter, setPodFilter] = useState("all");
  const applicantsQuery = useQuery(futureCraftApplicantsQueryOptions());
  const applicants = applicantsQuery.data || [];
  const loading = applicantsQuery.isPending;
  const refreshing = !loading && applicantsQuery.isFetching;

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(applicants.map((applicant) => applicant.year).filter(Boolean))).sort((left, right) => {
        const leftNumber = Number.parseInt(left, 10);
        const rightNumber = Number.parseInt(right, 10);
        if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && leftNumber !== rightNumber) {
          return leftNumber - rightNumber;
        }
        return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      }),
    [applicants],
  );

  const podOptions = useMemo(() => {
    const options = new Map<string, string>();

    applicants.forEach((applicant) => {
      if (!applicant.hasMatchingPod) return;
      const value = applicant.matchingPodCollegeName || applicant.college;
      const label = applicant.matchingPodName || applicant.matchingPodCollegeName || applicant.college;
      if (value) {
        options.set(value, label);
      }
    });

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
  }, [applicants]);

  const filteredApplicants = useMemo(
    () =>
      applicants.filter((applicant) => {
        if (yearFilter !== "all" && applicant.year !== yearFilter) return false;
        if (podFilter === "all") return true;
        if (podFilter === "__unmatched__") return !applicant.hasMatchingPod;
        return applicant.hasMatchingPod && (applicant.matchingPodCollegeName || applicant.college) === podFilter;
      }),
    [applicants, podFilter, yearFilter],
  );

  const hasActiveFilters = yearFilter !== "all" || podFilter !== "all";
  const message = applicantsQuery.error instanceof Error ? applicantsQuery.error.message : "Could not load Future Craft applicants.";

  function clearFilters() {
    setYearFilter("all");
    setPodFilter("all");
  }

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Future Craft Applicants"
        description="Review every application submitted through Future Craft and quickly see which colleges already have a pod."
        icon={GraduationCap}
        actions={
          <Button variant="secondary" onClick={() => void applicantsQuery.refetch()} disabled={loading || refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">Application inbox</p>
              <p className="text-sm text-ink-muted">
                {filteredApplicants.length} application{filteredApplicants.length === 1 ? "" : "s"}
                {hasActiveFilters ? ` shown of ${applicants.length}` : ""} across matched and unmatched colleges
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <FilterSelect className="w-full sm:w-44">
              <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full pr-10">
                <option value="all">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </FilterSelect>
            <FilterSelect className="w-full sm:w-56">
              <Select value={podFilter} onChange={(e) => setPodFilter(e.target.value)} className="w-full pr-10">
                <option value="all">All pods</option>
                {podOptions.map((pod) => (
                  <option key={pod.value} value={pod.value}>
                    {pod.label}
                  </option>
                ))}
                <option value="__unmatched__">No pod match</option>
              </Select>
            </FilterSelect>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : filteredApplicants.length ? (
            <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {filteredApplicants.map((applicant) => (
                <div key={applicant.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{applicant.name}</p>
                        <Badge tone={applicant.hasMatchingPod ? "good" : "muted"}>
                          {applicant.hasMatchingPod ? "Pod exists" : "No pod match"}
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-muted">{applicant.email}</p>
                      <p className="text-sm text-ink">{applicant.college}</p>
                      <p className="text-sm text-ink-faint">
                        Year {applicant.year} · Applied {formatDate(applicant.createdAt)}
                      </p>
                      {applicant.hasMatchingPod && (
                        <p className="text-sm text-ink-faint">
                          Matched pod: {applicant.matchingPodName || applicant.matchingPodCollegeName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-ink-muted">
              {applicants.length
                ? "No applicants match the selected year or pod filters."
                : "No Future Craft applications have been submitted yet."}
            </div>
          )}
        </div>
      </Card>

      {applicantsQuery.isError && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            "border-bad/30 bg-bad/10 text-bad",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function FilterSelect({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
    </div>
  );
}
