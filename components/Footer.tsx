export function Footer() {
  return (
    <footer className="border-t border-[#252d3a] mt-16">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#7c8494] sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Predicty Foot &middot; Odds from{" "}
            <a
              href="https://the-odds-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e4e8ee] hover:text-amber-400 transition-colors"
            >
              The Odds API
            </a>{" "}
            &middot; Predictions by{" "}
            <a
              href="https://ai.google.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e4e8ee] hover:text-amber-400 transition-colors"
            >
              Google Gemini
            </a>
          </p>
          <p className="text-[#4a5060]">
            For entertainment. Please gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
