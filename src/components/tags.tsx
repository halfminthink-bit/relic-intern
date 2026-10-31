import { Link } from "react-router-dom";
import { tagGroupOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GROUP_STYLE = {
  material: "bg-accent text-accent-foreground border-transparent",
  method: "bg-card text-foreground/80 border-border",
  category: "bg-secondary text-muted-foreground border-transparent",
} as const;

export function TagChip({ tag, asLink = false, className }: { tag: string; asLink?: boolean; className?: string }) {
  const group = tagGroupOf(tag) ?? "method";
  const cls = cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", GROUP_STYLE[group], className);
  if (asLink) {
    return (
      <Link to={`/?tags=${encodeURIComponent(tag)}`} className={cn(cls, "hover:underline")}>
        {tag}
      </Link>
    );
  }
  return <span className={cls}>{tag}</span>;
}

export function TagList({ tags, asLink, className }: { tags: string[]; asLink?: boolean; className?: string }) {
  const order = ["material", "method", "category"];
  const sorted = [...tags].sort((a, b) => order.indexOf(tagGroupOf(a) ?? "") - order.indexOf(tagGroupOf(b) ?? ""));
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sorted.map((t) => (
        <TagChip key={t} tag={t} asLink={asLink} />
      ))}
    </div>
  );
}
