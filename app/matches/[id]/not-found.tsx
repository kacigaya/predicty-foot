import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="text-balance font-heading text-5xl font-bold leading-none tracking-tight text-foreground">
        Match not found
      </h1>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        This fixture may have kicked off, been postponed, or dropped out of the odds feed.
      </p>
      <Button render={<Link href="/" />}>Browse upcoming fixtures</Button>
    </div>
  );
}
