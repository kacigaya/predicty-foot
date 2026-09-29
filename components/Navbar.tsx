import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border bg-card/85 shadow-xs backdrop-blur max-sm:px-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md font-heading text-xl font-bold leading-none tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-2xl"
          >
            <span translate="no">
              Predicty
              <em className="-ml-[0.04em] italic text-brand">Foot</em>
            </span>
          </Link>
          <Badge variant="outline" className="max-sm:hidden">
            AI Odds
          </Badge>
        </div>

        <nav aria-label="Primary navigation" className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/#fixtures" />}>
            Fixtures
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href="https://github.com/kacigaya/predicty-foot"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.4 9.4 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
            <span className="max-sm:sr-only">GitHub</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
