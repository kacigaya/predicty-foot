import { format } from "date-fns";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import type { AIPrediction } from "@/app/lib/gemini";
import { averageH2HOdds, impliedProbabilities, type OddsEvent } from "@/app/lib/odds";

// Shared rendering for a generated prediction, used by the fixture dialog and
// the match detail page. Callers own the fetch state and the regenerate action.
export function PredictionResult({
  prediction,
  event,
  compact = false,
}: {
  prediction: AIPrediction;
  event: OddsEvent;
  compact?: boolean;
}) {
  const implied = impliedProbabilities(averageH2HOdds(event));
  const confidenceTone = prediction.confidence >= 55 ? "default" : "warning";

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-accent pl-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={confidenceTone}>{prediction.confidence}% confidence</Badge>
        </div>
        <p className="font-mono text-xs uppercase text-muted">Predicted result</p>
        <p className={cn("mt-1 text-balance font-display text-foreground", compact ? "text-xl" : "text-2xl")}>
          {prediction.winner === "draw" ? "Draw" : `${prediction.winnerTeam} win`}
        </p>
        <p className={cn("mt-2 font-mono tabular-nums text-accent", compact ? "text-3xl" : "text-4xl")}>
          <span className="sr-only">{event.home_team} </span>
          {prediction.score.home}
          <span className="mx-2 text-dim" aria-hidden>–</span>
          <span className="sr-only">{event.away_team} </span>
          {prediction.score.away}
        </p>
      </div>

      <div>
        <p className="mb-3 font-mono text-xs uppercase text-muted">Probabilities: AI vs market</p>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
          <ProbCell label="Home" team={event.home_team} ai={prediction.aiProbabilities.home} market={implied.home} />
          <ProbCell label="Draw" team="Draw" ai={prediction.aiProbabilities.draw} market={implied.draw} />
          <ProbCell label="Away" team={event.away_team} ai={prediction.aiProbabilities.away} market={implied.away} />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase text-muted">Reasoning</p>
        <p className="text-pretty text-sm leading-relaxed text-foreground">{prediction.reasoning}</p>
      </div>

      {prediction.keyFactors.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-xs uppercase text-muted">Key factors</p>
          <ol className="divide-y divide-line border border-line">
            {prediction.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-3 p-4 text-sm text-foreground">
                <span className="font-mono text-xs tabular-nums text-accent" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-pretty leading-relaxed">{factor}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-sm border border-accent/40 bg-accent/5 p-4">
        <p className="mb-1 font-mono text-xs uppercase text-accent">Suggested bet</p>
        <p className="text-balance font-display text-xl text-foreground">
          {prediction.suggestedBet.market}: {prediction.suggestedBet.pick}
        </p>
        {prediction.suggestedBet.rationale && (
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
            {prediction.suggestedBet.rationale}
          </p>
        )}
      </div>

      <p className="font-mono text-xs uppercase tabular-nums text-muted">
        Generated at {format(new Date(prediction.generatedAt), "HH:mm:ss")}
      </p>
    </div>
  );
}

function ProbCell({
  label,
  team,
  ai,
  market,
}: {
  label: string;
  team: string;
  ai: number;
  market: number;
}) {
  const edge = ai - market;
  const edgeTone = edge > 0.03 ? "text-accent" : edge < -0.03 ? "text-destructive" : "text-muted";

  return (
    <div className="bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase text-foreground">{label}</span>
        <span className={cn("font-mono text-xs tabular-nums", edgeTone)}>
          <span className="sr-only">AI edge over market </span>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-muted" title={team}>
        {team}
      </p>
      <div className="mt-3 space-y-2">
        <ProbBar label="AI" value={ai} tone="accent" />
        <ProbBar label="Market" value={market} tone="muted" />
      </div>
    </div>
  );
}

function ProbBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 font-mono text-xs uppercase text-muted">{label}</span>
      {/* Native meter: no inline style attribute, which the CSP nonce would block. */}
      <meter
        aria-label={`${label} probability`}
        min={0}
        max={100}
        value={pct}
        className={cn("meter flex-1", tone === "muted" && "meter-muted")}
      >
        {pct.toFixed(0)}%
      </meter>
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
