import { useInfiniteQuery } from "@tanstack/react-query";
import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { listCommunityUpdates, type CommunityUpdate } from "@/lib/api";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function CommunityUpdateCard({ update }: { update: CommunityUpdate }) {
  return (
    <article className="border-b border-line/70 pb-5 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm">
        <span className="font-semibold text-ink">{update.authorName}</span>
        <span className="text-ink-faint">@{update.authorHandle}</span>
        <span className="text-ink-faint" aria-hidden>·</span>
        <time className="text-ink-faint" dateTime={update.publishedAt}>{relativeTime(update.publishedAt)}</time>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{update.collegeName}{update.podRole ? ` · ${update.podRole}` : ""}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{update.title}</p>
      {update.hashtags.length ? <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-ruby-bright">{update.hashtags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
    </article>
  );
}

export default function CommunityNews() {
  const news = useInfiniteQuery({
    queryKey: ["admin", "community-news"],
    queryFn: ({ pageParam }) => listCommunityUpdates({ limit: 20, cursor: pageParam || undefined }),
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
  const updates = news.data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        icon={Newspaper}
        title="Community news"
        description="A live, read-only view of wins, learnings, and asks shared by pod leaders across the network."
        actions={<Button type="button" size="icon" variant="ghost" aria-label="Refresh community news" onClick={() => void news.refetch()} disabled={news.isFetching}><RefreshCw className={news.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button>}
      />
      <Card className="p-4 sm:p-5">
        {news.isLoading ? <p className="text-sm text-ink-muted">Loading community updates…</p> : null}
        {news.error ? <p className="text-sm text-ruby-bright">{news.error instanceof Error ? news.error.message : "Could not load community updates."}</p> : null}
        {!news.isLoading && !news.error && updates.length === 0 ? <p className="text-sm text-ink-muted">No community updates have been published yet.</p> : null}
        {updates.length ? <div className="space-y-5">{updates.map((update) => <CommunityUpdateCard key={update.id} update={update} />)}</div> : null}
        {news.hasNextPage ? <Button type="button" variant="secondary" className="mt-5" onClick={() => void news.fetchNextPage()} disabled={news.isFetchingNextPage}>{news.isFetchingNextPage ? "Loading…" : "Load more"}</Button> : null}
      </Card>
    </div>
  );
}
