import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:pt-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-border bg-background/80 px-4 py-2.5 shadow-xs backdrop-blur-md sm:px-5 sm:py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md text-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-card font-mono text-xs font-bold text-foreground">
              PF
            </span>
            <span className="font-heading text-base font-semibold tracking-tight">
              Predicty <span className="font-normal text-muted-foreground">Foot</span>
            </span>
          </Link>
          <Badge variant="outline" size="sm" className="hidden sm:inline-flex">
            AI Odds
          </Badge>
        </div>

        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#fixtures">Fixtures</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/kacigaya/predicty-foot"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
