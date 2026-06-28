import { useEffect, useState } from "react";
import { GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listFutureCraftApplicants, type FutureCraftApplicant } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

export default function FutureCraftApplicants() {
  const [applicants, setApplicants] = useState<FutureCraftApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; tone: "bad" | "info" } | null>(null);

  async function loadApplicants() {
    setLoading(true);
    try {
      const data = await listFutureCraftApplicants();
      setApplicants(data);
      setMessage(null);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not load Future Craft applicants.",
        tone: "bad",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplicants();
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Future Craft Applicants"
        description="Review every application submitted through Future Craft and quickly see which colleges already have a pod."
        icon={GraduationCap}
        actions={
          <Button variant="secondary" onClick={() => void loadApplicants()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                {applicants.length} application{applicants.length === 1 ? "" : "s"} across matched and unmatched colleges
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ruby-bright" />
            </div>
          ) : applicants.length ? (
            <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {applicants.map((applicant) => (
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
              No Future Craft applications have been submitted yet.
            </div>
          )}
        </div>
      </Card>

      {message && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            message.tone === "bad" && "border-bad/30 bg-bad/10 text-bad",
            message.tone === "info" && "border-line bg-surface-2 text-ink-muted",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
