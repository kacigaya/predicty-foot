import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2a25] bg-[#0a0a09]/85 backdrop-blur-md">
      {/* Top meta bar */}
      <div className="border-b border-[#2a2a25]/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            Vol.01 · Edition Live
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            Europe · 2026 Season
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-2xl italic text-[#f4efe2] tracking-tight leading-none">
            Predicty
          </span>
          <span className="font-display text-2xl text-[#d8ff3e] leading-none">
            Foot
          </span>
          <span
            aria-hidden
            className="ml-1 h-1.5 w-1.5 rounded-full bg-[#d8ff3e] shadow-[0_0_10px_#d8ff3e] animate-pulse"
          />
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f4efe2] hover:text-[#d8ff3e] transition-colors"
          >
            Matches
          </Link>
          <a
            href="https://the-odds-api.com/liveapi/guides/v4/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7b7a70] hover:text-[#f4efe2] transition-colors"
          >
            Odds&nbsp;API
          </a>
          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7b7a70] hover:text-[#f4efe2] transition-colors"
          >
            Gemini
          </a>
        </nav>
      </div>
    </header>
  );
}
