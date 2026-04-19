import { format } from "date-fns";
import { formatOdds, type OddsEvent } from "@/app/lib/odds";

export function OddsTable({ event }: { event: OddsEvent }) {
  if (event.bookmakers.length === 0) {
    return (
      <div className="rounded-lg border border-[#252d3a] bg-[#0e1117] p-6 text-center text-sm text-[#7c8494]">
        No bookmaker odds available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#252d3a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#252d3a] bg-[#1e2430] text-[11px] uppercase tracking-wider text-[#4a5060]">
            <th className="px-4 py-2.5 text-left font-medium">Bookmaker</th>
            <th className="px-4 py-2.5 text-right font-medium">1 (Home)</th>
            <th className="px-4 py-2.5 text-right font-medium">X (Draw)</th>
            <th className="px-4 py-2.5 text-right font-medium">2 (Away)</th>
            <th className="px-4 py-2.5 text-right font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {event.bookmakers.map((bm) => {
            const h2h = bm.markets.find((m) => m.key === "h2h");
            if (!h2h) return null;
            const home = h2h.outcomes.find((o) => o.name === event.home_team)?.price;
            const away = h2h.outcomes.find((o) => o.name === event.away_team)?.price;
            const draw = h2h.outcomes.find((o) => o.name === "Draw")?.price;

            const best = Math.max(home ?? 0, draw ?? 0, away ?? 0);

            return (
              <tr
                key={bm.key}
                className="border-b border-[#252d3a]/50 last:border-0 bg-[#0e1117] hover:bg-[#161b22]"
              >
                <td className="px-4 py-2.5 font-medium text-[#e4e8ee]">{bm.title}</td>
                <td className={cellClass(home, best)}>{formatOdds(home)}</td>
                <td className={cellClass(draw, best)}>{formatOdds(draw)}</td>
                <td className={cellClass(away, best)}>{formatOdds(away)}</td>
                <td className="px-4 py-2.5 text-right text-[11px] text-[#4a5060]">
                  {format(new Date(bm.last_update), "HH:mm")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function cellClass(value: number | undefined, best: number): string {
  const base = "px-4 py-2.5 text-right tabular-nums";
  if (value != null && value === best && best > 0) {
    return `${base} text-amber-400 font-semibold`;
  }
  return `${base} text-[#e4e8ee]`;
}
