import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="7" fill="hsl(var(--primary))" />
        <path d="M9 23V9m0 14h14M13 19l4-5 3 3 4-6" stroke="hsl(var(--primary-foreground))" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[17px]">
        Lab<span className="text-primary">Trail</span>
      </span>
    </Link>
  );
}
