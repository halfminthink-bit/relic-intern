import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import type { Attachment } from "@/types/db";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/image";
import { cn } from "@/lib/utils";

/** 記録の添付: 画像はサムネイル、ファイル・外部リンクは行で表示 */
export function AttachmentList({ attachments, className }: { attachments: Attachment[]; className?: string }) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  const images = attachments.filter((a) => a.kind === "image");
  const others = attachments.filter((a) => a.kind !== "image");
  if (attachments.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPreview(a)}
              className="group relative overflow-hidden rounded-md border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={a.name}
            >
              <img
                src={a.thumbnail_url ?? a.url}
                alt={a.name}
                loading="lazy"
                decoding="async"
                className="h-20 w-28 object-cover transition-opacity group-hover:opacity-90 sm:h-24 sm:w-36"
              />
            </button>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <ul className="space-y-1">
          {others.map((a, i) => {
            const Icon = a.kind === "link" ? ExternalLink : FileText;
            return (
              <li key={i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-secondary/50 px-2 py-1 text-xs text-foreground/80 hover:bg-secondary"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{a.name}</span>
                  {a.size != null && <span className="shrink-0 text-muted-foreground">{formatBytes(a.size)}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="pr-6 text-base">{preview?.name}</DialogTitle>
          <DialogDescription className="sr-only">添付画像の拡大表示</DialogDescription>
          {preview && <img src={preview.url} alt={preview.name} className="max-h-[70dvh] w-full rounded-md bg-muted object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
