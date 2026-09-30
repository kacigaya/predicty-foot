"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Keeps the navbar and footer when a page throws; without it Next replaces the
// whole document with its default "Application error" screen.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Error</p>
      <h1 className="text-balance font-heading text-5xl font-bold leading-none tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        This page failed to render. Try again, or go back to the fixtures.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Browse upcoming fixtures
        </Button>
      </div>
    </div>
  );
}
