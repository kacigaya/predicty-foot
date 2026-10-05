import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AIPrediction, ProbPair, Scorer } from "@/app/lib/gemini";
import {
  averageH2HOdds,
  CARDS_LINE,
  CORNERS_LINE,
  formatOdds,
  GOALS_LINE,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

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
  const confidenceTone = prediction.confidence >= 55 ? "success" : "warning";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/20 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={confidenceTone}>{prediction.confidence}% confidence</Badge>
          <Badge variant="outline">Gemini Reading</Badge>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Predicted result
        </p>
        <p
          className={cn(
            "mt-1 text-balance font-heading font-bold text-foreground",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          {prediction.winner === "draw" ? "Draw" : `${prediction.winnerTeam} win`}
        </p>
        <p
          className={cn(
            "mt-2 font-mono tabular-nums font-bold text-foreground",
            compact ? "text-3xl" : "text-4xl",
          )}
        >
          <span className="sr-only">{event.home_team} </span>
          {prediction.score.home}
          <span className="mx-2 text-muted-foreground" aria-hidden>–</span>
          <span className="sr-only">{event.away_team} </span>
          {prediction.score.away}
        </p>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Probabilities: AI vs market
        </p>
        <div className="grid gap-px rounded-xl border border-border bg-border sm:grid-cols-3 overflow-hidden">
          <ProbCell
            label="Home"
            team={event.home_team}
            ai={prediction.aiProbabilities.home}
            market={implied.home}
          />
          <ProbCell
            label="Draw"
            team="Draw"
            ai={prediction.aiProbabilities.draw}
            market={implied.draw}
          />
          <ProbCell
            label="Away"
            team={event.away_team}
            ai={prediction.aiProbabilities.away}
            market={implied.away}
          />
        </div>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Half-time
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
            <span className="sr-only">{event.home_team} </span>
            {prediction.halfTime.score.home}
            <span className="mx-2 text-muted-foreground" aria-hidden>–</span>
            <span className="sr-only">{event.away_team} </span>
            {prediction.halfTime.score.away}
          </p>
          <dl className="flex gap-5 font-mono text-xs tabular-nums">
            <Stat label="Home" value={percent(prediction.halfTime.probabilities.home)} />
            <Stat label="Draw" value={percent(prediction.halfTime.probabilities.draw)} />
            <Stat label="Away" value={percent(prediction.halfTime.probabilities.away)} />
          </dl>
        </div>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Goals
        </p>
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          <MarketCell label={`Over ${GOALS_LINE} goals`} pair={prediction.goals.over25} />
          <MarketCell label="Both teams score" pair={prediction.goals.btts} />
        </div>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Likely scorers
        </p>
        {prediction.scorers.length > 0 ? (
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <ScorerList team={event.home_team} scorers={prediction.scorers.filter((s) => s.side === "home")} />
            <ScorerList team={event.away_team} scorers={prediction.scorers.filter((s) => s.side === "away")} />
          </div>
        ) : (
          <p className="text-pretty text-sm text-muted-foreground">
            Bookmakers have not published scorer odds for this match.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Corners and cards <span className="normal-case">(low confidence)</span>
        </p>
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          <MarketCell
            label={`Over ${CORNERS_LINE} corners`}
            detail={`Expected ${prediction.corners.expected}`}
            pair={prediction.corners.over}
          />
          <MarketCell
            label={`Over ${CARDS_LINE} cards`}
            detail={`Expected ${prediction.cards.expected}`}
            pair={prediction.cards.over}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Reasoning
        </p>
        <p className="text-pretty text-sm leading-relaxed text-foreground/90">
          {prediction.reasoning}
        </p>
      </div>

      {prediction.keyFactors.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Key factors
          </p>
          <ol className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {prediction.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-3 p-3.5 text-xs sm:text-sm text-foreground/90">
                <span
                  className="font-mono text-xs tabular-nums text-muted-foreground font-semibold shrink-0"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-pretty leading-relaxed">{factor}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
        <Badge variant="outline" size="sm" className="mb-2">
          Suggested bet
        </Badge>
        <p className="text-balance font-heading text-base sm:text-lg font-semibold text-foreground">
          {prediction.suggestedBet.market}: {prediction.suggestedBet.pick}
        </p>
        {prediction.suggestedBet.rationale && (
          <p className="mt-1.5 text-pretty text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {prediction.suggestedBet.rationale}
          </p>
        )}
      </div>

      <p className="font-mono text-[11px] uppercase tracking-wider tabular-nums text-muted-foreground">
        Generated at {format(new Date(prediction.generatedAt), "HH:mm:ss")}
      </p>
    </div>
  );
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <dt className="uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

// A yes/no market: the AI bar always, the market bar only when the books price it.
function MarketCell({ label, detail, pair }: { label: string; detail?: string; pair: ProbPair }) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase font-medium text-foreground">{label}</span>
        {detail && <span className="font-mono text-xs tabular-nums text-muted-foreground">{detail}</span>}
      </div>
      <div className="mt-3 space-y-2">
        <ProbBar label="AI" value={pair.ai} tone="primary" />
        {pair.market !== null && <ProbBar label="Market" value={pair.market} tone="muted" />}
      </div>
    </div>
  );
}

function ScorerList({ team, scorers }: { team: string; scorers: Scorer[] }) {
  return (
    <div className="bg-card p-4">
      <p className="truncate text-xs text-muted-foreground" title={team}>
        {team}
      </p>
      {scorers.length > 0 ? (
        <table className="mt-2 w-full table-fixed text-sm">
          <colgroup>
            <col />
            <col className="w-12" />
            <col className="w-12" />
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">Player</th>
              <th scope="col">AI probability</th>
              <th scope="col">Bookmaker odds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scorers.map((s) => (
              <tr key={s.player}>
                <th scope="row" className="py-1.5 pr-2 text-left align-top font-medium text-pretty break-words text-foreground">
                  {s.player}
                </th>
                <td className="py-1.5 text-right align-top font-mono text-xs leading-5 tabular-nums text-foreground">
                  {percent(s.ai)}
                </td>
                <td className="py-1.5 text-right align-top font-mono text-xs leading-5 tabular-nums text-muted-foreground">
                  {formatOdds(s.odds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No pick</p>
      )}
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
  const edgeTone =
    edge > 0.03
      ? "text-success font-semibold"
      : edge < -0.03
      ? "text-destructive font-semibold"
      : "text-muted-foreground";

  return (
    <div className="bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase font-medium text-foreground">{label}</span>
        <span className={cn("font-mono text-xs tabular-nums", edgeTone)}>
          <span className="sr-only">AI edge over market </span>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={team}>
        {team}
      </p>
      <div className="mt-3 space-y-2">
        <ProbBar label="AI" value={ai} tone="primary" />
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
  tone: "primary" | "muted";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 font-mono text-xs uppercase text-muted-foreground">{label}</span>
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
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
