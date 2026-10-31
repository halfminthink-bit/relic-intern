import type { EntryType } from "@/types/db";
import { ENTRY_TYPES, ENTRY_TYPE_META } from "@/lib/constants";
import { ENTRY_TYPE_STYLE } from "@/components/entry-type";
import { cn } from "@/lib/utils";

/** タイムラインを種類で絞り込むチップ列 */
export function EntryTypeFilter({
  value,
  onChange,
  counts,
}: {
  value: EntryType | "all";
  onChange: (v: EntryType | "all") => void;
  counts: Record<EntryType | "all", number>;
}) {
  const items: (EntryType | "all")[] = ["all", ...ENTRY_TYPES];
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none" role="tablist" aria-label="記録の種類で絞り込み">
      {items.map((t) => {
        const active = value === t;
        const Icon = t === "all" ? null : ENTRY_TYPE_STYLE[t].icon;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active ? "border-foreground/70 bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className={cn("h-3.5 w-3.5", !active && ENTRY_TYPE_STYLE[t as EntryType].text)} aria-hidden />}
            {t === "all" ? "すべて" : ENTRY_TYPE_META[t].label}
            <span className="tabular-nums opacity-70">{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function countByType(entries: { type: EntryType }[]): Record<EntryType | "all", number> {
  const c = { all: entries.length, trouble: 0, memo: 0 };
  entries.forEach((e) => c[e.type]++);
  return c;
}
