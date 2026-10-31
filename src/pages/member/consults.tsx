import { Link } from "react-router-dom";
import { Inbox, Mail, Quote } from "lucide-react";
import { listConsultRequestsForOwner } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EntryTypeBadge } from "@/components/entry-type";
import { EmptyState, LoadingState } from "@/components/states";

export default function ConsultsPage() {
  const { member } = useAuth();
  const { data, loading } = useAsync(() => listConsultRequestsForOwner(member!.id), [member!.id]);

  return (
    <div className="container max-w-3xl py-5 sm:py-8">
      <h1 className="text-xl font-bold">相談</h1>
      <p className="mt-1 text-sm text-muted-foreground">あなたのテーマに研究室の外から届いた相談・アドバイスです。</p>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : data!.length === 0 ? (
          <EmptyState icon={<Inbox />} title="まだ相談は届いていません">
            困りごとを「公開」で記録すると、同じ分野の研究者からアドバイスが届きやすくなります。
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {data!.map((c) => (
              <li key={c.id} className="rounded-lg border bg-card">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b px-4 py-3">
                  <span className="font-semibold">{c.from_name}</span>
                  <span className="text-sm text-muted-foreground">{c.from_affiliation}</span>
                  <time className="ml-auto text-xs text-muted-foreground" dateTime={c.created_at} title={formatDateTime(c.created_at)}>
                    {timeAgo(c.created_at)}
                  </time>
                </div>
                <div className="space-y-3 p-4">
                  <Link to={`/app/themes/${c.theme.id}`} className="block text-xs text-primary hover:underline">
                    {c.theme.title}
                  </Link>
                  {c.entry && (
                    <div className="flex gap-2 rounded-md bg-secondary/60 p-3 text-sm">
                      <Quote className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <EntryTypeBadge type={c.entry.type} className="mb-1" />
                        <p className="line-clamp-2 text-muted-foreground">{c.entry.body}</p>
                      </div>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{c.message}</p>
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${c.from_email}?subject=${encodeURIComponent(`Re: ${c.theme.title} についてのご相談`)}`}>
                      <Mail />
                      メールで返信
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
