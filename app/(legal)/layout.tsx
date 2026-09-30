import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button variant="ghost" size="sm" render={<Link href="/" />}>
        <ArrowLeft aria-hidden />
        Back to matches
      </Button>
      <article className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h1]:text-balance [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:text-balance [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-pretty [&_p+p]:mt-3 [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring">
        {children}
      </article>
    </div>
  );
}
