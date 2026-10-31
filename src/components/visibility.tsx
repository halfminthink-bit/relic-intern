import { Eye, EyeOff, FileText, Globe, Lock } from "lucide-react";
import type { ThemeVisibility } from "@/types/db";
import { THEME_VISIBILITY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = { private: Lock, summary: FileText, public: Globe } as const;

export function ThemeVisibilityBadge({ visibility, className }: { visibility: ThemeVisibility; className?: string }) {
  const Icon = ICONS[visibility];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        visibility === "private" ? "text-muted-foreground" : "text-foreground/80",
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {THEME_VISIBILITY_META[visibility].label}
    </span>
  );
}

export function EntryVisibilityLabel({ isPublic, className }: { isPublic: boolean; className?: string }) {
  const Icon = isPublic ? Eye : EyeOff;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", isPublic ? "text-primary" : "text-muted-foreground", className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {isPublic ? "公開" : "非公開"}
    </span>
  );
}

/** 非公開／概要のみ公開／記録も公開 のセグメント切り替え */
export function ThemeVisibilitySelector({
  value,
  onChange,
  disabled,
}: {
  value: ThemeVisibility;
  onChange: (v: ThemeVisibility) => void;
  disabled?: boolean;
}) {
  const options: ThemeVisibility[] = ["private", "summary", "public"];
  return (
    <div role="radiogroup" aria-label="テーマの公開範囲" className="grid grid-cols-3 gap-1 rounded-lg border bg-secondary/60 p-1">
      {options.map((v) => {
        const Icon = ICONS[v];
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:flex-row sm:justify-center sm:text-sm",
              active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {THEME_VISIBILITY_META[v].label}
          </button>
        );
      })}
    </div>
  );
}
