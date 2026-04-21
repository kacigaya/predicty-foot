import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-5 px-4 py-32">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d8ff3e]">
        404 · Missing fixture
      </p>
      <h1 className="font-display text-6xl italic text-[#f4efe2] leading-none">
        The match has<br />
        slipped <span className="text-[#7b7a70]">away.</span>
      </h1>
      <p className="text-sm leading-relaxed text-[#7b7a70]">
        This fixture may have already kicked off, been postponed, or isn&apos;t available from our odds provider.
      </p>
      <Button asChild>
        <Link href="/">Browse upcoming →</Link>
      </Button>
    </div>
  );
}
