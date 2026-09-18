import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { formatOdds, type OddsEvent } from "@/app/lib/odds";

export function OddsTable({ event }: { event: OddsEvent }) {
  if (event.bookmakers.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center font-mono text-xs uppercase text-muted-foreground">
        No bookmaker odds available.
      </p>
    );
  }

  // Best price per outcome across bookmakers; a bettor compares down a column.
  const rows = event.bookmakers.flatMap((bm) => {
    const h2h = bm.markets.find((m) => m.key === "h2h");
    if (!h2h) return [];
    const price = (name: string) => h2h.outcomes.find((o) => o.name === name)?.price;
    return [{ bm, home: price(event.home_team), draw: price("Draw"), away: price(event.away_team) }];
  });
  const best = {
    home: Math.max(0, ...rows.map((r) => r.home ?? 0)),
    draw: Math.max(0, ...rows.map((r) => r.draw ?? 0)),
    away: Math.max(0, ...rows.map((r) => r.away ?? 0)),
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Head-to-head odds by bookmaker</caption>
        <thead>
          <tr className="border-b border-border bg-muted/40 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-4 py-3 text-left font-normal">Bookmaker</th>
            <th scope="col" className="px-4 py-3 text-right font-normal"><abbr title="Home win" className="no-underline">1</abbr></th>
            <th scope="col" className="px-4 py-3 text-right font-normal"><abbr title="Draw" className="no-underline">X</abbr></th>
            <th scope="col" className="px-4 py-3 text-right font-normal"><abbr title="Away win" className="no-underline">2</abbr></th>
            <th scope="col" className="px-4 py-3 text-right font-normal">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ bm, home, draw, away }) => (
            <tr key={bm.key} className="border-b border-border/40 transition-colors hover:bg-muted/20 last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-normal text-foreground text-xs sm:text-sm">
                {bm.title}
              </th>
              <td className={cellClass(home, best.home)}>{formatOdds(home)}</td>
              <td className={cellClass(draw, best.draw)}>{formatOdds(draw)}</td>
              <td className={cellClass(away, best.away)}>{formatOdds(away)}</td>
              <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                <time dateTime={bm.last_update}>{format(new Date(bm.last_update), "HH:mm")}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClass(value: number | undefined, best: number): string {
  const isBest = value != null && value === best && best > 0;
  return cn(
    "px-4 py-3 text-right font-mono tabular-nums text-xs sm:text-sm",
    isBest ? "font-semibold text-foreground bg-muted/30" : "text-muted-foreground"
  );
}
