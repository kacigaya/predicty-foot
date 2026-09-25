import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
      <div className="flex flex-col items-start gap-3">
        <Badge variant="outline">
          Multi-bookmaker odds · Gemini AI predictions
        </Badge>
        <h1 className="max-w-[22ch] text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Bookmaker odds and AI predictions for European football.
        </h1>
        <p className="mt-1 max-w-[52ch] text-pretty text-lg leading-relaxed text-muted-foreground">
          Head-to-head odds averaged across major bookmakers with Gemini AI match readings:
          projected scorelines, win probabilities, and market edge analysis.
        </p>
      </div>
    </section>
  );
}
