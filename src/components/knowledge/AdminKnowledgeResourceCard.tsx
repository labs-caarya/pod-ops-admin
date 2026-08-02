import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { KnowledgeResource } from "@/lib/knowledgeSpace/types";

export function AdminKnowledgeResourceCard({
  resource,
  onEdit,
  onDelete,
}: {
  resource: KnowledgeResource;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={resource.type === "html" ? "good" : resource.type === "in-app" ? "ruby" : "info"}>{resource.type}</Badge>
          <Badge tone="muted">{resource.source || "resource"}</Badge>
        </div>
        {resource.canEdit || resource.canDelete ? (
          <div className="flex items-center gap-1">
            {resource.canEdit && onEdit ? <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-3 hover:text-ink" aria-label={`Edit ${resource.title}`}><Pencil className="h-4 w-4" /></button> : null}
            {resource.canDelete && onDelete ? <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-ink-muted hover:bg-bad/10 hover:text-bad" aria-label={`Archive ${resource.title}`}><Trash2 className="h-4 w-4" /></button> : null}
          </div>
        ) : null}
      </div>

      <div className="flex-1">
        <a href={resource.url} target={resource.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group inline-flex items-start gap-1.5 font-display text-sm font-bold text-ink hover:text-ruby-bright">
          {resource.title}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
        </a>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{resource.description}</p>
      </div>

      {resource.tags.length ? <div className="flex flex-wrap gap-1">{resource.tags.map((tag) => <Badge key={`${resource.id}-${tag}`} tone="muted">{tag}</Badge>)}</div> : null}

      <div className="border-t border-line pt-3 text-xs text-ink-muted">
        <p><span className="text-ink-faint">Curated by:</span> {resource.curatedByName}</p>
        {resource.createdByName ? <p className="mt-1"><span className="text-ink-faint">Created by:</span> {resource.createdByName}{resource.createdByRole ? ` · ${resource.createdByRole}` : ""}</p> : null}
        {resource.createdByCollegeName ? <p className="mt-1"><span className="text-ink-faint">College:</span> {resource.createdByCollegeName}</p> : null}
      </div>
    </article>
  );
}
