import { useEffect, useMemo, useRef, useState } from "react";
import { toDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 単色（プライマリのティール）の濃淡。0件は罫線色に近い淡色 */
const LEVELS = ["#ebe8e0", "#b9dcd5", "#7bbcb1", "#3a8f84", "#1f5f5b"];
const CELL = 11;
const GAP = 3;

function levelOf(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/**
 * GitHub の contribution グラフ相当の「草」。
 * timestamps: 記録の created_at の配列。weeks: 表示する週数。
 */
export function ContributionGraph({
  timestamps,
  weeks: mobileWeeks = 26,
  className,
}: {
  timestamps: string[];
  /** スマホでの表示週数（PC では 1 年分を表示） */
  weeks?: number;
  className?: string;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const weeks = wide ? 53 : mobileWeeks;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const { columns, months, total, streak, thisWeek } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of timestamps) {
      const k = toDateKey(new Date(t));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 最終列は今週（日曜始まり）
    const start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (weeks - 1) * 7);

    const columns: { date: Date; key: string; count: number; future: boolean }[][] = [];
    const months: { col: number; label: string }[] = [];
    let total = 0;
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = toDateKey(date);
        const count = counts.get(key) ?? 0;
        const future = date > today;
        if (!future) total += count;
        col.push({ date, key, count, future });
        if (date.getDate() === 1 || (w === 0 && d === 0)) {
          if (!months.some((m) => m.col === w)) months.push({ col: w, label: `${date.getMonth() + 1}月` });
        }
      }
      columns.push(col);
    }
    // 先頭の月ラベルが次とくっつく場合は省く
    if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();

    let streak = 0;
    const cur = new Date(today);
    if (!counts.get(toDateKey(cur))) cur.setDate(cur.getDate() - 1); // 今日まだ書いていなくても途切れ扱いにしない
    while (counts.get(toDateKey(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    const thisWeek = columns[columns.length - 1].reduce((s, c) => s + (c.future ? 0 : c.count), 0);
    return { columns, months, total, streak, thisWeek };
  }, [timestamps, weeks]);

  // スマホでは最新（右端）が見えるようにスクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [columns]);

  const width = weeks * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <div className={cn("space-y-3", className)}>
      <dl className="grid grid-cols-3 gap-2 text-center sm:max-w-md">
        <Stat label={weeks >= 52 ? "過去1年の記録" : `過去${Math.round(weeks / 4.3)}か月の記録`} value={total} unit="件" />
        <Stat label="連続記録" value={streak} unit="日" />
        <Stat label="今週" value={thisWeek} unit="件" />
      </dl>

      <div className="relative">
        <div className="flex gap-2">
          <div className="flex shrink-0 flex-col pt-[18px] text-[10px] leading-none text-muted-foreground" style={{ gap: GAP }} aria-hidden>
            {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
              <span key={d} style={{ height: CELL }} className={cn("flex items-center", i % 2 === 0 && "invisible")}>
                {d}
              </span>
            ))}
          </div>
          <div ref={scrollRef} className="min-w-0 overflow-x-auto pb-1 scrollbar-none">
            <div className="w-max">
              <div className="relative h-[14px] text-[10px] text-muted-foreground" style={{ width }} aria-hidden>
                {months.map((m) => (
                  <span key={m.col} className="absolute top-0" style={{ left: m.col * (CELL + GAP) }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <svg
                width={width}
                height={height}
                className="mt-1 block"
                role="img"
                aria-label={`記録の頻度。表示期間の合計 ${total} 件`}
                onMouseLeave={() => setHover(null)}
              >
                {columns.map((col, w) =>
                  col.map((c, d) =>
                    c.future ? null : (
                      <rect
                        key={c.key}
                        x={w * (CELL + GAP)}
                        y={d * (CELL + GAP)}
                        width={CELL}
                        height={CELL}
                        rx={2}
                        fill={LEVELS[levelOf(c.count)]}
                        onMouseEnter={(ev) => {
                          const r = (ev.target as SVGRectElement).getBoundingClientRect();
                          const host = scrollRef.current!.parentElement!.parentElement!.getBoundingClientRect();
                          setHover({
                            x: r.left - host.left + CELL / 2,
                            y: r.top - host.top,
                            label: `${c.date.getMonth() + 1}月${c.date.getDate()}日：${c.count === 0 ? "記録なし" : `${c.count}件`}`,
                          });
                        }}
                      >
                        <title>{`${c.date.getMonth() + 1}月${c.date.getDate()}日 ${c.count}件`}</title>
                      </rect>
                    ),
                  ),
                )}
              </svg>
            </div>
          </div>
        </div>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            {hover.label}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground" aria-hidden>
        少
        {LEVELS.map((c) => (
          <span key={c} className="inline-block rounded-[2px]" style={{ width: CELL, height: CELL, background: c }} />
        ))}
        多
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-md border bg-card px-2 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-medium tabular-nums">
        {value}
        <span className="ml-0.5 font-sans text-xs text-muted-foreground">{unit}</span>
      </dd>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
