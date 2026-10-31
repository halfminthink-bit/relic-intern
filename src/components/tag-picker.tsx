import { TAG_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 材料・手法・区分のタグをまとめて選ぶ（研究室・テーマの作成時に一度だけ使う） */
export function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div className="space-y-3">
      {TAG_GROUPS.map((g) => (
        <fieldset key={g.key}>
          <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">{g.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((t) => {
              const active = value.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:bg-accent",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
