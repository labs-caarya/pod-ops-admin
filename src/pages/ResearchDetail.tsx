import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Microscope } from "lucide-react";
import { ResearchEditorForm } from "@/components/research/ResearchEditorForm";
import { HiveAcronym } from "@/components/research/HiveAcronym";
import { EmptyState } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { archiveResearchProfile, createResearchProfile, updateResearchProfile } from "@/lib/api";
import { adminQueryKeys, researchProfilesQueryOptions } from "@/lib/adminQueries";
import { emptyResearch, normalizeResearch } from "@/lib/data/transforms";
import { HIVE_NAME } from "@/lib/copy/hive";
import type { ResearchProfile } from "@/lib/types";

export default function ResearchDetail() {
  const { researchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = researchId === "new";
  const researchQuery = useQuery(researchProfilesQueryOptions());
  const profile = isNew ? null : (researchQuery.data ?? []).find((item) => item.id === researchId);
  const saveMutation = useMutation({
    mutationFn: (input: ResearchProfile) => isNew ? createResearchProfile(input) : updateResearchProfile(input.id, input),
    onSuccess: async (saved) => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.researchProfiles }); navigate(`/research/${saved.id}`, { replace: true }); },
  });
  const archiveMutation = useMutation({
    mutationFn: () => archiveResearchProfile(profile?.id || ""),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.researchProfiles }); navigate("/research"); },
  });

  if (!isNew && !profile) {
    return (
      <EmptyState
        icon={Microscope}
        title="Profile not found"
        description="This research profile may have been removed."
        action={
          <Link to="/research">
            <Button>Back to {HIVE_NAME}</Button>
          </Link>
        }
      />
    );
  }

  const initial = normalizeResearch(profile ?? emptyResearch());

  return (
    <div>
      <Link
        to="/research"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {HIVE_NAME}
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-ink sm:text-3xl">
          {isNew ? "New profile" : initial.name || "Untitled profile"}
        </h1>
        {!isNew && initial.sector && (
          <p className="mt-1 text-sm text-ink-muted">{initial.sector} · {initial.city}</p>
        )}
        <HiveAcronym className="mt-2" />
      </div>

      <ResearchEditorForm
        initial={initial}
        isNew={isNew}
        onSave={(saved) => saveMutation.mutate(saved)}
        onCancel={() => navigate("/research")}
        onDelete={
          !isNew
            ? () => {
                archiveMutation.mutate();
              }
            : undefined
        }
      />
    </div>
  );
}
