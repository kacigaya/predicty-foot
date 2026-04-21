import { format } from "date-fns";
import { formatOdds, type OddsEvent } from "@/app/lib/odds";

export function OddsTable({ event }: { event: OddsEvent }) {
  if (event.bookmakers.length === 0) {
    return (
      <div className="border border-[#2a2a25] bg-[#0a0a09] p-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b7a70]">
        No bookmaker odds available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#2a2a25]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2a25] bg-[#1c1c19] font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            <th className="px-4 py-3 text-left font-normal">Bookmaker</th>
            <th className="px-4 py-3 text-right font-normal">1</th>
            <th className="px-4 py-3 text-right font-normal">X</th>
            <th className="px-4 py-3 text-right font-normal">2</th>
            <th className="px-4 py-3 text-right font-normal">Upd.</th>
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
                className="border-b border-[#2a2a25]/50 last:border-0 bg-[#0a0a09] hover:bg-[#131311] transition-colors"
              >
                <td className="px-4 py-3 font-display text-base italic text-[#f4efe2]">
                  {bm.title}
                </td>
                <td className={cellClass(home, best)}>{formatOdds(home)}</td>
                <td className={cellClass(draw, best)}>{formatOdds(draw)}</td>
                <td className={cellClass(away, best)}>{formatOdds(away)}</td>
                <td className="px-4 py-3 text-right font-mono text-[10px] text-[#4a4a44]">
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
  const base = "px-4 py-3 text-right font-mono tabular-nums";
  if (value != null && value === best && best > 0) {
    return `${base} text-[#d8ff3e] font-semibold`;
  }
  return `${base} text-[#f4efe2]`;
}
