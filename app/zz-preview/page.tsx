"use client";

import { MatchCard } from "@/app/components/MatchCard";
import { LeagueSelector } from "@/app/components/LeagueSelector";
import type { OddsEvent } from "@/app/lib/odds";

const bm = (key: string, h: number, d: number, a: number) => ({
  key, title: key, last_update: "2026-09-25T10:00:00Z",
  markets: [{ key: "h2h", last_update: "2026-09-25T10:00:00Z", outcomes: [
    { name: "Arsenal", price: h }, { name: "Draw", price: d }, { name: "Chelsea", price: a }] }],
});
const event: OddsEvent = {
  id: "abc123", sport_key: "soccer_epl", sport_title: "EPL", commence_time: "2026-09-27T14:00:00Z",
  home_team: "Arsenal", away_team: "Chelsea",
  bookmakers: [bm("Bet365", 1.9, 3.6, 4.1), bm("Unibet", 1.95, 3.5, 4.0)],
};
export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <LeagueSelector value="soccer_epl" onChange={() => {}}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><li className="flex"><MatchCard event={event} /></li></ul>
      </LeagueSelector>
    </div>
  );
}
