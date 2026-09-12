import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getLearnSection } from "@/lib/podActivation/activationLearning";
import { formatPodRole } from "@/lib/podRoles";
import type { KnowledgeResource } from "@/lib/knowledgeSpace/types";

function formatAudience(resource: KnowledgeResource) {
  const activation = resource.activation;
  if (!activation) return "Activation";
  if (activation.audienceType === "common") return "Common";
  return activation.roleIds.map(formatPodRole).join(", ") || "Role-based";
}

export function ActivationResourceCard({
  resource,
  positionLabel,
  onEdit,
  onArchive,
}: {
  resource: KnowledgeResource;
  positionLabel: string;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const activation = resource.activation;
  const section = getLearnSection(activation?.sectionKey);
  const isInline = activation?.contentMode === "inline-text";

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={activation?.published === false ? "muted" : "good"}>{activation?.published === false ? "Draft" : "Published"}</Badge>
            <Badge tone="ruby">Learn</Badge>
            <Badge tone={activation?.audienceType === "role" ? "amber" : "info"}>{formatAudience(resource)}</Badge>
            {activation?.required === false ? <Badge tone="muted">Optional</Badge> : <Badge tone="bad">Required</Badge>}
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink">{resource.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{resource.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" aria-label={"Edit " + resource.title} onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label={"Archive " + resource.title} onClick={onArchive}>
            <Trash2 className="h-4 w-4 text-bad" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-ink-muted sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface px-3 py-2">
          <span className="block text-ink-faint">Section</span>
          <span className="font-medium text-ink">{section?.title || activation?.sectionKey || "Unsectioned"}</span>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2">
          <span className="block text-ink-faint">Position</span>
          <span className="font-medium text-ink">{positionLabel}</span>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2">
          <span className="block text-ink-faint">Format</span>
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            {isInline ? <FileText className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
            {isInline ? "Simple text" : String((activation?.provider || "external") + " · " + (activation?.mediaType || "text"))}
          </span>
        </div>
      </div>

      {resource.tags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{resource.tags.map((tag) => <Badge key={resource.id + "-" + tag} tone="muted">{tag}</Badge>)}</div> : null}
    </article>
  );
}
