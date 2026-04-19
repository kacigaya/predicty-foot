import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#252d3a] bg-[#0e1117]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-black">
            <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <polygon
                points="12,7 15.5,10 14,14.5 10,14.5 8.5,10"
                fill="currentColor"
                fillOpacity="0.6"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-white">
              Predicty<span className="text-amber-400 ml-0.5">Foot</span>
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-[#7c8494] hover:bg-[#1e2430] hover:text-white transition-colors"
          >
            Matches
          </Link>
          <a
            href="https://the-odds-api.com/liveapi/guides/v4/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 text-[#7c8494] hover:bg-[#1e2430] hover:text-white transition-colors"
          >
            Odds API
          </a>
        </nav>
      </div>
    </header>
  );
}
