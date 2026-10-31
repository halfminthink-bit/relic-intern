import { CircleHelp, NotebookPen, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import type { EntryType } from "@/types/db";
import { ENTRY_TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const ENTRY_TYPE_STYLE: Record<EntryType, { icon: LucideIcon; text: string; bg: string; ring: string; solid: string }> = {
  progress: { icon: TrendingUp, text: "text-progress", bg: "bg-progress-soft", ring: "border-progress/40", solid: "bg-progress" },
  trouble: { icon: CircleHelp, text: "text-trouble", bg: "bg-trouble-soft", ring: "border-trouble/40", solid: "bg-trouble" },
  achievement: { icon: Trophy, text: "text-achievement", bg: "bg-achievement-soft", ring: "border-achievement/40", solid: "bg-achievement" },
  memo: { icon: NotebookPen, text: "text-memo", bg: "bg-memo-soft", ring: "border-memo/40", solid: "bg-memo" },
};

export function EntryTypeBadge({ type, className }: { type: EntryType; className?: string }) {
  const s = ENTRY_TYPE_STYLE[type];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", s.bg, s.text, s.ring, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {ENTRY_TYPE_META[type].label}
    </span>
  );
}

/** タイムラインの軸上に置く丸アイコン */
export function EntryTypeDot({ type, className }: { type: EntryType; className?: string }) {
  const s = ENTRY_TYPE_STYLE[type];
  const Icon = s.icon;
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-card", s.text, s.ring, className)}>
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only">{ENTRY_TYPE_META[type].label}</span>
    </span>
  );
}
