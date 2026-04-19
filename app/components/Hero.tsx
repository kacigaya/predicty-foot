import { Activity, BarChart3, Target } from "lucide-react";

export function Hero() {
  return (
    <section className="border-b border-[#252d3a]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Odds meet{" "}
            <span className="text-amber-400">intelligence</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-[#7c8494] sm:text-lg">
            Live bookmaker consensus from Europe&apos;s top leagues,
            fused with AI analysis — scorelines, confidence,
            and value bets.
          </p>

          <div className="mt-10 grid w-full max-w-xl gap-px overflow-hidden rounded-lg border border-[#252d3a] bg-[#252d3a] sm:grid-cols-3">
            <HeroStat icon={Activity} label="Real-time" value="Live odds" />
            <HeroStat icon={Target} label="Analysis" value="AI predictions" />
            <HeroStat icon={BarChart3} label="Edge" value="Value bets" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#161b22] px-4 py-3.5">
      <Icon className="size-4 text-amber-500 shrink-0" />
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-wider text-[#4a5060] font-medium">{label}</p>
        <p className="text-sm font-semibold text-[#e4e8ee]">{value}</p>
      </div>
    </div>
  );
}
