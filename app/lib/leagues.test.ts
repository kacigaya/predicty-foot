import { expect, test } from "bun:test";
import { DEFAULT_LEAGUE_KEY, LEAGUES, isLeagueKey, leagueHref } from "./leagues";

test("isLeagueKey accepts configured leagues only", () => {
  for (const league of LEAGUES) expect(isLeagueKey(league.key)).toBe(true);
  expect(isLeagueKey(DEFAULT_LEAGUE_KEY)).toBe(true);
  expect(isLeagueKey("soccer_epl/../../sports")).toBe(false);
  expect(isLeagueKey("")).toBe(false);
});

test("leagueHref keeps the default league on the bare home URL", () => {
  expect(leagueHref(DEFAULT_LEAGUE_KEY)).toBe("/");
  expect(leagueHref("soccer_spain_la_liga")).toBe("/?league=soccer_spain_la_liga");
});
