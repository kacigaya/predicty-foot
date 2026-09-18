import { Badge } from "@/app/components/ui/badge";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col items-start gap-4">
          <Badge variant="secondary">
            Multi-bookmaker odds · Gemini AI predictions
          </Badge>
          <h1 className="max-w-3xl text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Bookmaker odds and AI predictions for European football.
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Head-to-head odds averaged across major bookmakers with Gemini AI match readings:
            projected scorelines, win probabilities, and market edge analysis.
          </p>
        </div>
      </div>
    </section>
  );
}
