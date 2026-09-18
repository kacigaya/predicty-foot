const linkClass =
  "rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-base font-semibold tracking-tight text-foreground">
              Predicty <span className="text-brand">Foot</span>
            </p>
            <p className="mt-2 max-w-xs text-pretty text-xs leading-relaxed text-muted-foreground">
              Averaged bookmaker odds combined with Gemini AI probabilistic match predictions.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Data sources
              </p>
              <ul className="space-y-1.5">
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
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Project
              </p>
              <ul className="space-y-1.5">
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
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Notice
            </p>
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              For entertainment only. AI predictions are probabilistic estimations, never guarantees. Gamble responsibly.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-5 font-mono text-xs text-muted-foreground">
          <p>© {currentYear} Gaya Kaci</p>
          <p>MIT License</p>
        </div>
      </div>
    </footer>
  );
}
