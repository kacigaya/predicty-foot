const linkClass =
  "rounded-sm text-sm text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl leading-none text-foreground">
              Predicty <span className="text-accent">Foot</span>
            </p>
            <p className="mt-3 text-pretty text-xs leading-relaxed text-muted">
              Averaged bookmaker odds with a Gemini prediction for each fixture.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-2 font-mono text-xs uppercase text-muted">Data</p>
              <ul className="space-y-1.5">
                <li>
                  <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className={linkClass}>
                    The Odds API
                  </a>
                </li>
                <li>
                  <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Google Gemini
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs uppercase text-muted">Project</p>
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
            <p className="mb-2 font-mono text-xs uppercase text-muted">Notice</p>
            <p className="text-pretty text-xs leading-relaxed text-muted">
              For entertainment only. Predictions are probabilistic, never guaranteed. Gamble responsibly.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
          <p className="font-mono text-xs uppercase text-muted">
            © {new Date().getFullYear()} Gaya Kaci
          </p>
          <p className="font-mono text-xs uppercase text-muted">MIT License</p>
        </div>
      </div>
    </footer>
  );
}
