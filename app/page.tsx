import { Hero } from "@/app/components/Hero";
import { MatchBoard } from "@/app/components/MatchBoard";
import { getFixtures } from "@/app/lib/fixtures";
import { DEFAULT_LEAGUE_KEY, isLeagueKey } from "@/app/lib/leagues";

type Props = {
  searchParams: Promise<{ league?: string | string[] }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { league: requested } = await searchParams;
  // Unknown or repeated ?league= values fall back to the default, never reach the provider.
  const league =
    typeof requested === "string" && isLeagueKey(requested) ? requested : DEFAULT_LEAGUE_KEY;
  const result = await getFixtures(league);

  return (
    <>
      <Hero />
      <MatchBoard league={league} result={result} />
    </>
  );
}
