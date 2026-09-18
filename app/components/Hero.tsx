export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="max-w-3xl text-balance font-display text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
          Bookmaker odds and AI predictions for Europe&apos;s top leagues.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          Head-to-head odds averaged across bookmakers, with a Gemini reading of each fixture:
          likely score, win probabilities, and where the model disagrees with the market.
        </p>
      </div>
    </section>
  );
}
