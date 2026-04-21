export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#2a2a25]">
      {/* Decorative glow */}
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full blur-3xl opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #d8ff3e 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        {/* Category tag */}
        <div className="mb-10 flex items-center gap-4">
          <span className="h-px w-12 bg-[#d8ff3e]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d8ff3e]">
            The Saturday Briefing · Issue 042
          </p>
        </div>

        {/* Mast headline */}
        <h1 className="font-display text-[56px] leading-[0.95] tracking-tight text-[#f4efe2] sm:text-[88px] lg:text-[128px]">
          Odds, read like<br />
          <span className="italic">
            a{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#0a0a09]">novel</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-2 h-[0.7em] bg-[#d8ff3e] -skew-x-6"
              />
            </span>
            .
          </span>
        </h1>

        <div className="mt-12 grid gap-12 sm:grid-cols-12 sm:gap-8">
          <div className="sm:col-span-5 sm:col-start-1">
            <p className="text-lg leading-relaxed text-[#c7c2b4] sm:text-xl">
              Live market consensus from Europe&apos;s top flights, fused with Gemini&apos;s match reading. Scorelines, conviction, value — served cold.
            </p>
          </div>

          <div className="sm:col-span-6 sm:col-start-7 grid grid-cols-3 gap-6 border-t border-[#2a2a25] pt-6">
            <Stat index="01" label="Feed" value="Live" />
            <Stat index="02" label="Lens" value="Gemini" />
            <Stat index="03" label="Angle" value="Value" />
          </div>
        </div>
      </div>

      {/* Ticker strip */}
      <div className="relative border-t border-[#2a2a25] bg-[#131311] py-2.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker font-mono text-[11px] uppercase tracking-[0.2em] text-[#7b7a70]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center">
              <TickerItem label="EPL" value="+0.12" />
              <TickerItem label="La Liga" value="−0.04" tone="down" />
              <TickerItem label="Bundesliga" value="+0.21" />
              <TickerItem label="Serie A" value="+0.08" />
              <TickerItem label="Ligue 1" value="−0.15" tone="down" />
              <TickerItem label="Eredivisie" value="+0.02" />
              <TickerItem label="Primeira" value="+0.11" />
              <TickerItem label="Champions Lg" value="+0.33" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({
  index,
  label,
  value,
}: {
  index: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
        {index} / {label}
      </p>
      <p className="mt-1 font-display text-2xl text-[#f4efe2]">{value}</p>
    </div>
  );
}

function TickerItem({
  label,
  value,
  tone = "up",
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <span className="mx-6 flex items-center gap-3">
      <span className="text-[#f4efe2]">{label}</span>
      <span
        className={
          tone === "up" ? "text-[#d8ff3e]" : "text-[#ff5b36]"
        }
      >
        {value}
      </span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-[#4a4a44]" />
    </span>
  );
}
