import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="rounded-sm font-display text-2xl leading-none text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Predicty <span className="text-accent">Foot</span>
        </Link>
        <p className="hidden font-mono text-xs uppercase text-muted sm:block">
          Odds and AI predictions
        </p>
      </div>
    </header>
  );
}
