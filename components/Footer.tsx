import Link from "next/link";

// On touch screens the links grow to the 44px minimum tap height; the lists drop
// their spacing there so the stack does not get taller than it needs to be.
const linkClass =
  "rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-base font-bold tracking-tight text-foreground" translate="no">
              Predicty
              <em className="-ml-[0.04em] italic text-brand">Foot</em>
            </p>
            <p className="mt-2 max-w-xs text-pretty text-xs leading-relaxed text-muted-foreground">
              Bookmaker odds averaged per fixture, with match predictions from Gemini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">
                Data sources
              </p>
              <ul className="space-y-1.5 pointer-coarse:space-y-0">
                <li>
                  <a
                    href="https://the-odds-api.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    The Odds API
                  </a>
                </li>
                <li>
                  <a
                    href="https://ai.google.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    Google Gemini
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">
                Project
              </p>
              <ul className="space-y-1.5 pointer-coarse:space-y-0">
                <li>
                  <a
                    href="https://github.com/kacigaya/predicty-foot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    Source on GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              Notice
            </p>
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              For entertainment only. Predictions are estimates, never guarantees. Gamble responsibly.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-5 font-mono text-xs text-muted-foreground">
          <p>© {currentYear} Gaya Kaci</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4">
            <Link href="/privacy" className={linkClass}>Privacy policy</Link>
            <Link href="/cookies" className={linkClass}>Cookies</Link>
          </nav>
          <p>MIT License</p>
        </div>
      </div>
    </footer>
  );
}
