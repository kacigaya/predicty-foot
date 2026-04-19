import { Hero } from "@/app/components/Hero";
import { MatchBoard } from "@/app/components/MatchBoard";
import { getOddsAction } from "@/app/actions/getOdds";
import { DEFAULT_LEAGUE_KEY } from "@/app/lib/leagues";

export const revalidate = 60;

export default async function HomePage() {
  const result = await getOddsAction(DEFAULT_LEAGUE_KEY);
  const initialEvents = result.ok ? result.events : [];
  const initialError = result.ok ? null : result.error;
  const initialFetchedAt = result.ok ? result.fetchedAt : new Date().toISOString();

  return (
    <>
      <Hero />
      <MatchBoard
        initialEvents={initialEvents}
        initialError={initialError}
        initialFetchedAt={initialFetchedAt}
      />
    </>
  );
}
