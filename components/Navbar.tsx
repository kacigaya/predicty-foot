import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border bg-card/85 px-4 shadow-xs backdrop-blur sm:px-5">
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

        <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-3">
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
            GitHub
          </Button>
        </nav>
      </div>
    </header>
  );
}
