import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * テーマ概要（README相当）の簡易レンダラ。
 * 「## 見出し」と「・箇条書き」だけを解釈する（Markdown ライブラリを入れずに済ませるため）。
 */
export function Readme({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      <h2 className="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold">
        <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
        概要
      </h2>
      <div className="space-y-3 p-4 text-[15px] leading-relaxed sm:p-5">
        {blocks.map((block, i) => {
          const lines = block.split("\n");
          return (
            <div key={i} className="space-y-1">
              {lines.map((line, j) => {
                if (line.startsWith("## "))
                  return (
                    <h3 key={j} className="border-b pb-1 pt-1 text-base font-semibold">
                      {line.slice(3)}
                    </h3>
                  );
                if (line.startsWith("・"))
                  return (
                    <p key={j} className="relative pl-4 before:absolute before:left-1 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground">
                      {line.slice(1)}
                    </p>
                  );
                return <p key={j}>{line}</p>;
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
