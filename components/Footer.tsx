export function Footer() {
  return (
    <footer className="border-t border-[#2a2a25] mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-3xl italic text-[#f4efe2] leading-none">
              Predicty<span className="text-[#d8ff3e] not-italic">Foot</span>
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              Where numbers meet intuition
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              Data
            </p>
            <a
              href="https://the-odds-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[#f4efe2] hover:text-[#d8ff3e] transition-colors"
            >
              The Odds API →
            </a>
            <a
              href="https://ai.google.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[#f4efe2] hover:text-[#d8ff3e] transition-colors"
            >
              Google Gemini →
            </a>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              Notice
            </p>
            <p className="text-xs leading-relaxed text-[#7b7a70]">
              For entertainment only. Predictions are probabilistic, never guaranteed. Please gamble responsibly.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-[#2a2a25] pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
            © {new Date().getFullYear()} · No. {new Date().getMonth() + 1}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
            Made in the margin
          </p>
        </div>
      </div>
    </footer>
  );
}
