import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Entry, Member } from "@/types/db";
import { EntryTypeBadge, EntryTypeDot } from "@/components/entry-type";
import { AttachmentList } from "@/components/attachments";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineEntry = Entry & { author: Member };

/** 日付ごとに区切った、GitHub のコミット履歴風のタイムライン */
export function EntryTimeline<T extends TimelineEntry>({
  entries,
  renderActions,
  renderMeta,
  pageSize = 20,
}: {
  entries: T[];
  renderActions?: (e: T) => ReactNode;
  renderMeta?: (e: T) => ReactNode;
  /** 一度に表示する件数（「さらに表示」で追加） */
  pageSize?: number;
}) {
  const [limit, setLimit] = useState(pageSize);
  useEffect(() => setLimit(pageSize), [entries.length, pageSize]);
  const groups = groupByMonth(entries.slice(0, limit));
  const rest = entries.length - limit;
  return (
    <div className="space-y-6">
      {groups.map(([month, items]) => (
        <section key={month}>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full border-2 border-muted-foreground/50" aria-hidden />
            {month}
          </h3>
          <ol className="relative space-y-3 sm:ml-4 sm:border-l sm:border-border">
            {items.map((e) => (
              <li key={e.id} className="relative sm:pl-8">
                <EntryTypeDot type={e.type} className="absolute -left-4 top-3 hidden sm:flex" />
                <EntryCard entry={e} actions={renderActions?.(e)} meta={renderMeta?.(e)} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {rest > 0 && (
        <Button variant="outline" className="w-full" onClick={() => setLimit((l) => l + pageSize)}>
          <ChevronDown />
          さらに表示（残り {rest} 件）
        </Button>
      )}
    </div>
  );
}

export function EntryCard({
  entry,
  actions,
  meta,
  className,
}: {
  entry: TimelineEntry;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <article id={`entry-${entry.id}`} className={cn("rounded-lg border bg-card p-4 scroll-mt-24 transition-shadow", entry.type === "trouble" && "border-l-4 border-l-trouble/60", className)}>
      <header className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {entry.type === "trouble" && <EntryTypeBadge type={entry.type} />}
        <span className="font-medium text-foreground/80">{entry.author.grade}</span>
        <time dateTime={entry.created_at} title={formatDateTime(entry.created_at)}>
          {timeAgo(entry.created_at)}
        </time>
        {meta && <span className="ml-auto flex items-center">{meta}</span>}
      </header>
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{entry.body}</p>
      <AttachmentList attachments={entry.attachments} className="mt-3" />
      {actions && <footer className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">{actions}</footer>}
    </article>
  );
}

function groupByMonth<T extends TimelineEntry>(entries: T[]): [string, T[]][] {
  const fmt = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" });
  const map = new Map<string, T[]>();
  for (const e of entries) {
    const key = fmt.format(new Date(e.created_at));
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return [...map.entries()];
}
