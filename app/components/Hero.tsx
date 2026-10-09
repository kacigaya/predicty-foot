// Kept short so the first row of fixtures, the actual product, shows above the fold.
export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-10 sm:px-6">
      <h1 className="text-balance font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
        European football odds and Gemini predictions
      </h1>
      <p className="mt-3 max-w-[68ch] text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        Head-to-head odds averaged across bookmakers. Gemini reads them and predicts the score,
        goals, scorers, corners and cards.
      </p>
    </section>
  );
}
